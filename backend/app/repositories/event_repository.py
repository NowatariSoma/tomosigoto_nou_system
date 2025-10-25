from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class EventRepository:
    """イベント関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "events"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのイベントを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """指定されたIDのイベントを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", event_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_date_range")
    async def find_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """指定された日付範囲のイベントを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .gte("event_date", start_date)
            .lte("event_date", end_date)
            .order("event_date", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいイベントを作成"""
        # dateとtimeオブジェクトを文字列に変換
        if "event_date" in event_data:
            event_data["event_date"] = str(event_data["event_date"])
        if "start_time" in event_data and event_data["start_time"]:
            event_data["start_time"] = str(event_data["start_time"])
        if "end_time" in event_data and event_data["end_time"]:
            event_data["end_time"] = str(event_data["end_time"])

        response = self.client.table(self.table_name).insert(event_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """イベントを更新"""
        # dateとtimeオブジェクトを文字列に変換
        if "event_date" in event_data:
            event_data["event_date"] = str(event_data["event_date"])
        if "start_time" in event_data and event_data["start_time"]:
            event_data["start_time"] = str(event_data["start_time"])
        if "end_time" in event_data and event_data["end_time"]:
            event_data["end_time"] = str(event_data["end_time"])

        response = (
            self.client.table(self.table_name)
            .update(event_data)
            .eq("id", event_id)
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, event_id: str) -> None:
        """イベントを削除"""
        self.client.table(self.table_name).delete().eq("id", event_id).execute()
