"""ContactRepositoryのユニットテスト"""

import pytest

from app.repositories.contact_repository import ContactRepository
from tests.helpers.factories import make_contact
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestContactRepository:
    """ContactRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_contact(id="contact-1", user_id="user-1")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = ContactRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("contacts")

    @pytest.mark.asyncio
    async def test_find_all_with_user_id(self):
        result = await self.repo.find_all(user_id="user-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = ContactRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("contact-1")
        assert result == self.data

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("contact-1", {"status": "resolved"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("contact-1")
        assert result is True
