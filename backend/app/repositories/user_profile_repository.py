"""
UserProfileRepository - ユーザープロフィールデータアクセス層の実装
user_profilesテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class UserProfileRepository:
    """
    ユーザープロフィールデータへのアクセスを管理するリポジトリクラス
    user_profilesテーブルのすべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "user_profiles"

    @handle_supabase_errors("get_profile_by_user_id")
    async def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDでユーザープロフィールを取得

        Args:
            user_id: ユーザーID

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        print(f"Searching for profile with user_id: {user_id}")
        response = (
            self.client.table(self.table_name)
            .select("""
                *,
                departments!inner(
                    department_code,
                    department_name
                )
            """)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found user profile for user: {user_id}")
            profile = response.data[0]
            
            # レスポンス形式を統一（department_code, department_nameを追加）
            if 'departments' in profile and profile['departments']:
                profile['department_code'] = profile['departments']['department_code']
                profile['department_name'] = profile['departments']['department_name']
            else:
                profile['department_code'] = 'LIT'  # デフォルト値
                profile['department_name'] = '文学部'  # デフォルト値
            
            return profile

        logger.info(f"User profile not found for user: {user_id}")
        return None

    @handle_supabase_errors("get_profile_by_student_id")
    async def get_profile_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        学籍番号でユーザープロフィールを取得

        Args:
            student_id: 学籍番号

        Returns:
            プロフィール情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("student_id", student_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found user profile for student_id: {student_id}")
            return response.data[0]

        logger.info(f"User profile not found for student_id: {student_id}")
        return None

    @handle_supabase_errors("create_profile")
    async def create_profile(self, profile_data: dict) -> Dict[str, Any]:
        """
        新しいユーザープロフィールを作成

        Args:
            profile_data: プロフィール情報

        Returns:
            作成されたプロフィール情報
        """
        response = self.client.table(self.table_name).insert(profile_data).execute()
        if response.data:
            logger.info(f"User profile created successfully for user: {profile_data.get('user_id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create user profile for user: {profile_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("update_profile")
    async def update_profile(self, user_id: str, profile_data: dict) -> Optional[Dict[str, Any]]:
        """
        ユーザープロフィールを更新

        Args:
            user_id: ユーザーID
            profile_data: 更新するデータ

        Returns:
            更新されたプロフィール情報、見つからない場合はNone
        """
        # 既存のプロフィールを取得して、そのIDで更新
        existing_profile = await self.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Profile not found for user: {user_id}")
            return None
        
        response = (
            self.client.table(self.table_name)
            .update(profile_data)
            .eq("id", existing_profile["id"])
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"User profile updated successfully for user: {user_id}")
            return response.data[0]

        logger.warning(f"User profile not found for update: {user_id}")
        return None

    @handle_supabase_errors("delete_profile")
    async def delete_profile(self, user_id: str) -> bool:
        """
        ユーザープロフィールを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("user_id", user_id).execute()
        logger.info(f"User profile deleted successfully for user: {user_id}")
        return True

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
        query = self.client.table(self.table_name).select("id").eq("student_id", student_id)
        
        if exclude_user_id:
            query = query.neq("user_id", exclude_user_id)
        
        response = query.execute()
        exists = len(response.data or []) > 0
        logger.info(f"Student ID {student_id} exists: {exists}")
        return exists

    @handle_supabase_errors("get_profile_count")
    async def get_profile_count(self) -> int:
        """
        プロフィール数を取得

        Returns:
            プロフィール数
        """
        response = (
            self.client.table(self.table_name)
            .select("id", count="exact")
            .execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total user profiles count: {count}")
        return count

    @handle_supabase_errors("get_profiles_by_department")
    async def get_profiles_by_department(self, department_id: str) -> List[Dict[str, Any]]:
        """
        学部IDでプロフィール一覧を取得

        Args:
            department_id: 学部ID

        Returns:
            プロフィール情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("department_id", department_id)
            .order("created_at", desc=True)
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} profiles for department: {department_id}")
        return data
