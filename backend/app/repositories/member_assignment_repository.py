"""
MemberAssignmentRepository - データアクセス層の実装
Supabaseのmember_assignmentsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors

from supabase import Client

logger = logging.getLogger(__name__)


class MemberAssignmentRepository:
    """
    メンバー所属データへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "member_assignments"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """
        すべてのメンバー所属を取得

        Returns:
            メンバー所属情報のリスト
        """
        response = self.client.table(self.table_name).select("*").execute()
        data = response.data or []
        logger.info(f"Found {len(data)} member assignments in {self.table_name} table")
        return data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, assignment_id: UUID) -> Optional[Dict[str, Any]]:
        """
        IDでメンバー所属を取得

        Args:
            assignment_id: メンバー所属ID

        Returns:
            メンバー所属情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name).select("*").eq("id", str(assignment_id)).execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found member assignment with id: {assignment_id}")
            return response.data[0]

        logger.info(f"Member assignment not found with id: {assignment_id}")
        return None

    @handle_supabase_errors("find_by_part_id")
    async def find_by_part_id(self, part_id: UUID) -> List[Dict[str, Any]]:
        """
        パートIDでメンバー所属を取得

        Args:
            part_id: パートID

        Returns:
            メンバー所属情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("part_id", str(part_id))
            .order("display_order")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} member assignments for part: {part_id}")
        return data

    @handle_supabase_errors("find_by_user_id")
    async def find_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """
        ユーザーIDでメンバー所属を取得

        Args:
            user_id: ユーザーID

        Returns:
            メンバー所属情報のリスト
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at")
            .execute()
        )
        data = response.data or []
        logger.info(f"Found {len(data)} member assignments for user: {user_id}")
        return data

    @handle_supabase_errors("find_by_user_and_part")
    async def find_by_user_and_part(self, user_id: UUID, part_id: UUID) -> Optional[Dict[str, Any]]:
        """
        ユーザーIDとパートIDでメンバー所属を取得

        Args:
            user_id: ユーザーID
            part_id: パートID

        Returns:
            メンバー所属情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", str(user_id))
            .eq("part_id", str(part_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Found member assignment for user: {user_id}, part: {part_id}")
            return response.data[0]

        logger.info(f"Member assignment not found for user: {user_id}, part: {part_id}")
        return None

    @handle_supabase_errors("find_with_details")
    async def find_with_details(self, assignment_id: Optional[UUID] = None, part_id: Optional[UUID] = None, user_id: Optional[UUID] = None) -> List[Dict[str, Any]]:
        """
        詳細情報付きでメンバー所属を取得

        Args:
            assignment_id: メンバー所属ID（オプション）
            part_id: パートID（オプション）
            user_id: ユーザーID（オプション）

        Returns:
            詳細情報付きメンバー所属情報のリスト
        """
        # JOINクエリを構築
        query = (
            self.client.table(self.table_name)
            .select("""
                *,
                users!inner(name, email),
                parts!inner(name, description, stages!inner(name, description))
            """)
        )
        
        # 条件を追加
        if assignment_id:
            query = query.eq("id", str(assignment_id))
        if part_id:
            query = query.eq("part_id", str(part_id))
        if user_id:
            query = query.eq("user_id", str(user_id))
        
        query = query.order("display_order")
        response = query.execute()
        
        data = response.data or []
        logger.info(f"Found {len(data)} detailed member assignments")
        return data

    @handle_supabase_errors("create")
    async def create(self, assignment_data: dict) -> Dict[str, Any]:
        """
        新しいメンバー所属をデータベースに作成

        Args:
            assignment_data: メンバー所属情報

        Returns:
            作成されたメンバー所属情報
        """
        response = self.client.table(self.table_name).insert(assignment_data).execute()
        if response.data:
            logger.info(
                f"Member assignment created successfully: user_id={assignment_data.get('user_id', 'unknown')}, part_id={assignment_data.get('part_id', 'unknown')}"
            )
            return response.data[0]

        logger.error(f"Failed to create member assignment: {assignment_data}")
        return {}

    @handle_supabase_errors("update")
    async def update(self, assignment_id: UUID, assignment_data: dict) -> Optional[Dict[str, Any]]:
        """
        メンバー所属情報を更新

        Args:
            assignment_id: メンバー所属ID
            assignment_data: 更新するデータ

        Returns:
            更新されたメンバー所属情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(assignment_data)
            .eq("id", str(assignment_id))
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Member assignment updated successfully: {assignment_id}")
            return response.data[0]

        logger.warning(f"Member assignment not found for update: {assignment_id}")
        return None

    @handle_supabase_errors("delete")
    async def delete(self, assignment_id: UUID) -> bool:
        """
        メンバー所属を削除

        Args:
            assignment_id: メンバー所属ID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("id", str(assignment_id)).execute()
        logger.info(f"Member assignment deleted successfully: {assignment_id}")
        return True

    @handle_supabase_errors("delete_by_user_and_part")
    async def delete_by_user_and_part(self, user_id: UUID, part_id: UUID) -> bool:
        """
        ユーザーIDとパートIDでメンバー所属を削除

        Args:
            user_id: ユーザーID
            part_id: パートID

        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq("user_id", str(user_id)).eq("part_id", str(part_id)).execute()
        logger.info(f"Member assignment deleted successfully: user_id={user_id}, part_id={part_id}")
        return True

    @handle_supabase_errors("count")
    async def count(self) -> int:
        """
        メンバー所属数を取得

        Returns:
            メンバー所属数
        """
        response = (
            self.client.table(self.table_name).select("id", count="exact").execute()
        )
        count = response.count if hasattr(response, "count") else 0
        logger.info(f"Total member assignments count: {count}")
        return count
