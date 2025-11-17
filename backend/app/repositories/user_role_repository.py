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
        self.table_name = "user_role"  # リモートのSupabaseでは単数形

    @handle_supabase_errors("get_role_by_user_id")
    async def get_role_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDでユーザーロールを取得（user_roleテーブルからrole_typeを取得）

        Args:
            user_id: ユーザーID

        Returns:
            ロール情報（role_type: user/admin/viewer）、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
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
        ユーザーIDとロール種別でロールを取得（user_roleテーブルから）
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
        ユーザーロールを作成（user_roleテーブルに）

        Args:
            role_data: ロール情報（role_type: user/admin/viewerを含む）

        Returns:
            作成されたロール情報
        """
        response = self.client.table(self.table_name).insert(role_data).execute()
        if response.data:
            logger.info(f"User role created successfully for user: {role_data.get('user_id', 'unknown')}")
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else response.data

        logger.error(f"Failed to create user role for user: {role_data.get('user_id', 'unknown')}")
        return {}

    @handle_supabase_errors("update_role")
    async def update_role(self, user_id: str, role_data: dict) -> Optional[Dict[str, Any]]:
        """
        ユーザーロールを更新（user_roleテーブルで）

        Args:
            user_id: ユーザーID
            role_data: 更新するデータ（role_typeを含む）

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
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else response.data

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
        ロールタイプでユーザーロールを取得（user_roleテーブルから）

        Args:
            role_type: ロールタイプ（user/admin/viewer）
            include_hidden: 非表示ロールも含めるか（user_roleテーブルでは未使用）

        Returns:
            ロール情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("role_type", role_type)
            .execute()
        )
        
        if response.data:
            logger.info(f"Found {len(response.data)} roles for type: {role_type}")
            return response.data
        
        logger.info(f"No roles found for type: {role_type}")
        return []

    @handle_supabase_errors("get_all_roles")
    async def get_all_roles(self, include_hidden: bool = False) -> List[Dict[str, Any]]:
        """
        すべてのユーザーロールを取得（user_roleテーブルから）

        Args:
            include_hidden: 非表示ロールも含めるか（user_roleテーブルでは未使用）

        Returns:
            ロール情報のリスト
        """
        response = self.client.table(self.table_name).select("*").execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} total roles")
            return response.data
        
        logger.info("No roles found")
        return []

    @handle_supabase_errors("get_user_roles_with_instructor")
    async def get_user_roles_with_instructor(self) -> List[Dict[str, Any]]:
        """
        user_rolesテーブルからis_instructorフラグを含むロール情報を取得

        Returns:
            is_instructorフラグを含むロール情報のリスト
        """
        response = self.client.table("user_roles").select("*").execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} user roles with instructor flag")
            return response.data
        
        logger.info("No user roles found")
        return []

    @handle_supabase_errors("update_instructor_flag")
    async def update_instructor_flag(self, user_id: str, is_instructor: bool) -> Optional[Dict[str, Any]]:
        """
        user_rolesテーブルのis_instructorフラグを更新

        Args:
            user_id: ユーザーID
            is_instructor: 指導者フラグ

        Returns:
            更新されたロール情報、見つからない場合はNone
        """
        # 既存のレコードを確認
        existing = (
            self.client.table("user_roles")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        
        if existing.data and len(existing.data) > 0:
            # 既存レコードを更新
            response = (
                self.client.table("user_roles")
                .update({"is_instructor": is_instructor})
                .eq("user_id", user_id)
                .execute()
            )
        else:
            # 新規作成
            response = (
                self.client.table("user_roles")
                .insert({
                    "user_id": user_id,
                    "is_instructor": is_instructor
                })
                .execute()
            )
        
        if response.data:
            logger.info(f"Instructor flag updated for user: {user_id}, is_instructor: {is_instructor}")
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else response.data
        
        logger.error(f"Failed to update instructor flag for user: {user_id}")
        return None

    @handle_supabase_errors("get_instructor_flag")
    async def get_instructor_flag(self, user_id: str) -> bool:
        """
        user_rolesテーブルからis_instructorフラグを取得

        Args:
            user_id: ユーザーID

        Returns:
            is_instructorフラグ（デフォルトはFalse）
        """
        response = (
            self.client.table("user_roles")
            .select("is_instructor")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        
        if response.data and len(response.data) > 0:
            return response.data[0].get("is_instructor", False)
        
        return False
