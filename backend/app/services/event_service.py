from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.event_repository import EventRepository
from app.repositories.round_repository import RoundRepository


class EventService:
    """イベント関連の機能を実装するクラス"""

    def __init__(
        self,
        event_repository: EventRepository,
        round_repository: RoundRepository,
    ):
        self.event_repository = event_repository
        self.round_repository = round_repository

    # ===== イベント CRUD =====

    async def get_all_events(self) -> List[Dict[str, Any]]:
        """すべてのイベントを取得"""
        events = await self.event_repository.find_all()
        return events

    async def get_event(self, event_id: str) -> Dict[str, Any]:
        """指定したIDのイベントを取得"""
        event = await self.event_repository.find_by_id(event_id)
        if not event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)
        return event

    async def get_event_with_rounds(self, event_id: str) -> Dict[str, Any]:
        """指定したIDのイベントをラウンド情報付きで取得"""
        event = await self.event_repository.find_by_id(event_id)
        if not event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)

        rounds = await self.round_repository.find_by_event_id(event_id)
        event["rounds"] = rounds
        return event

    async def get_events_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """指定した日付範囲のイベントを取得"""
        events = await self.event_repository.find_by_date_range(start_date, end_date)
        return events

    async def create_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいイベントを作成"""
        # IDが指定されていない場合、タイムスタンプベースのIDを生成
        if "id" not in event_data or not event_data["id"]:
            import time
            import random
            import string
            timestamp = int(time.time() * 1000)
            random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
            event_data["id"] = f"evt_{timestamp}_{random_suffix}"

        created_event = await self.event_repository.create(event_data)
        return created_event

    async def update_event(self, event_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """指定したイベントを更新"""
        # イベントの存在確認
        existing_event = await self.event_repository.find_by_id(event_id)
        if not existing_event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)

        updated_event = await self.event_repository.update(event_id, event_data)
        return updated_event

    async def delete_event(self, event_id: str) -> None:
        """指定したイベントを削除"""
        # イベントの存在確認
        existing_event = await self.event_repository.find_by_id(event_id)
        if not existing_event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)

        await self.event_repository.delete(event_id)

    # ===== ラウンド CRUD =====

    async def get_rounds_by_event(self, event_id: str) -> List[Dict[str, Any]]:
        """指定したイベントのラウンド一覧を取得"""
        # イベントの存在確認
        existing_event = await self.event_repository.find_by_id(event_id)
        if not existing_event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)

        rounds = await self.round_repository.find_by_event_id(event_id)
        return rounds

    async def get_round(self, round_id: UUID) -> Dict[str, Any]:
        """指定したIDのラウンドを取得"""
        round_data = await self.round_repository.find_by_id(round_id)
        if not round_data:
            raise APIException(ErrorMessage.ROUND_NOT_FOUND)
        return round_data

    async def create_round(self, round_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいラウンドを作成"""
        # イベントの存在確認
        event_id = round_data.get("event_id")
        existing_event = await self.event_repository.find_by_id(event_id)
        if not existing_event:
            raise APIException(ErrorMessage.EVENT_NOT_FOUND)

        created_round = await self.round_repository.create(round_data)
        return created_round

    async def update_round(self, round_id: UUID, round_data: Dict[str, Any]) -> Dict[str, Any]:
        """指定したラウンドを更新"""
        # ラウンドの存在確認
        existing_round = await self.round_repository.find_by_id(round_id)
        if not existing_round:
            raise APIException(ErrorMessage.ROUND_NOT_FOUND)

        updated_round = await self.round_repository.update(round_id, round_data)
        return updated_round

    async def delete_round(self, round_id: UUID) -> None:
        """指定したラウンドを削除"""
        # ラウンドの存在確認
        existing_round = await self.round_repository.find_by_id(round_id)
        if not existing_round:
            raise APIException(ErrorMessage.ROUND_NOT_FOUND)

        await self.round_repository.delete(round_id)
