"""VenueRepositoryのユニットテスト"""

import pytest

from app.repositories.venue_repository import VenueRepository
from tests.helpers.factories import make_venue
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestVenueRepository:
    """VenueRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_venue(id="venue-1", name="テスト会場")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = VenueRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("venues")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = VenueRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("venue-1")
        assert result == self.data

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("venue-1", {"name": "更新会場"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("venue-1")
        assert result is True
