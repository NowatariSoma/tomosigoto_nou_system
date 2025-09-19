"""
AccountSettingRepository - アカウント設定データアクセス層の実装
Supabaseのaccount_setting関連テーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class AccountSettingRepository:
    """
    アカウント設定データへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.profile_table = "account_setting_profile"
        self.history_table = "account_setting_history"
        self.faculty_table = "departments"

    @handle_supabase_errors("get_profile_by_user_id")
    async def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDでアカウント設定プロフィールを取得

        Args:
            user_id: ユーザーID

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        response = (
            self.client.table("user_profiles")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found account setting profile for user: {user_id}")
            # 最新のプロフィールを返す（created_atでソート）
            latest_profile = max(response.data, key=lambda x: x.get('created_at', ''))
            return latest_profile

        logger.info(f"Account setting profile not found for user: {user_id}")
        return None

    @handle_supabase_errors("get_profile_by_student_id")
    async def get_profile_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        学籍番号でアカウント設定プロフィールを取得

        Args:
            student_id: 学籍番号

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.profile_table)
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found account setting profile for student_id: {student_id}")
            return response.data[0]

        logger.info(f"Account setting profile not found for student_id: {student_id}")
        return None

    @handle_supabase_errors("create_profile")
    async def create_profile(self, profile_data: dict) -> Dict[str, Any]:
        """
        新しいアカウント設定プロフィールを作成

        Args:
            profile_data: プロフィール情報

        Returns:
            作成されたプロフィール情報
        """
        # user_profilesテーブルに直接挿入
        # フィールド名を実際のテーブル構造に合わせて変換
        db_data = {
            "user_id": profile_data.get("user_id"),
            "student_id": profile_data.get("student_id"),
            "first_name_kanji": profile_data.get("first_name_kanji"),
            "first_name_katakana": profile_data.get("first_name_katakana"),
            "last_name_kanji": profile_data.get("last_name_kanji"),
            "last_name_katakana": profile_data.get("last_name_katakana"),
            "grade": profile_data.get("year"),  # year -> grade
            "department_id": profile_data.get("department_id"),  # faculty_id -> department_id
            "avatar_url": profile_data.get("avatar_url"),
            "preferences": profile_data.get("preferences", {})
        }
        response = self.client.table("user_profiles").insert(db_data).execute()
        if response.data:
            logger.info(f"Account setting profile created successfully for user: {profile_data.get('user_id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create account setting profile for user: {profile_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("update_profile")
    async def update_profile(self, user_id: str, profile_data: dict) -> Optional[Dict[str, Any]]:
        """
        アカウント設定プロフィールを更新

        Args:
            user_id: ユーザーID
            profile_data: 更新するデータ

        Returns:
            更新されたプロフィール情報、見つからない場合はNone
        """
        # フィールド名を実際のテーブル構造に合わせて変換
        db_data = {}
        if "year" in profile_data:
            db_data["grade"] = profile_data["year"]
        if "department_id" in profile_data:
            db_data["department_id"] = profile_data["department_id"]
        # その他のフィールドはそのまま（emailは除外）
        for key, value in profile_data.items():
            if key not in ["year", "faculty_id", "email"]:  # emailフィールドは除外
                db_data[key] = value
        
        # 既存のプロフィールを取得して、そのIDで更新
        existing_profile = await self.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Profile not found for user: {user_id}")
            return None
        
        response = (
            self.client.table("user_profiles")
            .update(db_data)
            .eq("id", existing_profile["id"])
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Account setting profile updated successfully for user: {user_id}")
            return response.data[0]

        logger.warning(f"Account setting profile not found for update: {user_id}")
        return None

    @handle_supabase_errors("delete_profile")
    async def delete_profile(self, user_id: str) -> bool:
        """
        アカウント設定プロフィールを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功時True
        """
        self.client.table("user_profiles").delete().eq("user_id", user_id).execute()
        logger.info(f"Account setting profile deleted successfully for user: {user_id}")
        return True

    @handle_supabase_errors("get_all_faculties")
    async def get_all_faculties(self) -> List[Dict[str, Any]]:
        """
        すべての学部を取得

        Returns:
            学部情報のリスト
        """
        response = (
            self.client.table(self.faculty_table)
            .select("*")
            .eq("is_active", True)
            .order("department_code")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} active faculties")
        return data

    @handle_supabase_errors("get_faculty_by_code")
    async def get_faculty_by_code(self, faculty_code: str) -> Optional[Dict[str, Any]]:
        """
        学部コードで学部を取得

        Args:
            faculty_code: 学部コード

        Returns:
            学部情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.faculty_table)
            .select("*")
            .eq("department_code", faculty_code)
            .eq("is_active", True)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found faculty with code: {faculty_code}")
            return response.data[0]

        logger.info(f"Faculty not found with code: {faculty_code}")
        return None

    @handle_supabase_errors("create_history_record")
    async def create_history_record(self, history_data: dict) -> Dict[str, Any]:
        """
        アカウント設定変更履歴を作成

        Args:
            history_data: 履歴情報

        Returns:
            作成された履歴情報
        """
        response = self.client.table(self.history_table).insert(history_data).execute()
        if response.data:
            logger.info(f"Account setting history record created for user: {history_data.get('user_id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create account setting history record for user: {history_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("get_history_by_user_id")
    async def get_history_by_user_id(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        ユーザーIDでアカウント設定変更履歴を取得

        Args:
            user_id: ユーザーID
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        response = (
            self.client.table(self.history_table)
            .select("*")
            .eq("user_id", user_id)
            .order("changed_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} history records for user: {user_id}")
        return data

    @handle_supabase_errors("get_history_by_field")
    async def get_history_by_field(self, user_id: str, field_name: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        特定フィールドの変更履歴を取得

        Args:
            user_id: ユーザーID
            field_name: フィールド名
            limit: 取得件数制限

        Returns:
            変更履歴のリスト
        """
        response = (
            self.client.table(self.history_table)
            .select("*")
            .eq("user_id", user_id)
            .eq("field_name", field_name)
            .order("changed_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} history records for field {field_name} and user: {user_id}")
        return data

    @handle_supabase_errors("check_student_id_exists")
    async def check_student_id_exists(self, student_id: str, exclude_user_id: Optional[str] = None) -> bool:
        """
        学籍番号の重複チェック

        Args:
            student_id: 学籍番号
            exclude_user_id: 除外するユーザーID（更新時など）

        Returns:
            重複している場合True
        """
        query = self.client.table("user_profiles").select("id").eq("student_id", student_id)
        
        if exclude_user_id:
            query = query.neq("user_id", exclude_user_id)
        
        response = query.execute()
        exists = len(response.data or []) > 0
        logger.info(f"Student ID {student_id} exists: {exists}")
        return exists

    @handle_supabase_errors("check_email_exists")
    async def check_email_exists(self, email: str, exclude_user_id: Optional[str] = None) -> bool:
        """
        メールアドレスの重複チェック

        Args:
            email: メールアドレス
            exclude_user_id: 除外するユーザーID（更新時など）

        Returns:
            重複している場合True
        """
        query = self.client.table("auth.users").select("id").eq("email", email)
        
        if exclude_user_id:
            query = query.neq("id", exclude_user_id)
        
        response = query.execute()
        exists = len(response.data or []) > 0
        logger.info(f"Email {email} exists: {exists}")
        return exists

    @handle_supabase_errors("get_profile_count")
    async def get_profile_count(self) -> int:
        """
        プロフィール数を取得

        Returns:
            プロフィール数
        """
        response = (
            self.client.table("user_profiles")
            .select("id", count="exact")
            .execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total account setting profiles count: {count}")
        return count

    @handle_supabase_errors("get_faculty_distribution")
    async def get_faculty_distribution(self) -> List[Dict[str, Any]]:
        """
        学部別のユーザー分布を取得

        Returns:
            学部別分布のリスト
        """
        response = (
            self.client.table(self.profile_table)
            .select("faculty, faculty_name")
            .execute()
        )
        
        # 集計処理
        distribution = {}
        for record in response.data or []:
            faculty = record.get("faculty", "unknown")
            faculty_name = record.get("faculty_name", "不明")
            key = f"{faculty}_{faculty_name}"
            distribution[key] = distribution.get(key, 0) + 1
        
        result = [
            {
                "faculty_code": key.split("_")[0],
                "faculty_name": key.split("_", 1)[1] if "_" in key else key,
                "user_count": count
            }
            for key, count in distribution.items()
        ]
        
        logger.info(f"Faculty distribution calculated: {len(result)} faculties")
        return result