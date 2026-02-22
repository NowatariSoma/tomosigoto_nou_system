"""AccountSettingHistoryRepositoryのユニットテスト"""

import pytest

from app.repositories.account_setting_history_repository import AccountSettingHistoryRepository
from tests.helpers.factories import make_account_setting_history
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestAccountSettingHistoryRepository:
    """AccountSettingHistoryRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_account_setting_history(
            id="history-1",
            user_id="user-1",
            field_name="email",
            old_value="old@example.com",
            new_value="new@example.com",
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)

    # --- create_history_record ---

    @pytest.mark.asyncio
    async def test_create_history_record(self):
        result = await self.repo.create_history_record(self.data)
        assert result == self.data
        self.mock_client.table.assert_called_with("account_setting_history")

    @pytest.mark.asyncio
    async def test_create_history_record_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.create_history_record(self.data)
        assert result == {}

    # --- get_history_by_user_id ---

    @pytest.mark.asyncio
    async def test_get_history_by_user_id(self):
        result = await self.repo.get_history_by_user_id("user-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_history_by_user_id_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_history_by_user_id("user-1")
        assert result == []

    # --- get_history_by_field ---

    @pytest.mark.asyncio
    async def test_get_history_by_field(self):
        result = await self.repo.get_history_by_field("user-1", "email")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_history_by_field_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_history_by_field("user-1", "name")
        assert result == []

    # --- get_history_by_id ---

    @pytest.mark.asyncio
    async def test_get_history_by_id(self):
        result = await self.repo.get_history_by_id("history-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_get_history_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_history_by_id("nonexistent")
        assert result is None

    # --- update_history_record ---

    @pytest.mark.asyncio
    async def test_update_history_record(self):
        result = await self.repo.update_history_record("history-1", {"new_value": "updated@example.com"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_history_record_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.update_history_record("nonexistent", {"new_value": "updated"})
        assert result is None

    # --- delete_history_record ---

    @pytest.mark.asyncio
    async def test_delete_history_record(self):
        result = await self.repo.delete_history_record("history-1")
        assert result is True

    # --- delete_history_by_user_id ---

    @pytest.mark.asyncio
    async def test_delete_history_by_user_id(self):
        result = await self.repo.delete_history_by_user_id("user-1")
        assert result is True

    # --- get_history_count ---

    @pytest.mark.asyncio
    async def test_get_history_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=20).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_history_count()
        assert result == 20

    @pytest.mark.asyncio
    async def test_get_history_count_zero(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=None).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_history_count()
        assert result is None

    # --- get_recent_changes ---

    @pytest.mark.asyncio
    async def test_get_recent_changes(self):
        result = await self.repo.get_recent_changes()
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_recent_changes_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = AccountSettingHistoryRepository(self.mock_client)
        result = await self.repo.get_recent_changes()
        assert result == []
