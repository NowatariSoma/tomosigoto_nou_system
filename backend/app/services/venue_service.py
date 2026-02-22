from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.protocols import VenueRepositoryProtocol


class VenueService:
    """会場についての機能を実装するクラス"""

    def __init__(self, venue_repository: VenueRepositoryProtocol, auth_client) -> None:
        self.repository = venue_repository
        self.auth_client = auth_client

    async def get_all_venues(self) -> list[dict[str, Any]]:
        """すべての会場を取得"""
        return await self.repository.find_all()

    async def get_venue(self, venue_id: UUID) -> dict[str, Any]:
        """指定した会場情報を取得"""
        return await self.repository.find_by_id(venue_id)

    async def create_venue(self, venue_data: dict[str, Any]) -> dict[str, Any]:
        """会場を作成"""
        return await self.repository.create(venue_data)

    async def update_venue(self, venue_id: UUID, venue_data: dict[str, Any]) -> dict[str, Any]:
        """指定した会場情報を更新"""
        return await self.repository.update(venue_id, venue_data)

    async def remove_venue(self, venue_id: UUID) -> bool:
        """指定した会場を削除"""
        venue = await self.repository.find_by_id(venue_id)

        if not venue:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        await self.repository.delete(venue_id)

        return True
