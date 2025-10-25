from typing import Any, Dict, List, Optional
from uuid import UUID
from decimal import Decimal

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.events_repository import EventsRepository, EventSettlementsRepository


class EventsService:
    """イベント関連の機能を実装するクラス"""

    def __init__(
        self,
        events_repository: EventsRepository,
        event_settlements_repository: EventSettlementsRepository,
    ):
        self.events_repository = events_repository
        self.event_settlements_repository = event_settlements_repository

    # ===== イベント CRUD =====

    async def get_all_events(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """すべてのイベントを取得"""
        return await self.events_repository.find_all(limit=limit)

    async def get_event_by_id(self, event_id: str) -> Dict[str, Any]:
        """指定されたIDのイベントを取得"""
        event = await self.events_repository.find_by_id(event_id)
        if not event:
            raise APIException(
                status_code=404,
                message=ErrorMessage.NOT_FOUND.format(resource="Event"),
                detail=f"Event with id {event_id} not found",
            )
        return event

    async def get_events_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """指定された日付範囲のイベントを取得"""
        return await self.events_repository.find_by_date_range(start_date, end_date)

    async def create_event(self, event_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Dict[str, Any]:
        """イベントを作成"""
        return await self.events_repository.create(event_data, user_id)

    async def update_event(
        self, event_id: str, event_data: Dict[str, Any], user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """イベントを更新"""
        # イベントが存在するか確認
        await self.get_event_by_id(event_id)

        return await self.events_repository.update(event_id, event_data, user_id)

    async def delete_event(self, event_id: str) -> bool:
        """イベントを削除"""
        # イベントが存在するか確認
        await self.get_event_by_id(event_id)

        return await self.events_repository.delete(event_id)

    # ===== イベント決済 CRUD =====

    async def get_settlements_by_event_id(self, event_id: str) -> List[Dict[str, Any]]:
        """指定されたイベントIDの決済情報を取得"""
        # イベントが存在するか確認
        await self.get_event_by_id(event_id)

        return await self.event_settlements_repository.find_by_event_id(event_id)

    async def get_settlement_by_id(self, settlement_id: UUID) -> Dict[str, Any]:
        """指定されたIDの決済情報を取得"""
        settlement = await self.event_settlements_repository.find_by_id(settlement_id)
        if not settlement:
            raise APIException(
                status_code=404,
                message=ErrorMessage.NOT_FOUND.format(resource="EventSettlement"),
                detail=f"Settlement with id {settlement_id} not found",
            )
        return settlement

    async def get_settlements_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定されたユーザーIDの決済情報を取得"""
        return await self.event_settlements_repository.find_by_user_id(user_id)

    async def create_settlement(self, settlement_data: Dict[str, Any]) -> Dict[str, Any]:
        """決済情報を作成"""
        # イベントが存在するか確認
        event_id = settlement_data.get("event_id")
        if event_id:
            await self.get_event_by_id(event_id)

        return await self.event_settlements_repository.create(settlement_data)

    async def update_settlement(self, settlement_id: UUID, settlement_data: Dict[str, Any]) -> Dict[str, Any]:
        """決済情報を更新"""
        # 決済情報が存在するか確認
        await self.get_settlement_by_id(settlement_id)

        return await self.event_settlements_repository.update(settlement_id, settlement_data)

    async def delete_settlement(self, settlement_id: UUID) -> bool:
        """決済情報を削除"""
        # 決済情報が存在するか確認
        await self.get_settlement_by_id(settlement_id)

        return await self.event_settlements_repository.delete(settlement_id)

    async def get_settlement_summary(self, event_id: str) -> Dict[str, Any]:
        """指定されたイベントの決済サマリーを取得"""
        # イベントが存在するか確認
        await self.get_event_by_id(event_id)

        return await self.event_settlements_repository.get_summary(event_id)

    # ===== 複合操作 =====

    async def get_event_with_settlements(self, event_id: str) -> Dict[str, Any]:
        """決済情報を含むイベントを取得"""
        event = await self.get_event_by_id(event_id)
        settlements = await self.get_settlements_by_event_id(event_id)

        event["settlements"] = settlements
        return event
