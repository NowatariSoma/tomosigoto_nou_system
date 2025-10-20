import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors

from supabase import Client

logger = logging.getLogger(__name__)


class SessionInstructorRepository:
    """セッション指導者のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "session_instructors"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのセッション指導者を取得"""
        response = (
            self.client.table(self.table_name)
            .select("id, session_id, attendance_id, created_at, updated_at, practice_user_attendance(*, users(*))")
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, instructor_id: UUID) -> Dict[str, Any]:
        """指定したIDのセッション指導者を取得"""
        response = (
            self.client.table(self.table_name)
            .select("id, session_id, attendance_id, created_at, updated_at, practice_user_attendance(*, users(*))")
            .eq("id", instructor_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("find_by_session")
    async def find_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        """指定されたセッションの指導者を取得"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        response = (
            self.client.table(self.table_name)
            .select("id, session_id, attendance_id, created_at, updated_at, practice_user_attendance(*, users(*))")
            .eq("session_id", session_id_str)
            .execute()
        )
        return response.data
    
    @handle_supabase_errors("create")
    async def create(self, instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッション指導者を作成"""
        response = self.client.table(self.table_name).insert(instructor_data).execute()
        return response.data[0]
    
    @handle_supabase_errors("update")
    async def update(self, instructor_id: UUID, instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """指定したセッション指導者を更新"""
        response = self.client.table(self.table_name).update(instructor_data).eq("id", instructor_id).execute()
        return response.data[0] 

    @handle_supabase_errors("delete")
    async def delete(self, instructor_id: UUID) -> bool:
        """指定したセッション指導者を削除"""
        instructor_id_str = str(instructor_id) if isinstance(instructor_id, UUID) else instructor_id
        self.client.table(self.table_name).delete().eq("id", instructor_id_str).execute()
        return True