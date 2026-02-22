"""MemberAssignmentRepositoryのユニットテスト"""

import pytest

from app.repositories.member_assignment_repository import MemberAssignmentRepository
from tests.helpers.factories import make_member_assignment
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestMemberAssignmentRepository:
    """MemberAssignmentRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_member_assignment(
            id="assign-1", user_id="user-1", part_id="part-1"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("member_assignments")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("assign-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- find_by_part_id ---

    @pytest.mark.asyncio
    async def test_find_by_part_id(self):
        result = await self.repo.find_by_part_id("part-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_part_id_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.find_by_part_id("part-1")
        assert result == []

    # --- find_by_user_id ---

    @pytest.mark.asyncio
    async def test_find_by_user_id(self):
        result = await self.repo.find_by_user_id("user-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_user_id_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.find_by_user_id("user-1")
        assert result == []

    # --- find_by_user_and_part ---

    @pytest.mark.asyncio
    async def test_find_by_user_and_part(self):
        result = await self.repo.find_by_user_and_part("user-1", "part-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_user_and_part_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.find_by_user_and_part("user-1", "part-1")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_create_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.create(self.data)
        assert result == {}

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("assign-1", {"display_order": 5})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.update("nonexistent", {"display_order": 5})
        assert result is None

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("assign-1")
        assert result is True

    # --- count ---

    @pytest.mark.asyncio
    async def test_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=7).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.count()
        assert result == 7

    @pytest.mark.asyncio
    async def test_count_zero(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=None).build()
        self.repo = MemberAssignmentRepository(self.mock_client)
        result = await self.repo.count()
        assert result is None
