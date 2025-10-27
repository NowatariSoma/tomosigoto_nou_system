from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from app.repositories.venue_repository import VenueRepository
from app.repositories.session_instructor_repository import SessionInstructorRepository
from app.core.config import settings


class PracticeScheduleService:
    """練習スケジュール関連の機能を実装するクラス"""

    def __init__(
        self,
        practice_schedule_repository: PracticeScheduleRepository,
        schedule_available_venue_repository: ScheduleAvailableVenueRepository,
        session_repository: SessionRepository,
        session_instructor_repository: SessionInstructorRepository,
        venue_repository: VenueRepository,
        auth_client,
    ):
        self.practice_schedule_repository = practice_schedule_repository
        self.schedule_available_venue_repository = schedule_available_venue_repository
        self.session_repository = session_repository
        self.session_instructor_repository = session_instructor_repository
        self.venue_repository = venue_repository
        self.auth_client = auth_client

    # ===== 練習スケジュール CRUD =====

    async def get_all_practice_schedules(self) -> List[Dict[str, Any]]:
        """すべての練習スケジュールを取得"""
        schedules = await self.practice_schedule_repository.find_all()
        
        # 各スケジュールに会場情報を追加
        for schedule in schedules:
            schedule_id = schedule.get("id")
            if schedule_id:
                try:
                    # 複数部屋選択対応: 会場情報を追加
                    venues = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
                    schedule["venue_ids"] = [v["venue_id"] for v in venues]
                    
                    # 会場詳細情報を取得
                    venue_details = []
                    for venue in venues:
                        try:
                            # 会場詳細情報を取得
                            venue_info = await self.venue_repository.find_by_id(venue["venue_id"])
                            if venue_info:
                                venue_details.append({
                                    "id": venue["venue_id"],
                                    "name": venue_info.get("name", "不明な会場"),
                                    "campus": venue_info.get("campus", "不明なキャンパス")
                                })
                        except Exception as e:
                            print(f"DEBUG: 会場情報取得エラー venue_id={venue['venue_id']}, error={e}")
                            # エラーの場合は基本的な情報のみ
                            venue_details.append({
                                "id": venue["venue_id"],
                                "name": "不明な会場",
                                "campus": "不明なキャンパス"
                            })
                    
                    schedule["venues"] = venue_details
                except Exception as e:
                    print(f"DEBUG: スケジュール {schedule_id} の会場情報取得エラー: {e}")
                    schedule["venue_ids"] = []
                    schedule["venues"] = []
                
                # 会場情報が空の場合、デフォルトの会場情報を設定（一時的な解決策）
                if not schedule.get("venue_ids") and not schedule.get("venues"):
                    print(f"DEBUG: スケジュール {schedule_id} に会場情報がありません。デフォルト値を設定します。")
                    schedule["venue_ids"] = []
                    schedule["venues"] = []
                    
                    # 既存のスケジュールにデフォルトの会場情報を追加（マイグレーション処理）
                    try:
                        # 利用可能な会場を取得
                        available_venues = await self.venue_repository.find_all()
                        if available_venues:
                            # 最初の会場をデフォルトとして設定
                            default_venue = available_venues[0]
                            venue_data = {
                                "schedule_id": str(schedule_id),
                                "venue_id": str(default_venue["id"]),
                                "is_preferred": True,
                                "priority": 0,
                                "notes": "マイグレーション処理で追加"
                            }
                            await self.schedule_available_venue_repository.create(venue_data)
                            print(f"DEBUG: スケジュール {schedule_id} にデフォルト会場 {default_venue['name']} を追加しました。")
                            
                            # 追加した会場情報を反映
                            schedule["venue_ids"] = [default_venue["id"]]
                            schedule["venues"] = [{
                                "id": default_venue["id"],
                                "name": default_venue.get("name", "不明な会場"),
                                "campus": default_venue.get("campus", "不明なキャンパス")
                            }]
                    except Exception as migration_error:
                        print(f"DEBUG: マイグレーション処理エラー: {migration_error}")
                        schedule["venue_ids"] = []
                        schedule["venues"] = []
            else:
                schedule["venue_ids"] = []
                schedule["venues"] = []
        
        return schedules

    async def get_practice_schedule(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定した練習スケジュール情報を取得"""
        print(f"DEBUG get_practice_schedule: schedule_id={schedule_id}, type={type(schedule_id)}")
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        print(f"DEBUG get_practice_schedule: schedule={schedule}")
        if not schedule:
            print(f"DEBUG get_practice_schedule: Schedule not found for id={schedule_id}")
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        
        # 複数部屋選択対応: 会場情報を追加
        venues = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
        schedule["venue_ids"] = [v["venue_id"] for v in venues]
        
        # 会場詳細情報を取得
        venue_details = []
        for venue in venues:
            try:
                # 会場詳細情報を取得
                venue_info = await self.venue_repository.find_by_id(venue["venue_id"])
                if venue_info:
                    venue_details.append({
                        "id": venue["venue_id"],
                        "name": venue_info.get("name", "不明な会場"),
                        "campus": venue_info.get("campus", "不明なキャンパス")
                    })
            except Exception as e:
                print(f"DEBUG: 会場情報取得エラー venue_id={venue['venue_id']}, error={e}")
                # エラーの場合は基本的な情報のみ
                venue_details.append({
                    "id": venue["venue_id"],
                    "name": "不明な会場",
                    "campus": "不明なキャンパス"
                })
        
        schedule["venues"] = venue_details
        print(f"DEBUG get_practice_schedule: 最終的なschedule={schedule}")
        
        return schedule

    async def get_practice_schedule_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定した日付の練習スケジュール情報を取得"""
        schedule = await self.practice_schedule_repository.find_by_date(target_date)
        return schedule  # None を返すことで、エンドポイント側で404を返す

    async def get_practice_schedule_with_details(self, schedule_id: UUID) -> Dict[str, Any]:
        """練習スケジュールの詳細情報（利用可能会場、セッション含む）を取得"""
        schedule = await self.practice_schedule_repository.find_with_details(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        return schedule

    async def get_practice_schedule_for_display(self, schedule_id: UUID) -> Dict[str, Any]:
        """練習表表示用の練習スケジュール情報を取得（名前情報含む）"""
        schedule = await self.practice_schedule_repository.find_for_display(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        return schedule

    async def create_practice_schedule(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習スケジュールを作成"""
        # created_byとupdated_byを除外（データベースで自動設定される）
        schedule_data.pop("created_by", None)
        schedule_data.pop("updated_by", None)
        
        # 複数部屋選択対応: venue_idsを抽出
        venue_ids = schedule_data.pop("venue_ids", None)
        
        # 練習スケジュールを作成
        created_schedule = await self.practice_schedule_repository.create(schedule_data)
        
        # 複数部屋選択対応: schedule_available_venuesテーブルに会場情報を保存
        if venue_ids:
            for i, venue_id in enumerate(venue_ids):
                # UUIDオブジェクトを文字列に変換
                from uuid import UUID
                venue_data = {
                    "schedule_id": str(created_schedule["id"]) if isinstance(created_schedule["id"], UUID) else created_schedule["id"],
                    "venue_id": str(venue_id) if isinstance(venue_id, UUID) else venue_id,
                    "is_preferred": i == 0,  # 最初の会場を優先会場とする
                    "priority": i,
                    "notes": None
                }
                await self.schedule_available_venue_repository.create(venue_data)
        
        # 作成されたスケジュールに会場情報を追加
        created_schedule["venue_ids"] = venue_ids or []
        created_schedule["venues"] = []  # 会場詳細情報は別途取得が必要
        
        return created_schedule

    async def update_practice_schedule(
        self, schedule_id: UUID, schedule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """指定した練習スケジュール情報を更新"""
        try:
            print(f"DEBUG update_practice_schedule: schedule_id={schedule_id}, schedule_data={schedule_data}")
            
            schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
            if not schedule:
                raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

            # created_byとupdated_byを除外（データベースで自動設定される）
            schedule_data.pop("created_by", None)
            schedule_data.pop("updated_by", None)
            
            # 複数部屋選択対応: venue_idsを抽出
            venue_ids = schedule_data.pop("venue_ids", None)
            print(f"DEBUG update_practice_schedule: venue_ids={venue_ids}")
            
            # 練習スケジュールを更新
            updated_schedule = await self.practice_schedule_repository.update(schedule_id, schedule_data)
            print(f"DEBUG update_practice_schedule: updated_schedule={updated_schedule}")
            
            # 複数部屋選択対応: 会場情報を更新
            if venue_ids is not None:
                print(f"DEBUG update_practice_schedule: 会場情報を更新開始")
                # 既存の会場情報を削除
                await self.schedule_available_venue_repository.delete_by_schedule(schedule_id)
                print(f"DEBUG update_practice_schedule: 既存会場情報を削除完了")
                
                # 新しい会場情報を追加
                for i, venue_id in enumerate(venue_ids):
                    # UUIDオブジェクトを文字列に変換
                    from uuid import UUID
                    venue_data = {
                        "schedule_id": str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id,
                        "venue_id": str(venue_id) if isinstance(venue_id, UUID) else venue_id,
                        "is_preferred": i == 0,  # 最初の会場を優先会場とする
                        "priority": i,
                        "notes": None
                    }
                    print(f"DEBUG update_practice_schedule: 会場データ作成 venue_data={venue_data}")
                    await self.schedule_available_venue_repository.create(venue_data)
                    print(f"DEBUG update_practice_schedule: 会場データ作成完了 venue_id={venue_id}")
                
                updated_schedule["venue_ids"] = venue_ids
                print(f"DEBUG update_practice_schedule: 会場情報更新完了")
                # 更新された会場情報を取得
                venues_for_details = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
            else:
                # venue_idsが指定されていない場合は既存の情報を保持
                venues_for_details = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
                updated_schedule["venue_ids"] = [v["venue_id"] for v in venues_for_details]
                print(f"DEBUG update_practice_schedule: 既存会場情報を保持")
            
            # 会場詳細情報を取得
            venue_details = []
            for venue in venues_for_details:
                try:
                    # 会場詳細情報を取得
                    venue_info = await self.venue_repository.find_by_id(venue["venue_id"])
                    if venue_info:
                        venue_details.append({
                            "id": venue["venue_id"],
                            "name": venue_info.get("name", "不明な会場"),
                            "campus": venue_info.get("campus", "不明なキャンパス")
                        })
                except Exception as e:
                    print(f"DEBUG: 会場情報取得エラー venue_id={venue['venue_id']}, error={e}")
                    # エラーの場合は基本的な情報のみ
                    venue_details.append({
                        "id": venue["venue_id"],
                        "name": "不明な会場",
                        "campus": "不明なキャンパス"
                    })
            
            updated_schedule["venues"] = venue_details
            print(f"DEBUG update_practice_schedule: 最終的なupdated_schedule={updated_schedule}")
            
            return updated_schedule
        except Exception as e:
            print(f"DEBUG update_practice_schedule: エラー発生: {e}")
            print(f"DEBUG update_practice_schedule: エラータイプ: {type(e)}")
            import traceback
            print(f"DEBUG update_practice_schedule: スタックトレース: {traceback.format_exc()}")
            raise

    async def remove_practice_schedule(self, schedule_id: UUID) -> bool:
        """指定した練習スケジュールを削除"""
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

        # 関連データを削除
        await self.session_instructor_repository.delete_by_schedule(schedule_id)
        await self.session_repository.delete_by_schedule(schedule_id)
        await self.schedule_available_venue_repository.delete_by_schedule(schedule_id)

        # 練習スケジュール本体を削除
        await self.practice_schedule_repository.delete(schedule_id)

        return True

    # ===== スケジュール利用可能会場 CRUD =====

    async def get_schedule_available_venues(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールの利用可能会場を取得"""
        return await self.schedule_available_venue_repository.find_by_schedule(schedule_id)

    async def add_schedule_available_venue(
        self, venue_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """スケジュールに利用可能会場を追加"""
        return await self.schedule_available_venue_repository.create(venue_data)

    async def update_schedule_available_venue(
        self, venue_id: UUID, venue_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """スケジュール利用可能会場を更新"""
        return await self.schedule_available_venue_repository.update(venue_id, venue_data)

    async def remove_schedule_available_venue(self, venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        await self.schedule_available_venue_repository.delete(venue_id)
        return True

    # ===== セッション CRUD =====

    async def get_sessions_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールのセッション一覧を取得"""
        try:
            sessions = await self.session_repository.find_by_schedule(schedule_id)

            # 各セッションに指導者情報を追加
            for session in sessions:
                # 指導者機能は一旦実装しない
                session["instructors"] = []

            return sessions
        except Exception as e:
            print(f"Error fetching sessions for schedule {schedule_id}: {e}")
            raise APIException(ErrorMessage.DATABASE_ERROR)

    async def get_session(self, session_id: UUID) -> Dict[str, Any]:
        """指定したセッション情報を取得"""
        try:
            session = await self.session_repository.find_by_id(session_id)
            if not session:
                raise APIException(ErrorMessage.SESSION_NOT_FOUND)

            # 指導者機能は一旦実装しない
            session["instructors"] = []

            return session
        except APIException:
            raise
        except Exception as e:
            print(f"Error fetching session {session_id}: {e}")
            raise APIException(ErrorMessage.DATABASE_ERROR)

    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッションを作成"""
        print(f"DEBUG create_session: 受信データ = {session_data}")

        # sessionsテーブルに存在しないカラムを削除
        session_data = {k: v for k, v in session_data.items() if k != "part_name"}

        # UUIDフィールドを文字列に変換
        if "schedule_id" in session_data and isinstance(session_data["schedule_id"], UUID):
            session_data["schedule_id"] = str(session_data["schedule_id"])
        if "part_id" in session_data and isinstance(session_data["part_id"], UUID):
            session_data["part_id"] = str(session_data["part_id"])
        if "schedule_available_venue_id" in session_data and isinstance(session_data["schedule_available_venue_id"], UUID):
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])

        print(f"DEBUG create_session: 変換後データ = {session_data}")

        result = await self.session_repository.create(session_data)
        print(f"DEBUG create_session: 作成成功 = {result}")
        return result

    async def update_session(
        self, session_id: UUID, session_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """指定したセッション情報を更新"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        return await self.session_repository.update(session_id, session_data)

    async def move_session(
        self, session_id: UUID, target_venue_id: UUID, target_slot_order: int
    ) -> Dict[str, Any]:
        """セッションを別の会場・時限に移動"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        old_schedule_available_venue_id = session.get("schedule_available_venue_id")
        old_slot_order = session.get("slot_order")
        schedule_id = session.get("schedule_id")

        # target_venue_idは既にschedule_available_venue_idである可能性が高い
        # まず、schedule_available_venuesテーブルでIDを検索
        schedule_available_venue = None
        try:
            if isinstance(target_venue_id, UUID):
                search_id = target_venue_id
            else:
                search_id = UUID(target_venue_id)
                
            schedule_available_venue = await self.schedule_available_venue_repository.find_by_id(search_id)
        except Exception as e:
            print(f"DEBUG move_session: find_by_idエラー: {e}")
        
        if schedule_available_venue:
            target_schedule_available_venue_id = schedule_available_venue.get("id")
        else:
            # find_by_idで見つからない場合は、venue_idから変換を試みる
            schedule_available_venue = await self.schedule_available_venue_repository.find_by_schedule_and_venue(
                schedule_id, target_venue_id
            )
            if schedule_available_venue:
                target_schedule_available_venue_id = schedule_available_venue.get("id")
            else:
                raise APIException(ErrorMessage.SCHEDULE_VENUE_NOT_FOUND)

        if str(old_schedule_available_venue_id) == str(target_schedule_available_venue_id) and old_slot_order == target_slot_order:
            return session

        sessions_in_old_venue = await self.session_repository.find_by_schedule(schedule_id)
        sessions_in_old_venue = [
            s for s in sessions_in_old_venue
            if str(s.get("schedule_available_venue_id")) == str(old_schedule_available_venue_id)
            and str(s.get("id")) != str(session_id)
        ]

        # 新しいvenue側のセッションを取得
        sessions_in_new_venue = await self.session_repository.find_by_schedule(schedule_id)
        sessions_in_new_venue = [
            s for s in sessions_in_new_venue
            if str(s.get("schedule_available_venue_id")) == str(target_schedule_available_venue_id)
            and str(s.get("id")) != str(session_id)
        ]

        # 新しいvenue側で、target_slot_order以上のセッションのslot_orderを+1
        for s in sessions_in_new_venue:
            if s.get("slot_order", 0) >= target_slot_order:
                await self.session_repository.update(
                    s["id"],
                    {"slot_order": s["slot_order"] + 1}
                )

        # セッションを更新
        updated_session = await self.session_repository.update(
            session_id,
            {
                "schedule_available_venue_id": str(target_schedule_available_venue_id),
                "slot_order": target_slot_order
            }
        )

        # 古いvenue側で、old_slot_orderより後のセッションのslot_orderを-1
        for s in sessions_in_old_venue:
            if s.get("slot_order", 0) > old_slot_order:
                await self.session_repository.update(
                    s["id"],
                    {"slot_order": s["slot_order"] - 1}
                )

        # 更新後のセッションを取得し、パート名を含む詳細情報を追加
        # session_repository.find_by_idはpart_nameを含めて返すため、そのまま使用
        detailed_session = await self.session_repository.find_by_id(session_id)
        return detailed_session if detailed_session else updated_session

    async def remove_session(self, session_id: UUID) -> bool:
        """指定したセッションを削除"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        # 関連する指導者情報を削除（新しい構造では不要）
        # await self.session_instructor_repository.delete_by_session(session_id)

        # セッション本体を削除
        await self.session_repository.delete(session_id)

        return True

    # ===== セッション指導者 CRUD =====
    # 注意: これらの機能は新しいSessionInstructorServiceに移行されました
    # 新しいテーブル構造では session_id ではなく schedule_id + slot_order を使用します

    # async def get_session_instructors(self, session_id: UUID) -> List[Dict[str, Any]]:
    #     """指定したセッションの指導者一覧を取得"""
    #     return await self.session_instructor_repository.find_by_session(session_id)

    # async def add_session_instructor(
    #     self, instructor_data: Dict[str, Any]
    # ) -> Dict[str, Any]:
    #     """セッションに指導者を追加"""
    #     return await self.session_instructor_repository.create(instructor_data)

    # async def remove_session_instructor(self, instructor_id: UUID) -> bool:
    #     """セッション指導者を削除"""
    #     await self.session_instructor_repository.delete(instructor_id)
    #     return True

    # ===== 複合操作 =====


    async def update_practice_schedule_with_details(
        self, schedule_id: UUID, schedule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """練習スケジュールを関連データと一緒に更新"""
        # 練習スケジュール存在確認
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

        # 練習スケジュール本体を更新
        base_schedule_data = {
            k: v
            for k, v in schedule_data.items()
            if k in ["schedule_date", "start_time", "end_time", "title", "description", "schedule_type", "status", "updated_by"]
        }

        if base_schedule_data:
            await self.practice_schedule_repository.update(schedule_id, base_schedule_data)

        # 利用可能会場を更新（既存を削除して再作成）
        if "available_venues" in schedule_data:
            await self.schedule_available_venue_repository.delete_by_schedule(schedule_id)
            for venue_data in schedule_data["available_venues"]:
                venue_data["schedule_id"] = schedule_id
                await self.schedule_available_venue_repository.create(venue_data)

        # セッションを更新（既存を削除して再作成）
        # 注意: 新しいテーブル構造に対応するため、一時的にコメントアウト
        # if "sessions" in schedule_data:
        #     await self.session_instructor_repository.delete_by_schedule(schedule_id)
        #     await self.session_repository.delete_by_schedule(schedule_id)

        #     for session_data in schedule_data["sessions"]:
        #         session_data["schedule_id"] = schedule_id
        #         instructors_data = session_data.pop("instructors", [])

        #         created_session = await self.session_repository.create(session_data)
        #         session_id = created_session["id"]

        #         # 指導者を追加
        #         for instructor_data in instructors_data:
        #             instructor_data["session_id"] = session_id
        #             await self.session_instructor_repository.create(instructor_data)

        # 更新された詳細情報を返す
        return await self.get_practice_schedule_with_details(schedule_id)

    # ===== ヘルパーメソッド =====

    async def _get_venues_with_colors(self, schedule_id: UUID = None) -> List[Dict[str, Any]]:
        """会場情報を色情報とともに取得"""
        venues = []

        if schedule_id:
            # スケジュールに関連付けられた会場を取得
            try:
                schedule_venues = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
                for i, schedule_venue in enumerate(schedule_venues):
                    # 修正されたfind_by_scheduleメソッドから取得したデータを処理
                    venue_name = schedule_venue.get("name", f"会場{i+1}")
                    is_preferred = schedule_venue.get("is_preferred", False)
                    venue_priority = schedule_venue.get("priority", i+1)

                    venue_info = {
                        "id": str(schedule_venue.get('id')),  # schedule_available_venue_idを使用
                        "name": venue_name,
                        "is_preferred": is_preferred,
                        "priority": venue_priority,
                        "color": settings.DEFAULT_VENUE_COLORS[i % len(settings.DEFAULT_VENUE_COLORS)]
                    }
                    venues.append(venue_info)
            except Exception as e:
                print(f"Warning: Could not fetch schedule venues for {schedule_id}: {e}")

        # 会場情報がない場合は空のリストを返す
        # フロントエンドで適切に処理されるべき

        return venues

    async def _get_session_instructors(self, session_id: UUID) -> List[str]:
        """セッションの指導者名を取得"""
        try:
            # session_instructorsテーブルからセッションの指導者を取得
            instructors_data = await self.session_instructor_repository.find_by_attendance_id(session_id)
            
            # ユーザー名を抽出
            instructors = []
            for instructor in instructors_data:
                # user_nameがあればそれを使い、なければuser_emailからユーザー名部分を抽出
                user_name = instructor.get('user_name')
                if not user_name and instructor.get('user_email'):
                    user_name = instructor['user_email'].split('@')[0]
                if user_name:
                    instructors.append(user_name)
            
            return instructors
        except Exception as e:
            print(f"Warning: Could not fetch instructors for session {session_id}: {e}")
            return []

    async def _get_instructors_for_slot(self, schedule_id: UUID, slot_order: int) -> List[str]:
        """指定したスケジュールとコマの指導者名を取得"""
        try:
            # session_instructorsテーブルから該当スロットの指導者を取得
            instructors_data = await self.session_instructor_repository.find_by_schedule_and_slot(schedule_id, slot_order)
            
            # ユーザー名を抽出
            instructors = []
            for instructor in instructors_data:
                # user_nameがあればそれを使い、なければuser_emailからユーザー名部分を抽出
                user_name = instructor.get('user_name')
                if not user_name and instructor.get('user_email'):
                    user_name = instructor['user_email'].split('@')[0]
                if user_name:
                    instructors.append(user_name)
            
            return instructors
        except Exception as e:
            print(f"Warning: Could not fetch instructors for schedule {schedule_id} slot {slot_order}: {e}")
            return []

    async def _get_session_participants_count(self, schedule_id: UUID) -> int:
        """セッションの参加者数を取得（估算値）"""
        # 現在のリポジトリでは出欠情報を直接取得できないので、
        # セッション数やスケジュール情報から推定
        try:
            sessions = await self.session_repository.find_by_schedule(schedule_id)
            # セッション数に応じて估算値を計算
            base_participants = len(sessions) * 3 + 2  # セッション数 × 3 + 2
            return min(base_participants, 15)  # 最大15人まで
        except Exception as e:
            print(f"Warning: Could not calculate participants for schedule {schedule_id}: {e}")
            return 0  # データなし

    def _calculate_slot_time(self, schedule: Dict[str, Any], slot_order: int, division_count: int) -> str:
        """slot_orderに基づいて時間スロットを計算"""
        from datetime import datetime, timedelta

        start_time = datetime.strptime(str(schedule["start_time"]), "%H:%M:%S")
        end_time = datetime.strptime(str(schedule["end_time"]), "%H:%M:%S")
        total_minutes = int((end_time - start_time).total_seconds() / 60)
        slot_duration = total_minutes / division_count

        slot_start_minutes = int((slot_order - 1) * slot_duration)
        slot_time = start_time + timedelta(minutes=slot_start_minutes)
        return slot_time.strftime("%H:%M")

    def _generate_time_schedule(self, venues: List[Dict[str, Any]], schedule: Dict[str, Any], division_count: int) -> Dict[str, Dict[str, List]]:
        """時間スケジュールの枠を生成"""
        time_schedule = {}

        # 時間スロットを生成
        for i in range(division_count):
            time_str = self._calculate_slot_time(schedule, i + 1, division_count)
            time_schedule[time_str] = {}
            for venue in venues:
                time_schedule[time_str][venue["id"]] = []

        return time_schedule

    async def get_practice_schedule_ideal_format_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定した日付の練習スケジュールを理想的な形式で取得"""
        debug_logs = [f"Searching for schedule with date: {target_date}"]

        # 基本スケジュール情報を取得
        schedule = await self.practice_schedule_repository.find_by_date(target_date)
        if not schedule:
            debug_logs.append("No schedule found for the specified date")
            return {
                "error": "Schedule not found",
                "debug_info": {
                    "fetch_logs": debug_logs
                }
            }

        # セッション情報を安全に取得（エラーが発生した場合は空のリストを使用）
        sessions = []
        venues = []
        instructors = []

        # Sessions
        try:
            debug_logs.append("Attempting to fetch sessions...")
            sessions = await self.session_repository.find_by_schedule(schedule["id"])
            debug_logs.append(f"Sessions fetched: {len(sessions)} items")
        except Exception as e:
            debug_logs.append(f"ERROR fetching sessions: {e}")
            sessions = []

        # Venues
        try:
            debug_logs.append("Attempting to fetch venues...")
            venues = await self.schedule_available_venue_repository.find_by_schedule(schedule["id"])
            print(f"Venues fetched: {venues}")
            debug_logs.append(f"Venues fetched: {len(venues)} items")
        except Exception as e:
            debug_logs.append(f"ERROR fetching venues: {e}")
            venues = []

        # Instructors: 指導者情報を取得
        try:
            debug_logs.append("Attempting to fetch instructors...")
            instructors = await self.session_instructor_repository.find_by_schedule(schedule["id"])
            debug_logs.append(f"Instructors fetched: {len(instructors)} items")
        except Exception as e:
            debug_logs.append(f"ERROR fetching instructors: {e}")
            instructors = []

        # データベースからdivision_countを取得
        division_count = schedule.get("division_count", 6)

        # 基本スケジュール情報とセッション情報から理想形式を生成
        result = await self._convert_basic_to_ideal_format_with_sessions(schedule, sessions, venues, instructors, division_count)

        # デバッグログを追加
        if "debug_info" not in result:
            result["debug_info"] = {}
        result["debug_info"]["fetch_logs"] = debug_logs

        return result

    def _convert_to_ideal_format(self, display_data: Dict[str, Any]) -> Dict[str, Any]:
        """表示用データを理想的な形式に変換"""
        # 基本情報
        schedule_info = {
            "id": display_data["id"],
            "schedule_date": str(display_data["schedule_date"]),
            "start_time": str(display_data["start_time"]),
            "end_time": str(display_data["end_time"]),
            "title": display_data.get("title", ""),
            "description": display_data.get("description", "")
        }

        # 会場情報を変換
        venues = []
        colors = settings.DEFAULT_VENUE_COLORS
        for i, venue in enumerate(display_data.get("available_venues", [])):
            venues.append({
                "id": str(venue.get('id')),
                "name": venue.get("name", f"会場{i+1}"),
                "priority": venue.get("priority", i+1),
                "color": colors[i % len(colors)]
            })

        # 時間スケジュールを生成（動的分割を使用）
        division_count = display_data.get("division_count", 6)
        time_schedule = self._generate_time_schedule(venues, display_data, division_count)

        # セッションを時間スロットに配置
        part_colors = settings.DEFAULT_PART_COLORS
        part_counter = {}
        
        for session in display_data.get("sessions", []):
            # slot_orderから時間を計算（division_count対応）
            slot_order = session.get("slot_order", 1)
            session_start = self._calculate_slot_time(display_data, slot_order, division_count)
            
            # パート名を生成（part_idベース）
            part_id = session.get("part_id", "unknown")
            if part_id not in part_counter:
                part_counter[part_id] = len(part_counter)
            
            part_index = part_counter[part_id]
            part_name = f"パート{part_index + 1}"
            
            # 指導者名を取得（実際のユーザー名または仮の名前）
            instructors = []
            for instructor in session.get("instructors", []):
                # 実際のユーザー名データがないため指導者情報を追加しない
                continue

            # セッション情報を作成
            session_info = {
                "part_id": part_id,
                "part_name": part_name,
                "part_color": part_colors[part_index % len(part_colors)],
                "session_title": session.get("title", "練習"),
                "instructors": instructors,
                "participants": 0,
                "status": "confirmed"
            }

            # 時間スロットが存在する場合に配置
            if session_start in time_schedule:
                # 最初の会場に配置（実際の会場割り当てロジックは将来実装）
                if venues:
                    venue_id = venues[part_index % len(venues)]["id"]
                    time_schedule[session_start][venue_id].append(session_info)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    def _convert_to_ideal_format_simple(self, schedule: Dict[str, Any], details_data: Dict[str, Any]) -> Dict[str, Any]:
        """実データを理想的な形式に変換（シンプル版）"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "title": schedule.get("title", ""),
            "description": schedule.get("description", "練習")
        }

        # 会場情報（実データから取得、なければデフォルト）
        venues = []
        colors = settings.DEFAULT_VENUE_COLORS
        available_venues = details_data.get("available_venues", [])
        
        if available_venues:
            for i, venue in enumerate(available_venues):
                venues.append({
                    "id": str(venue.get('id')),
                    "name": venue.get("venues", {}).get("name", f"会場{i+1}") if isinstance(venue.get("venues"), dict) else f"会場{i+1}",
                    "priority": venue.get("priority", i+1),
                    "color": colors[i % len(colors)]
                })
        # 会場データがない場合は空のリストを返す

        # 時間スケジュールを生成（動的分割を使用）
        division_count = schedule.get("division_count", 6)
        time_schedule = self._generate_time_schedule(venues, schedule, division_count)

        # セッションを配置
        part_colors = settings.DEFAULT_PART_COLORS
        sessions = details_data.get("sessions", [])
        
        for i, session in enumerate(sessions):
            slot_order = session.get("slot_order", i + 1)
            session_start = self._calculate_slot_time(schedule, slot_order, division_count)
            
            if session_start in time_schedule:
                venue_id = venues[i % len(venues)]["id"]
                
                session_info = {
                    "part_id": f"part-{i+1}",
                    "part_name": session.get("title", f"パート{i+1}"),
                    "part_color": part_colors[i % len(part_colors)],
                    "session_title": session.get("title", "練習"),
                    "instructors": [],
                    "participants": 0,
                    "status": "confirmed"
                }
                
                time_schedule[session_start][venue_id].append(session_info)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    async def _convert_basic_to_ideal_format(self, schedule: Dict[str, Any], division_count: int = 6) -> Dict[str, Any]:
        """基本スケジュールデータから理想的な形式に変換（実データのみ使用）"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "title": schedule.get("title", ""),
            "description": schedule.get("description", "")
        }

        # 実際の会場データを取得
        venues = await self._get_venues_with_colors(schedule["id"])

        # 時間スケジュールを生成
        time_schedule = self._generate_time_schedule(venues, schedule, division_count)

        # 実際のセッションデータのみを使用（推測データは生成しない）
        sessions = await self.session_repository.find_by_schedule(schedule["id"])

        # 実際のセッションデータがある場合のみ配置
        for session in sessions:
            slot_order = session.get("slot_order", 1)
            session_start = self._calculate_slot_time(schedule, slot_order, division_count)
            if session_start and session_start in time_schedule and venues:
                venue_index = (slot_order - 1) % len(venues)
                venue_id = venues[venue_index]["id"]

                session_info = {
                    "part_id": str(session.get("id", "")),
                    "part_name": session.get("title", ""),
                    "part_color": settings.DEFAULT_PART_COLORS[venue_index % len(settings.DEFAULT_PART_COLORS)],
                    "session_title": session.get("title", ""),
                    "instructors": await self._get_session_instructors(session.get("id")),
                    "participants": await self._get_session_participants_count(schedule["id"]),
                    "status": "confirmed"
                }

                time_schedule[session_start][venue_id].append(session_info)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    async def _convert_basic_to_ideal_format_with_sessions(self, schedule: Dict[str, Any], sessions: list, venues: list = None, instructors: list = None, division_count: int = 6) -> Dict[str, Any]:
        """基本スケジュールデータとセッション情報から理想的な形式に変換"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "title": schedule.get("title", ""),
            "description": schedule.get("description", "練習")
        }

        # 実際の会場データを取得
        venues = await self._get_venues_with_colors(schedule["id"])

        # 時間スケジュールを生成
        time_schedule = self._generate_time_schedule(venues, schedule, division_count)

        # 実際のセッションデータを配置（slot_order順）
        part_colors = settings.DEFAULT_PART_COLORS
        processing_details = []

        if sessions:
            # slot_orderでソート済みのセッションを処理
            for session in sessions:
                slot_order = session.get("slot_order", 1)
                session_title = session.get("title", "練習")
                processing_detail = {
                    "session_id": session.get("id"),
                    "slot_order": slot_order,
                    "title": session_title,
                    "schedule_available_venue_id": session.get("schedule_available_venue_id")
                }

                # slot_orderに基づいて時間スロットを決定（division_count対応）
                time_str = self._calculate_slot_time(schedule, slot_order, division_count)

                processing_detail["calculated_time"] = time_str
                processing_detail["time_slot_exists"] = time_str in time_schedule

                if time_str in time_schedule:
                    # セッションの会場情報を使用（schedule_available_venue_idフィールド）
                    venue_id = None
                    schedule_available_venue_id = session.get("schedule_available_venue_id")

                    if schedule_available_venue_id:
                        # schedule_available_venue_idに対応する会場IDを検索
                        expected_venue_id = str(schedule_available_venue_id)
                        for venue in venues:
                            if venue.get("id") == expected_venue_id:
                                venue_id = expected_venue_id
                                break
                        processing_detail["expected_venue_id"] = expected_venue_id
                        processing_detail["venue_found"] = venue_id is not None

                    # 会場が見つからない場合はslot_orderベースでフォールバック
                    if not venue_id and venues:
                        venue_index = (slot_order - 1) % len(venues)
                        venue_id = venues[venue_index]["id"]
                        processing_detail["fallback_venue_id"] = venue_id

                    processing_detail["final_venue_id"] = venue_id

                    if venue_id:
                        session_info = {
                            "part_id": str(session.get("id", f"part-{slot_order}")),
                            "part_name": session.get("part_name", session_title),  # パート名を優先、なければセッションタイトル
                            "part_color": part_colors[(slot_order - 1) % len(part_colors)],
                            "session_title": session_title,
                            "instructors": await self._get_instructors_for_slot(schedule["id"], slot_order),
                            "participants": await self._get_session_participants_count(schedule["id"]),
                            "status": "confirmed",
                            "slot_order": slot_order,
                            "schedule_available_venue_id": schedule_available_venue_id
                        }

                        time_schedule[time_str][venue_id].append(session_info)
                        processing_detail["session_added"] = True
                    else:
                        processing_detail["session_added"] = False
                else:
                    processing_detail["session_added"] = False

                processing_details.append(processing_detail)
        # セッションデータがない場合は空のスケジュールを返す（推測データは生成しない）

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule,
            "debug_info": {
                "sessions_count": len(sessions),
                "sessions_data": sessions,
                "venues_count": len(venues),
                "division_count": division_count,
                "session_processing_details": processing_details
            }
        }

    async def get_practice_schedule_details_by_id(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定したIDの練習スケジュールの詳細情報を取得"""
        # 基本スケジュール情報を取得
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            return None

        # セッション情報を安全に取得
        sessions = []
        try:
            sessions = await self.session_repository.find_by_schedule(schedule_id)
        except Exception as e:
            print(f"Warning: Could not fetch sessions for schedule {schedule_id}: {e}")
            sessions = []

        # 詳細形式に変換
        return await self._convert_to_details_format(schedule, sessions)

    async def get_practice_schedule_ideal_format_by_id(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定したIDの練習スケジュールのidealフォーマット詳細情報を取得"""
        # 基本スケジュール情報を取得
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            return None

        # セッション情報を安全に取得
        sessions = []
        try:
            sessions = await self.session_repository.find_by_schedule(schedule_id)
        except Exception as e:
            print(f"Warning: Could not fetch sessions for schedule {schedule_id}: {e}")
            sessions = []

        # 会場情報を安全に取得
        venues = []
        try:
            venues = await self.schedule_available_venue_repository.find_by_schedule(schedule_id)
        except Exception as e:
            print(f"Warning: Could not fetch venues for schedule {schedule_id}: {e}")
            venues = []

        # データベースからdivision_countを取得
        division_count = schedule.get("division_count", 6)

        # 理想形式を生成（日付指定と同じメソッドを使用）
        return await self._convert_basic_to_ideal_format_with_sessions(schedule, sessions, venues, [], division_count)

    async def _convert_to_details_format(self, schedule: Dict[str, Any], sessions: list) -> Dict[str, Any]:
        """基本スケジュールデータとセッション情報から詳細形式に変換"""
        # 基本情報
        result = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "title": schedule.get("title", ""),
            "description": schedule.get("description", "練習"),
            "schedule_type": schedule.get("schedule_type", "regular"),
            "status": schedule.get("status", "active"),
            "created_at": str(schedule.get("created_at", "")),
            "updated_at": str(schedule.get("updated_at", "")),
            "created_by": schedule.get("created_by"),
            "updated_by": schedule.get("updated_by")
        }

        # 利用可能会場情報（実データから取得）
        result["available_venues"] = []
        try:
            schedule_venues = await self.schedule_available_venue_repository.find_by_schedule(schedule["id"])
            for venue in schedule_venues:
                venue_info = {
                    "id": str(venue.get("id", "")),
                    "schedule_id": str(schedule["id"]),
                    "venue_id": str(venue.get("venue_id", "")),
                    "is_preferred": venue.get("is_preferred", False),
                    "priority": venue.get("priority", 0),
                    "notes": venue.get("notes", "")
                }
                result["available_venues"].append(venue_info)
        except Exception as e:
            print(f"Warning: Could not fetch available venues for schedule {schedule['id']}: {e}")

        # セッション情報を変換
        result["sessions"] = []
        for session in sessions:
            session_info = {
                "id": str(session.get("id", "")),
                "schedule_id": str(schedule["id"]),
                "part_id": str(session.get("part_id", "")),
                "title": session.get("title", "練習"),
                "slot_order": session.get("slot_order", 1),
                "schedule_available_venue_id": str(session.get("schedule_available_venue_id", "")),
                "priority": session.get("priority", 0),
                "created_at": str(session.get("created_at", "")),
                "updated_at": str(session.get("updated_at", "")),
                "instructors": await self._get_session_instructors(session.get("id")) if session.get("id") else []
            }
            result["sessions"].append(session_info)

        return result

    # ===== Monthカレンダー表示用メソッド =====

    async def get_practice_schedules_for_month_calendar(
        self, year: int, month: int
    ) -> List[Dict[str, Any]]:
        """Monthカレンダー表示用の練習スケジュール一覧を取得"""
        from datetime import date
        
        # 月の最初と最後の日を計算
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        # 指定月の練習スケジュールを取得
        schedules = await self.practice_schedule_repository.find_by_date_range(
            start_date.isoformat(), end_date.isoformat()
        )
        
        # カレンダー表示用の形式に変換
        calendar_events = []
        for schedule in schedules:
            try:
                # 会場情報を取得
                venues = await self.schedule_available_venue_repository.find_by_schedule(schedule["id"])
                venue_names = []
                for venue in venues:
                    try:
                        venue_info = await self.venue_repository.find_by_id(venue["venue_id"])
                        if venue_info:
                            venue_names.append(venue_info.get("name", "不明な会場"))
                    except Exception:
                        venue_names.append("不明な会場")
                
                # セッション数を取得
                sessions = await self.session_repository.find_by_schedule(schedule["id"])
                session_count = len(sessions)
                
                # カレンダーイベント形式に変換
                calendar_event = {
                    "id": str(schedule["id"]),
                    "title": schedule.get("title", "練習"),
                    "date": str(schedule["schedule_date"]),
                    "start_time": str(schedule["start_time"]),
                    "end_time": str(schedule["end_time"]),
                    "description": schedule.get("description", ""),
                    "schedule_type": schedule.get("schedule_type", "regular"),
                    "status": schedule.get("status", "active"),
                    "venues": venue_names,
                    "session_count": session_count,
                    "division_count": schedule.get("division_count", 1),
                    # カレンダー表示用の追加情報
                    "color": self._get_schedule_color(schedule.get("schedule_type", "regular")),
                    "is_all_day": False,
                    "category": "practice"
                }
                calendar_events.append(calendar_event)
                
            except Exception as e:
                print(f"Error processing schedule {schedule.get('id')}: {e}")
                # エラーが発生した場合も基本情報は表示
                calendar_event = {
                    "id": str(schedule["id"]),
                    "title": schedule.get("title", "練習"),
                    "date": str(schedule["schedule_date"]),
                    "start_time": str(schedule["start_time"]),
                    "end_time": str(schedule["end_time"]),
                    "description": schedule.get("description", ""),
                    "schedule_type": schedule.get("schedule_type", "regular"),
                    "status": schedule.get("status", "active"),
                    "venues": [],
                    "session_count": 0,
                    "division_count": schedule.get("division_count", 1),
                    "color": self._get_schedule_color(schedule.get("schedule_type", "regular")),
                    "is_all_day": False,
                    "category": "practice"
                }
                calendar_events.append(calendar_event)
        
        return calendar_events

    async def get_practice_schedules_for_date_range(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """指定した日付範囲の練習スケジュール一覧を取得（カレンダー表示用）"""
        schedules = await self.practice_schedule_repository.find_by_date_range(start_date, end_date)
        
        calendar_events = []
        for schedule in schedules:
            try:
                # 会場情報を取得
                venues = await self.schedule_available_venue_repository.find_by_schedule(schedule["id"])
                venue_names = []
                for venue in venues:
                    try:
                        venue_info = await self.venue_repository.find_by_id(venue["venue_id"])
                        if venue_info:
                            venue_names.append(venue_info.get("name", "不明な会場"))
                    except Exception:
                        venue_names.append("不明な会場")
                
                # セッション数を取得
                sessions = await self.session_repository.find_by_schedule(schedule["id"])
                session_count = len(sessions)
                
                calendar_event = {
                    "id": str(schedule["id"]),
                    "title": schedule.get("title", "練習"),
                    "date": str(schedule["schedule_date"]),
                    "start_time": str(schedule["start_time"]),
                    "end_time": str(schedule["end_time"]),
                    "description": schedule.get("description", ""),
                    "schedule_type": schedule.get("schedule_type", "regular"),
                    "status": schedule.get("status", "active"),
                    "venues": venue_names,
                    "session_count": session_count,
                    "division_count": schedule.get("division_count", 1),
                    "color": self._get_schedule_color(schedule.get("schedule_type", "regular")),
                    "is_all_day": False,
                    "category": "practice"
                }
                calendar_events.append(calendar_event)
                
            except Exception as e:
                print(f"Error processing schedule {schedule.get('id')}: {e}")
                continue
        
        return calendar_events

    def _get_schedule_color(self, schedule_type: str) -> str:
        """スケジュールタイプに基づいて色を決定"""
        color_map = {
            "regular": "#3B82F6",      # 青 - 通常練習
            "special": "#10B981",      # 緑 - 特別練習
            "event": "#F59E0B",        # オレンジ - イベント
            "competition": "#EF4444",  # 赤 - 大会
            "rehearsal": "#8B5CF6",    # 紫 - リハーサル
            "meeting": "#6B7280"       # グレー - 会議
        }
        return color_map.get(schedule_type, "#3B82F6")