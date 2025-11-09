from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.user_repository import UserRepository
from app.repositories.user_profile_repository import UserProfileRepository


class AttendanceService:
    """出欠管理のビジネスロジックを実装するクラス"""

    def __init__(
        self, 
        attendance_repository: AttendanceRepository,
        user_repository: Optional[UserRepository] = None,
        user_profile_repository: Optional[UserProfileRepository] = None
    ):
        self.repository = attendance_repository
        self.user_repository = user_repository
        self.user_profile_repository = user_profile_repository

    async def get_all_attendances(self) -> List[Dict[str, Any]]:
        """すべての出欠記録を取得"""
        return await self.repository.find_all()

    async def get_attendance(self, attendance_id: UUID) -> Dict[str, Any]:
        """指定したIDの出欠記録を取得"""
        attendance = await self.repository.find_by_id(attendance_id)
        if not attendance:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return attendance

    async def get_attendances_by_practice(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの出欠記録を取得"""
        return await self.repository.find_by_practice_schedule(practice_schedule_id)

    async def get_attendances_by_user(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーの出欠記録を取得"""
        return await self.repository.find_by_user(user_id)

    async def get_attendance_by_practice_and_user(
        self, practice_schedule_id: UUID, user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """指定した練習とユーザーの組み合わせの出欠記録を取得"""
        return await self.repository.find_by_practice_and_user(practice_schedule_id, user_id)

    async def create_attendance(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成"""
        # 既存の記録があるかチェック
        existing = await self.repository.find_by_practice_and_user(
            attendance_data["practice_schedule_id"], attendance_data["user_id"]
        )
        if existing:
            raise APIException("既にこの練習の出欠記録が存在します")
        
        return await self.repository.create(attendance_data)

    async def update_attendance(self, attendance_id: UUID, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を更新"""
        # 存在チェック
        existing = await self.repository.find_by_id(attendance_id)
        if not existing:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        return await self.repository.update(attendance_id, attendance_data)

    async def upsert_attendance(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）"""
        return await self.repository.upsert(attendance_data)

    async def remove_attendance(self, attendance_id: UUID) -> bool:
        """出欠記録を削除"""
        attendance = await self.repository.find_by_id(attendance_id)
        if not attendance:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        await self.repository.delete(attendance_id)
        return True

    async def get_attendance_summary(self) -> List[Dict[str, Any]]:
        """練習別の出欠サマリーを取得"""
        return await self.repository.get_attendance_summary()

    async def get_user_attendance_history(self) -> List[Dict[str, Any]]:
        """ユーザー別の出欠履歴を取得"""
        return await self.repository.get_user_attendance_history()

    async def bulk_update_attendances(
        self, practice_schedule_id: UUID, attendances: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """複数の出欠記録を一括更新"""
        results = []
        for attendance_data in attendances:
            attendance_data["practice_schedule_id"] = practice_schedule_id
            result = await self.repository.upsert(attendance_data)
            results.append(result)
        return results

    async def get_users_with_attendance_for_admin(
        self,
        practice_schedule_id: Optional[UUID] = None,
        status: Optional[str] = None,
        user_name: Optional[str] = None,
        page: int = 1,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        管理者用：ユーザー情報と出席記録を結合して取得（最適化版）
        
        Args:
            practice_schedule_id: 練習スケジュールID（任意）
            status: 出席状況フィルタ（任意、'unregistered'で未登録を指定可能）
            user_name: ユーザー名フィルタ（部分一致、任意）
            page: ページ番号（デフォルト1）
            limit: 1ページあたりの件数（デフォルト100、最大100）
        
        Returns:
            ユーザー情報と出席記録を結合した配列
        """
        if not self.user_repository or not self.user_profile_repository:
            raise APIException("UserRepository and UserProfileRepository are required for this operation")
        
        # limitの最大値を100に制限
        limit = min(limit, 100)
        offset = (page - 1) * limit
        
        # ステップ1: ユーザー名フィルタがある場合、まずuser_profilesからuser_idを取得
        filtered_user_ids = None
        if user_name:
            search_pattern = f"%{user_name}%"
            response = (
                self.user_profile_repository.client.table("user_profiles")
                .select("user_id")
                .or_(f"first_name_kanji.ilike.{search_pattern},last_name_kanji.ilike.{search_pattern}")
                .execute()
            )
            filtered_user_ids = [str(p["user_id"]) for p in (response.data or [])]
            if not filtered_user_ids:
                # マッチするユーザーがいない場合は空の結果を返す
                return []
        
        # ステップ2: 出席記録を取得（practice_schedule_idが指定されている場合）
        attendance_dict = {}
        if practice_schedule_id:
            attendances = await self.repository.find_by_practice_schedule(practice_schedule_id)
            attendance_dict = {str(a["user_id"]): a for a in attendances}
            
            # ステータスフィルタがある場合、出席記録を事前にフィルタリング
            if status and status != "unregistered":
                attendance_dict = {
                    uid: att for uid, att in attendance_dict.items()
                    if att.get("status") == status
                }
                # フィルタ後のuser_idリストを取得
                if filtered_user_ids is None:
                    filtered_user_ids = list(attendance_dict.keys())
                else:
                    # 両方のフィルタを適用
                    filtered_user_ids = [uid for uid in filtered_user_ids if uid in attendance_dict]
        
        # ステップ3: ユーザーを取得（フィルタリングされたuser_idがある場合のみ）
        if filtered_user_ids:
            # フィルタリングされたユーザーのみ取得
            users = []
            # Supabaseの`in_`を使用してバッチ取得
            # ただし、Supabaseの`in_`は配列の長さに制限があるため、チャンクに分割
            chunk_size = 100
            for i in range(0, len(filtered_user_ids), chunk_size):
                chunk = filtered_user_ids[i:i + chunk_size]
                response = (
                    self.user_repository.client.table("users")
                    .select("id, email")
                    .in_("id", chunk)
                    .execute()
                )
                users.extend(response.data or [])
        else:
            # フィルタがない場合は全ユーザーを取得
            users = await self.user_repository.get_all_users()
        
        # ステップ4: プロフィールをバッチ取得（必要なuser_idのみ）
        user_ids = [str(u["id"]) for u in users]
        profiles_dict = {}
        if user_ids:
            # チャンクに分割して取得
            chunk_size = 100
            for i in range(0, len(user_ids), chunk_size):
                chunk = user_ids[i:i + chunk_size]
                response = (
                    self.user_profile_repository.client.table("user_profiles")
                    .select("user_id, first_name_kanji, last_name_kanji")
                    .in_("user_id", chunk)
                    .execute()
                )
                for profile in (response.data or []):
                    profiles_dict[str(profile["user_id"])] = profile
        
        # ステップ5: データを結合
        result = []
        for user in users:
            user_id = str(user["id"])
            
            # 出席記録を取得
            attendance = attendance_dict.get(user_id)
            
            # ステータスフィルタ（unregisteredの場合）
            if status == "unregistered":
                if attendance is not None:
                    continue
            elif status and status != "unregistered":
                # 既に出席記録でフィルタリング済みなので、ここではスキップ
                if not attendance:
                    continue
            
            # プロフィールを取得
            profile = profiles_dict.get(user_id)
            
            # レスポンス形式に整形
            user_data = {
                "user": {
                    "id": user["id"],
                    "name": user.get("name") or "--",
                    "email": user.get("email", ""),
                }
            }

            # プロフィール情報を追加
            if profile:
                user_data["user"]["first_name_kanji"] = profile.get("first_name_kanji")
                user_data["user"]["last_name_kanji"] = profile.get("last_name_kanji")
                user_data["user"]["name"] = f"{profile.get('last_name_kanji', '')} {profile.get('first_name_kanji', '')}".strip() or "--"
            
            # 出席記録を追加
            if attendance:
                user_data["attendance"] = {
                    "id": attendance.get("id"),
                    "practice_schedule_id": attendance.get("practice_schedule_id"),
                    "user_id": attendance.get("user_id"),
                    "status": attendance.get("status"),
                    "notes": attendance.get("notes"),
                    "available_from": attendance.get("available_from"),
                    "available_to": attendance.get("available_to"),
                }
            else:
                user_data["attendance"] = None
            
            result.append(user_data)
        
        # ステップ6: ページネーション
        paginated_result = result[offset:offset + limit]
        
        return paginated_result


