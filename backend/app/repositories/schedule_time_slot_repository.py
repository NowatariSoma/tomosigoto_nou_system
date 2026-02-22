"""
スケジュール時間スロットのデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class ScheduleTimeSlotRepository:
    """スケジュール時間スロットのデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "schedule_time_slots"
    
    def _serialize_uuid_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """UUID型、Enum型、time型を文字列に変換"""
        from datetime import time
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            elif isinstance(value, Enum):
                serialized_data[key] = value.value
            elif isinstance(value, time):
                # time型を文字列（HH:MM:SS形式）に変換
                serialized_data[key] = value.strftime("%H:%M:%S")
            else:
                serialized_data[key] = value
        return serialized_data

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """すべてのスケジュール時間スロットを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data or []

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, time_slot_id: UUID) -> dict[str, Any] | None:
        """指定したIDのスケジュール時間スロットを取得"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        response = self.client.table(self.table_name).select("*").eq("id", time_slot_id_str).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの時間スロット一覧を取得（slot_order順）"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", schedule_id_str)
            .order("slot_order", desc=False)
            .execute()
        )
        return response.data or []

    @handle_supabase_errors("count_all")
    async def count_all(
        self,
        schedule_id: UUID | None = None
    ) -> int:
        """スケジュール時間スロットの総件数を取得"""
        query = self.client.table(self.table_name).select("id", count="exact")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        
        response = query.execute()
        return response.count

    @handle_supabase_errors("create")
    async def create(self, time_slot_data: dict[str, Any]) -> dict[str, Any]:
        """スケジュール時間スロットを作成"""
        serialized_data = self._serialize_uuid_fields(time_slot_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(
        self, 
        time_slot_id: UUID, 
        update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """スケジュール時間スロットを更新"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        serialized_data = self._serialize_uuid_fields(update_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", time_slot_id_str)
            .execute()
        )
        if not response.data:
            raise ValueError(f"時間スロット {time_slot_id} が見つかりません")
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, time_slot_id: UUID) -> bool:
        """スケジュール時間スロットを削除"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("id", time_slot_id_str)
            .execute()
        )
        return len(response.data) > 0

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの時間スロットをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("schedule_id", schedule_id_str)
            .execute()
        )
        return len(response.data)

    # 関連テーブルの存在確認用メソッド
    @handle_supabase_errors("find_schedule_by_id")
    async def find_schedule_by_id(self, schedule_id: UUID) -> dict[str, Any] | None:
        """スケジュールの存在確認"""
        response = self.client.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
        return response.data[0] if response.data else None

