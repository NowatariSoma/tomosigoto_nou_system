from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime
import time
import secrets
import string

from app.core.exceptions import handle_supabase_errors
from supabase import Client


def generate_event_id() -> str:
    """
    イベントIDを生成する
    フォーマット: evt_{タイムスタンプ}_{ランダム文字列}
    例: evt_1761412640841_maj4xzbfj
    """
    timestamp = int(time.time() * 1000)  # ミリ秒単位のタイムスタンプ
    random_str = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(12))
    return f"evt_{timestamp}_{random_str}"


class EventsRepository:
    """イベント関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "events"

    @handle_supabase_errors("find_all_events")
    async def find_all(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """すべてのイベントを取得"""
        query = self.client.table(self.table_name).select("*").order("event_date", desc=True)
        if limit:
            query = query.limit(limit)
        response = query.execute()
        return response.data

    @handle_supabase_errors("find_event_by_id")
    async def find_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """指定されたIDのイベントを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", event_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_events_by_date_range")
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

    @handle_supabase_errors("create_event")
    async def create(self, event_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """イベントを作成"""
        # イベントIDを生成
        event_id = generate_event_id()

        # 作成データを準備
        data = {
            **event_data,
            "id": event_id,
        }

        if user_id:
            data["created_by"] = str(user_id)
            data["updated_by"] = str(user_id)

        response = self.client.table(self.table_name).insert(data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update_event")
    async def update(self, event_id: str, event_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """イベントを更新"""
        data = {**event_data}

        if user_id:
            data["updated_by"] = str(user_id)

        response = self.client.table(self.table_name).update(data).eq("id", event_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete_event")
    async def delete(self, event_id: str) -> bool:
        """イベントを削除"""
        response = self.client.table(self.table_name).delete().eq("id", event_id).execute()
        return bool(response.data)


class EventSettlementsRepository:
    """イベント決済関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "event_settlements"

    @handle_supabase_errors("find_settlements_by_event_id")
    async def find_by_event_id(self, event_id: str) -> List[Dict[str, Any]]:
        """指定されたイベントIDの決済情報を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("event_id", event_id)
            .order("created_at", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_settlement_by_id")
    async def find_by_id(self, settlement_id: UUID) -> Optional[Dict[str, Any]]:
        """指定されたIDの決済情報を取得"""
        settlement_id_str = str(settlement_id)
        response = self.client.table(self.table_name).select("*").eq("id", settlement_id_str).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_settlements_by_user_id")
    async def find_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定されたユーザーIDの決済情報を取得"""
        user_id_str = str(user_id)
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id_str)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create_settlement")
    async def create(self, settlement_data: Dict[str, Any]) -> Dict[str, Any]:
        """決済情報を作成"""
        response = self.client.table(self.table_name).insert(settlement_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update_settlement")
    async def update(self, settlement_id: UUID, settlement_data: Dict[str, Any]) -> Dict[str, Any]:
        """決済情報を更新"""
        settlement_id_str = str(settlement_id)
        response = self.client.table(self.table_name).update(settlement_data).eq("id", settlement_id_str).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete_settlement")
    async def delete(self, settlement_id: UUID) -> bool:
        """決済情報を削除"""
        settlement_id_str = str(settlement_id)
        response = self.client.table(self.table_name).delete().eq("id", settlement_id_str).execute()
        return bool(response.data)

    @handle_supabase_errors("get_settlement_summary")
    async def get_summary(self, event_id: str) -> Dict[str, Any]:
        """指定されたイベントの決済サマリーを取得"""
        settlements = await self.find_by_event_id(event_id)

        total_amount = sum(float(s.get("amount", 0)) for s in settlements)
        total_paid = sum(float(s.get("paid_amount", 0)) for s in settlements)
        total_pending = total_amount - total_paid

        paid_count = sum(1 for s in settlements if s.get("status") == "paid")
        pending_count = sum(1 for s in settlements if s.get("status") in ["pending", "partial"])

        return {
            "event_id": event_id,
            "total_amount": total_amount,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "settlement_count": len(settlements),
            "paid_count": paid_count,
            "pending_count": pending_count,
        }
