from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class AttendanceRepository:
    """出欠記録のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "practice_user_attendance"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべての出欠記録を取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, attendance_id: UUID) -> Dict[str, Any]:
        """指定したIDの出欠記録を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", attendance_id).execute()
        return response.data[0]

    @handle_supabase_errors("find_by_practice_schedule")
    async def find_by_practice_schedule(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの出欠記録を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("practice_schedule_id", practice_schedule_id)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_user")
    async def find_by_user(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーの出欠記録を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_practice_and_user")
    async def find_by_practice_and_user(
        self, practice_schedule_id: UUID, user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """指定した練習とユーザーの組み合わせの出欠記録を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("practice_schedule_id", practice_schedule_id)
            .eq("user_id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成"""
        response = self.client.table(self.table_name).insert(attendance_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, attendance_id: UUID, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を更新"""
        response = (
            self.client.table(self.table_name)
            .update(attendance_data)
            .eq("id", attendance_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("upsert")
    async def upsert(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）"""
        response = (
            self.client.table(self.table_name)
            .upsert(attendance_data, on_conflict="practice_schedule_id,user_id")
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, attendance_id: UUID) -> bool:
        """出欠記録を削除"""
        self.client.table(self.table_name).delete().eq("id", attendance_id).execute()
        return True

    @handle_supabase_errors("get_attendance_summary")
    async def get_attendance_summary(self) -> List[Dict[str, Any]]:
        """練習別の出欠サマリーを取得（ビューから）"""
        response = self.client.table("practice_user_attendance_summary").select("*").execute()
        return response.data

    @handle_supabase_errors("get_user_attendance_history")
    async def get_user_attendance_history(self) -> List[Dict[str, Any]]:
        """ユーザー別の出欠履歴を取得（ビューから）"""
        response = self.client.table("practice_user_attendance_history").select("*").execute()
        return response.data


