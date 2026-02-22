"""UserRepositoryのユニットテスト"""

import pytest

from app.repositories.user_repository import UserRepository
from tests.helpers.factories import make_user
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestUserRepository:
    """UserRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_user(id="user-1", name="テスト太郎", email="test@example.com")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = UserRepository(self.mock_client)

    # --- get_user_by_id ---

    @pytest.mark.asyncio
    async def test_get_user_by_id(self):
        result = await self.repo.get_user_by_id("user-1")
        assert result == self.data
        self.mock_client.table.assert_called_with("users")

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.get_user_by_id("nonexistent")
        assert result is None

    # --- get_user_by_email ---

    @pytest.mark.asyncio
    async def test_get_user_by_email(self):
        result = await self.repo.get_user_by_email("test@example.com")
        assert result == self.data
        self.mock_client.table.assert_called_with("users")

    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.get_user_by_email("notfound@example.com")
        assert result is None

    # --- create_user ---

    @pytest.mark.asyncio
    async def test_create_user(self):
        result = await self.repo.create_user(self.data)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_create_user_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.create_user(self.data)
        assert result == {}

    # --- update_user ---

    @pytest.mark.asyncio
    async def test_update_user(self):
        result = await self.repo.update_user("user-1", {"name": "更新太郎"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_user_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.update_user("nonexistent", {"name": "更新太郎"})
        assert result is None

    # --- delete_user ---

    @pytest.mark.asyncio
    async def test_delete_user(self):
        result = await self.repo.delete_user("user-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.delete_user("nonexistent")
        assert result is False

    # --- get_all_users ---

    @pytest.mark.asyncio
    async def test_get_all_users(self):
        result = await self.repo.get_all_users()
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_all_users_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.get_all_users()
        assert result == []

    # --- get_user_count ---

    @pytest.mark.asyncio
    async def test_get_user_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=5).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.get_user_count()
        assert result == 5

    @pytest.mark.asyncio
    async def test_get_user_count_zero(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=None).build()
        self.repo = UserRepository(self.mock_client)
        result = await self.repo.get_user_count()
        assert result == 0
