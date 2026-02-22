"""PracticeScheduleRepositoryのユニットテスト"""

import pytest

from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from tests.helpers.factories import make_practice_schedule
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestPracticeScheduleRepository:
    """PracticeScheduleRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_practice_schedule(
            id="schedule-1", schedule_date="2024-02-15"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = PracticeScheduleRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("practice_schedules")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PracticeScheduleRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("schedule-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PracticeScheduleRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_date ---

    @pytest.mark.asyncio
    async def test_find_by_date(self):
        result = await self.repo.find_by_date("2024-02-15")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_date_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PracticeScheduleRepository(self.mock_client)
        result = await self.repo.find_by_date("2024-12-31")
        assert result is None

    # --- find_by_date_range ---

    @pytest.mark.asyncio
    async def test_find_by_date_range(self):
        result = await self.repo.find_by_date_range("2024-02-01", "2024-03-01")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_date_range_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PracticeScheduleRepository(self.mock_client)
        result = await self.repo.find_by_date_range("2025-01-01", "2025-02-01")
        assert result == []

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data.copy())
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("schedule-1", {"title": "更新練習"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("schedule-1")
        assert result is True
