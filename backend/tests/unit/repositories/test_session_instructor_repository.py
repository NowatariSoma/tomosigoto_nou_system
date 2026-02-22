"""SessionInstructorRepositoryのユニットテスト"""

import pytest

from app.repositories.session_instructor_repository import SessionInstructorRepository
from tests.helpers.factories import make_session_instructor
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestSessionInstructorRepository:
    """SessionInstructorRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_session_instructor(
            id="si-1",
            attendance_id="att-1",
            schedule_id="schedule-1",
            slot_order=1,
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = SessionInstructorRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("session_instructors")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionInstructorRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("si-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionInstructorRepository(self.mock_client)
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
        self.repo = SessionInstructorRepository(self.mock_client)
        result = await self.repo.find_by_schedule("schedule-1")
        assert result == []

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("si-1", {"slot_order": 2})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("si-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_no_data(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionInstructorRepository(self.mock_client)
        result = await self.repo.delete("nonexistent")
        assert result is False
