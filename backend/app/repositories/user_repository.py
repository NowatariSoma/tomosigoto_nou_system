import logging
from typing import Any, Dict, List, Optional
from app.core.supabase import handle_supabase_errors

logger = logging.getLogger(__name__)


class UserRepository:
    """
    ユーザー関連のデータアクセスを処理するリポジトリクラス
    """

    def __init__(self, supabase_client):
        """
        Args:
            supabase_client: Supabaseクライアント
        """
        self.client = supabase_client
        self.table_name = "users"

    @handle_supabase_errors("get_user_by_id")
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDでユーザーを取得

        Args:
            user_id: ユーザーID

        Returns:
            ユーザー情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found user: {user_id}")
            return response.data[0]

        logger.info(f"User not found: {user_id}")
        return None

    @handle_supabase_errors("get_user_by_email")
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        メールアドレスでユーザーを取得

        Args:
            email: メールアドレス

        Returns:
            ユーザー情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found user by email: {email}")
            return response.data[0]

        logger.info(f"User not found by email: {email}")
        return None

    @handle_supabase_errors("create_user")
    async def create_user(self, user_data: dict) -> Dict[str, Any]:
        """
        ユーザーを作成

        Args:
            user_data: ユーザー情報

        Returns:
            作成されたユーザー情報
        """
        response = self.client.table(self.table_name).insert(user_data).execute()
        if response.data:
            logger.info(f"User created successfully: {user_data.get('id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create user: {user_data.get('id', 'unknown')}")
        return {}

    @handle_supabase_errors("update_user")
    async def update_user(self, user_id: str, user_data: dict) -> Optional[Dict[str, Any]]:
        """
        ユーザーを更新

        Args:
            user_id: ユーザーID
            user_data: 更新するデータ

        Returns:
            更新されたユーザー情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(user_data)
            .eq("id", user_id)
            .execute()
        )
        if response.data:
            logger.info(f"User updated successfully: {user_id}")
            return response.data[0]

        logger.error(f"Failed to update user: {user_id}")
        return None

    @handle_supabase_errors("delete_user")
    async def delete_user(self, user_id: str) -> bool:
        """
        ユーザーを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功の場合はTrue
        """
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("id", user_id)
            .execute()
        )
        
        if response.data:
            logger.info(f"User deleted successfully: {user_id}")
            return True
        
        logger.warning(f"No user found to delete: {user_id}")
        return False

    @handle_supabase_errors("get_all_users")
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """
        すべてのユーザーを取得

        Returns:
            ユーザー情報のリスト
        """
        response = self.client.table(self.table_name).select("*").execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} total users")
            return response.data
        
        logger.info("No users found")
        return []

    @handle_supabase_errors("get_user_count")
    async def get_user_count(self) -> int:
        """
        ユーザー数を取得

        Returns:
            ユーザー数
        """
        response = self.client.table(self.table_name).select("id", count="exact").execute()
        return response.count or 0