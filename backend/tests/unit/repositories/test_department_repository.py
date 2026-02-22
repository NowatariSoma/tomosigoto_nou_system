"""DepartmentRepositoryのユニットテスト"""

import pytest

from app.repositories.department_repository import DepartmentRepository
from tests.helpers.factories import make_department
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestDepartmentRepository:
    """DepartmentRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_department(
            id="dept-1", department_code="LIT", department_name="文学部"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = DepartmentRepository(self.mock_client)

    # --- get_all_departments ---

    @pytest.mark.asyncio
    async def test_get_all_departments(self):
        result = await self.repo.get_all_departments()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("departments")

    @pytest.mark.asyncio
    async def test_get_all_departments_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_all_departments()
        assert result == []

    # --- get_department_by_code ---

    @pytest.mark.asyncio
    async def test_get_department_by_code(self):
        result = await self.repo.get_department_by_code("LIT")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_get_department_by_code_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_department_by_code("NOTEXIST")
        assert result is None

    # --- get_department_by_id ---

    @pytest.mark.asyncio
    async def test_get_department_by_id(self):
        result = await self.repo.get_department_by_id("dept-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_get_department_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_department_by_id("nonexistent")
        assert result is None

    # --- create_department ---

    @pytest.mark.asyncio
    async def test_create_department(self):
        result = await self.repo.create_department(self.data)
        assert result == self.data

    @pytest.mark.asyncio
    async def test_create_department_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.create_department(self.data)
        assert result == {}

    # --- update_department ---

    @pytest.mark.asyncio
    async def test_update_department(self):
        result = await self.repo.update_department("dept-1", {"department_name": "理学部"})
        assert result == self.data

    @pytest.mark.asyncio
    async def test_update_department_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.update_department("nonexistent", {"department_name": "理学部"})
        assert result is None

    # --- delete_department (論理削除) ---

    @pytest.mark.asyncio
    async def test_delete_department(self):
        result = await self.repo.delete_department("dept-1")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_department_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.delete_department("nonexistent")
        assert result is False

    # --- get_departments_by_campus ---

    @pytest.mark.asyncio
    async def test_get_departments_by_campus(self):
        result = await self.repo.get_departments_by_campus("メインキャンパス")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_get_departments_by_campus_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_departments_by_campus("存在しない")
        assert result == []

    # --- get_department_count ---

    @pytest.mark.asyncio
    async def test_get_department_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=8).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_department_count()
        assert result == 8

    @pytest.mark.asyncio
    async def test_get_department_count_zero(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=None).build()
        self.repo = DepartmentRepository(self.mock_client)
        result = await self.repo.get_department_count()
        assert result is None
