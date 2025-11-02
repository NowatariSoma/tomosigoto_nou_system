from typing import Any, Dict, List
from uuid import UUID

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class PracticeNotesRepository:
    """練習備考のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "practice_notes"

    def _serialize_uuid_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """UUID型を文字列に変換"""
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            else:
                serialized_data[key] = value
        return serialized_data

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべての練習備考を取得"""
        response = self.client.table(self.table_name).select("*").order("priority", desc=True).execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, note_id: UUID) -> Dict[str, Any]:
        """指定したIDの練習備考を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", note_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_practice_schedule")
    async def find_by_practice_schedule(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの備考を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("practice_schedule_id", practice_schedule_id)
            .order("priority", desc=True)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習備考を作成"""
        serialized_data = self._serialize_uuid_fields(note_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, note_id: UUID, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習備考を更新"""
        serialized_data = self._serialize_uuid_fields(note_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", note_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, note_id: UUID) -> None:
        """練習備考を削除"""
        self.client.table(self.table_name).delete().eq("id", note_id).execute()
