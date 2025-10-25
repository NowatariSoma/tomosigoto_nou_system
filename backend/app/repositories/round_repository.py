from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class RoundRepository:
    """ラウンド関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "rounds"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのラウンドを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, round_id: UUID) -> Optional[Dict[str, Any]]:
        """指定されたIDのラウンドを取得"""
        round_id_str = str(round_id) if isinstance(round_id, UUID) else round_id
        response = self.client.table(self.table_name).select("*").eq("id", round_id_str).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_event_id")
    async def find_by_event_id(self, event_id: str) -> List[Dict[str, Any]]:
        """指定されたイベントIDのラウンド一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("event_id", event_id)
            .order("round_number", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, round_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいラウンドを作成"""
        # timeオブジェクトを文字列に変換
        if "start_time" in round_data and round_data["start_time"]:
            round_data["start_time"] = str(round_data["start_time"])
        if "end_time" in round_data and round_data["end_time"]:
            round_data["end_time"] = str(round_data["end_time"])

        response = self.client.table(self.table_name).insert(round_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, round_id: UUID, round_data: Dict[str, Any]) -> Dict[str, Any]:
        """ラウンドを更新"""
        # timeオブジェクトを文字列に変換
        if "start_time" in round_data and round_data["start_time"]:
            round_data["start_time"] = str(round_data["start_time"])
        if "end_time" in round_data and round_data["end_time"]:
            round_data["end_time"] = str(round_data["end_time"])

        round_id_str = str(round_id) if isinstance(round_id, UUID) else round_id
        response = (
            self.client.table(self.table_name)
            .update(round_data)
            .eq("id", round_id_str)
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, round_id: UUID) -> None:
        """ラウンドを削除"""
        round_id_str = str(round_id) if isinstance(round_id, UUID) else round_id
        self.client.table(self.table_name).delete().eq("id", round_id_str).execute()
