"""StageRepositoryのユニットテスト"""

import pytest

from app.repositories.stage_repository import StageRepository
from tests.helpers.factories import make_stage
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestStageRepository:
    """StageRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_stage(id="stage-1", name="テスト舞台")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = StageRepository(self.mock_client)

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("stage-1")
        assert result == self.data
        self.mock_client.table.assert_called_with("stages")

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = StageRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- exists ---

    @pytest.mark.asyncio
    async def test_exists_true(self):
        result = await self.repo.exists("stage-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_exists_false(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = StageRepository(self.mock_client)
        result = await self.repo.exists("nonexistent")
        assert not result
