"""ScheduleAvailableVenueRepositoryのユニットテスト"""

import pytest

from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from tests.helpers.factories import make_schedule_available_venue
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestScheduleAvailableVenueRepository:
    """ScheduleAvailableVenueRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_schedule_available_venue(
            id="sav-1", schedule_id="schedule-1", venue_id="venue-1"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("schedule_available_venues")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("sav-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_schedule ---

    @pytest.mark.asyncio
    async def test_find_by_schedule(self):
        """find_by_scheduleはJOINでvenues情報を含むデータを返す"""
        data_with_venues = {
            **self.data,
            "venues": {"id": "venue-1", "name": "テスト会場", "campus": "メイン", "address": "東京"},
        }
        mock_client = SupabaseMockBuilder().with_response(data=[data_with_venues]).build()
        repo = ScheduleAvailableVenueRepository(mock_client)
        result = await repo.find_by_schedule("schedule-1")
        assert len(result) == 1
        assert result[0]["name"] == "テスト会場"

    @pytest.mark.asyncio
    async def test_find_by_schedule_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.find_by_schedule("schedule-1")
        assert result == []

    # --- find_by_venue ---

    @pytest.mark.asyncio
    async def test_find_by_venue(self):
        result = await self.repo.find_by_venue("venue-1")
        assert result == [self.data]

    # --- find_by_schedule_and_venue ---

    @pytest.mark.asyncio
    async def test_find_by_schedule_and_venue(self):
        result = await self.repo.find_by_schedule_and_venue("schedule-1", "venue-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_schedule_and_venue_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.find_by_schedule_and_venue("schedule-1", "venue-1")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("sav-1", {"is_preferred": True})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("sav-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_no_data(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.delete("nonexistent")
        assert result is False

    # --- delete_by_schedule ---

    @pytest.mark.asyncio
    async def test_delete_by_schedule(self):
        result = await self.repo.delete_by_schedule("schedule-1")
        assert result == 1

    @pytest.mark.asyncio
    async def test_delete_by_schedule_none(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleAvailableVenueRepository(self.mock_client)
        result = await self.repo.delete_by_schedule("schedule-1")
        assert result == 0
