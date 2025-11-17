import logging
from typing import Any, Dict, List, Optional
from app.core.supabase import handle_supabase_errors

logger = logging.getLogger(__name__)


class UserRoleRepository:
    """
    ユーザーロール関連のデータアクセスを処理するリポジトリクラス
    """

    def __init__(self, supabase_client):
        """
        Args:
            supabase_client: Supabaseクライアント
        """
        self.client = supabase_client
        self.table_name = "user_roles"

    @handle_supabase_errors("get_role_by_user_id")
    async def get_role_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDでユーザーロールを取得

        Args:
            user_id: ユーザーID

        Returns:
            ロール情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found user role for user: {user_id}")
            return response.data[0]

        logger.info(f"User role not found for user: {user_id}")
        return None

    @handle_supabase_errors("get_role_by_user_and_type")
    async def get_role_by_user_and_type(self, user_id: str, role_type: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDとロール種別でロールを取得
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .eq("role_type", role_type)
            .limit(1)
            .execute()
        )
        if response.data:
            logger.info(f"Found {role_type} role for user: {user_id}")
            return response.data[0]
        logger.info(f"{role_type} role not found for user: {user_id}")
        return None

    @handle_supabase_errors("create_role")
    async def create_role(self, role_data: dict) -> Dict[str, Any]:
        """
        ユーザーロールを作成

        Args:
            role_data: ロール情報

        Returns:
            作成されたロール情報
        """
        response = self.client.table(self.table_name).insert(role_data).execute()
        if response.data:
            logger.info(f"User role created successfully for user: {role_data.get('user_id', 'unknown')}")
            return response.data[0]

        logger.error(f"Failed to create user role for user: {role_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("update_role")
    async def update_role(self, user_id: str, role_data: dict) -> Optional[Dict[str, Any]]:
        """
        ユーザーロールを更新

        Args:
            user_id: ユーザーID
            role_data: 更新するデータ

        Returns:
            更新されたロール情報、見つからない場合はNone
        """
        # 既存のロールを取得して、そのIDで更新
        existing_role = await self.get_role_by_user_id(user_id)
        if not existing_role:
            logger.warning(f"Role not found for user: {user_id}")
            return None

        response = (
            self.client.table(self.table_name)
            .update(role_data)
            .eq("id", existing_role["id"])
            .execute()
        )
        if response.data:
            logger.info(f"User role updated successfully for user: {user_id}")
            return response.data[0]

        logger.error(f"Failed to update user role for user: {user_id}")
        return None

    @handle_supabase_errors("delete_role")
    async def delete_role(self, user_id: str) -> bool:
        """
        ユーザーロールを削除

        Args:
            user_id: ユーザーID

        Returns:
            削除成功の場合はTrue
        """
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("user_id", user_id)
            .execute()
        )
        
        if response.data:
            logger.info(f"User role deleted successfully for user: {user_id}")
            return True
        
        logger.warning(f"No role found to delete for user: {user_id}")
        return False

    @handle_supabase_errors("delete_role_by_type")
    async def delete_role_by_type(self, user_id: str, role_type: str) -> bool:
        """
        指定したロールのみ削除
        """
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("user_id", user_id)
            .eq("role_type", role_type)
            .execute()
        )
        if response.data:
            logger.info(f"{role_type} role deleted for user: {user_id}")
            return True
        logger.info(f"No {role_type} role found to delete for user: {user_id}")
        return False

    @handle_supabase_errors("get_roles_by_type")
    async def get_roles_by_type(self, role_type: str, include_hidden: bool = False) -> List[Dict[str, Any]]:
        """
        ロールタイプでユーザーロールを取得

        Args:
            role_type: ロールタイプ
            include_hidden: 非表示ロールも含めるか

        Returns:
            ロール情報のリスト
        """
        query = self.client.table(self.table_name).select("*").eq("role_type", role_type)
        
        if not include_hidden:
            query = query.eq("is_visible_to_general", True)
        
        response = query.execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} roles for type: {role_type}")
            return response.data
        
        logger.info(f"No roles found for type: {role_type}")
        return []

    @handle_supabase_errors("get_all_roles")
    async def get_all_roles(self, include_hidden: bool = False) -> List[Dict[str, Any]]:
        """
        すべてのユーザーロールを取得

        Args:
            include_hidden: 非表示ロールも含めるか

        Returns:
            ロール情報のリスト
        """
        query = self.client.table(self.table_name).select("*")
        
        if not include_hidden:
            query = query.eq("is_visible_to_general", True)
        
        response = query.execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} total roles")
            return response.data
        
        logger.info("No roles found")
        return []
