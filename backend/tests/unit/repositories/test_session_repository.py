"""SessionRepository（session_repository.py）のユニットテスト"""

import pytest

from app.repositories.session_repository import SessionRepository
from tests.helpers.factories import make_session
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestSessionRepository:
    """SessionRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_session(
            id="session-1", schedule_id="schedule-1", part_id="part-1"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = SessionRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("sessions")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        """find_by_idはパート名を追加取得するためpartsテーブルにもアクセスする"""
        part_data = {"name": "テストパート"}
        mock_client = (
            SupabaseMockBuilder()
            .for_table("sessions").with_response(data=[self.data])
            .for_table("parts").with_response(data=[part_data])
            .build()
        )
        repo = SessionRepository(mock_client)
        result = await repo.find_by_id("session-1")
        assert result["id"] == "session-1"
        assert result["part_name"] == "テストパート"

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_schedule ---

    @pytest.mark.asyncio
    async def test_find_by_schedule(self):
        """find_by_scheduleはJOINでparts情報を含むデータを返す"""
        session_with_parts = {**self.data, "parts": {"id": "part-1", "name": "テストパート"}}
        mock_client = SupabaseMockBuilder().with_response(data=[session_with_parts]).build()
        repo = SessionRepository(mock_client)
        result = await repo.find_by_schedule("schedule-1")
        assert len(result) == 1
        assert result[0]["part_name"] == "テストパート"

    @pytest.mark.asyncio
    async def test_find_by_schedule_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionRepository(self.mock_client)
        result = await self.repo.find_by_schedule("schedule-1")
        assert result == []

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data.copy())
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("session-1", {"slot_order": 2})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("session-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_no_data(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = SessionRepository(self.mock_client)
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
        self.repo = SessionRepository(self.mock_client)
        result = await self.repo.delete_by_schedule("schedule-1")
        assert result == 0
