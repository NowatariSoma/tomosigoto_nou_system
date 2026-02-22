"""PartRepositoryのユニットテスト"""

import pytest

from app.repositories.part_repository import PartRepository
from tests.helpers.factories import make_part
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestPartRepository:
    """PartRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_part(id="part-1", name="テストパート", status="active")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = PartRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("parts")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("part-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_name ---

    @pytest.mark.asyncio
    async def test_find_by_name(self):
        result = await self.repo.find_by_name("テストパート")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_name_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.find_by_name("存在しない")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_create_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.create(self.data)
        assert result == {}

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("part-1", {"name": "更新パート"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.update("nonexistent", {"name": "更新パート"})
        assert result is None

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("part-1")
        assert result is True

    # --- count ---

    @pytest.mark.asyncio
    async def test_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=10).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.count()
        assert result == 10

    @pytest.mark.asyncio
    async def test_count_zero(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=None).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.count()
        assert result is None

    # --- find_active ---

    @pytest.mark.asyncio
    async def test_find_active(self):
        result = await self.repo.find_active()
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_active_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.find_active()
        assert result == []

    # --- find_by_stage_id ---

    @pytest.mark.asyncio
    async def test_find_by_stage_id(self):
        result = await self.repo.find_by_stage_id("stage-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_stage_id_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = PartRepository(self.mock_client)
        result = await self.repo.find_by_stage_id("stage-1")
        assert result == []
