"""ScheduleTimeSlotRepositoryのユニットテスト"""

import pytest

from app.repositories.schedule_time_slot_repository import ScheduleTimeSlotRepository
from tests.helpers.factories import make_schedule_time_slot
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestScheduleTimeSlotRepository:
    """ScheduleTimeSlotRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_schedule_time_slot(
            id="slot-1", schedule_id="schedule-1", slot_order=1
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("schedule_time_slots")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("slot-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_schedule ---

    @pytest.mark.asyncio
    async def test_find_by_schedule(self):
        result = await self.repo.find_by_schedule("schedule-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_schedule_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        result = await self.repo.find_by_schedule("schedule-1")
        assert result == []

    # --- count_all ---

    @pytest.mark.asyncio
    async def test_count_all(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=5).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        result = await self.repo.count_all()
        assert result == 5

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("slot-1", {"start_time": "10:00"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_not_found(self):
        """updateでデータが無い場合、ValueErrorが発生しAPIExceptionにラップされる"""
        from fastapi import HTTPException

        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        with pytest.raises(HTTPException):
            await self.repo.update("nonexistent", {"start_time": "10:00"})

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("slot-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_no_data(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
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
        self.repo = ScheduleTimeSlotRepository(self.mock_client)
        result = await self.repo.delete_by_schedule("schedule-1")
        assert result == 0
