"""UserRoleRepositoryのユニットテスト"""

import pytest

from app.repositories.user_role_repository import UserRoleRepository
from tests.helpers.factories import make_user_role
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestUserRoleRepository:
    """UserRoleRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_user_role(
            id="role-1", user_id="user-1", role_type="admin"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = UserRoleRepository(self.mock_client)

    # --- get_role_by_user_id ---

    @pytest.mark.asyncio
    async def test_get_role_by_user_id(self):
        result = await self.repo.get_role_by_user_id("user-1")
        assert result == self.data
        self.mock_client.table.assert_called_with("user_roles")

    @pytest.mark.asyncio
    async def test_get_role_by_user_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_role_by_user_id("nonexistent")
        assert result is None

    # --- get_role_by_user_and_type ---

    @pytest.mark.asyncio
    async def test_get_role_by_user_and_type(self):
        result = await self.repo.get_role_by_user_and_type("user-1", "admin")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_get_role_by_user_and_type_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_role_by_user_and_type("user-1", "viewer")
        assert result is None

    # --- create_role ---

    @pytest.mark.asyncio
    async def test_create_role(self):
        result = await self.repo.create_role(self.data)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_create_role_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.create_role(self.data)
        assert result == {}

    # --- update_role ---

    @pytest.mark.asyncio
    async def test_update_role(self):
        """update_roleはget_role_by_user_idを内部的に呼ぶため、同じモックを使用"""
        result = await self.repo.update_role("user-1", {"role_type": "viewer"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_role_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.update_role("nonexistent", {"role_type": "viewer"})
        assert result is None

    # --- delete_role ---

    @pytest.mark.asyncio
    async def test_delete_role(self):
        result = await self.repo.delete_role("user-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_role_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.delete_role("nonexistent")
        assert result is False

    # --- delete_role_by_type ---

    @pytest.mark.asyncio
    async def test_delete_role_by_type(self):
        result = await self.repo.delete_role_by_type("user-1", "admin")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_role_by_type_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.delete_role_by_type("user-1", "viewer")
        assert result is False

    # --- get_roles_by_type ---

    @pytest.mark.asyncio
    async def test_get_roles_by_type(self):
        result = await self.repo.get_roles_by_type("admin")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_roles_by_type_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_roles_by_type("viewer")
        assert result == []

    # --- get_all_roles ---

    @pytest.mark.asyncio
    async def test_get_all_roles(self):
        result = await self.repo.get_all_roles()
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_all_roles_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_all_roles()
        assert result == []

    # --- update_instructor_flag ---

    @pytest.mark.asyncio
    async def test_update_instructor_flag_existing(self):
        """既存のレコードがある場合、updateが呼ばれる"""
        result = await self.repo.update_instructor_flag("user-1", True)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_instructor_flag_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.update_instructor_flag("user-1", True)
        # 既存レコードが無い場合はinsertされるが、そのレスポンスも空
        assert result is None

    # --- get_instructor_flag ---

    @pytest.mark.asyncio
    async def test_get_instructor_flag_true(self):
        self.data["is_instructor"] = True
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_instructor_flag("user-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_get_instructor_flag_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserRoleRepository(self.mock_client)
        result = await self.repo.get_instructor_flag("nonexistent")
        assert result is False
