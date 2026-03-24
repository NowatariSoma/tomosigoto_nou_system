from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.protocols import VenueRepositoryProtocol


class VenueService:
    """会場についての機能を実装するクラス"""

    def __init__(self, venue_repository: VenueRepositoryProtocol) -> None:
        self.repository = venue_repository

    def get_all_venues(self) -> list[dict[str, Any]]:
        """すべての会場を取得"""
        return self.repository.find_all()

    def get_venue(self, venue_id: UUID) -> dict[str, Any]:
        """指定した会場情報を取得"""
        return self.repository.find_by_id(venue_id)

    def create_venue(self, venue_data: dict[str, Any]) -> dict[str, Any]:
        """会場を作成"""
        return self.repository.create(venue_data)

    def update_venue(self, venue_id: UUID, venue_data: dict[str, Any]) -> dict[str, Any]:
        """指定した会場情報を更新"""
        return self.repository.update(venue_id, venue_data)

    def remove_venue(self, venue_id: UUID) -> bool:
        """指定した会場を削除"""
        venue = self.repository.find_by_id(venue_id)

        if not venue:
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        self.repository.delete(venue_id)

        return True
