"""UserProfileRepositoryのユニットテスト"""

import pytest

from app.repositories.user_profile_repository import UserProfileRepository
from tests.helpers.factories import make_user_profile
from tests.helpers.supabase_mock import SupabaseMockBuilder


class TestUserProfileRepository:
    """UserProfileRepositoryのユニットテスト"""

    def setup_method(self):
        """各テスト前にモッククライアントとリポジトリを初期化"""
        self.data = make_user_profile(
            id="profile-1",
            user_id="user-1",
            student_id="S12345678",
            first_name_kanji="太郎",
            last_name_kanji="テスト",
        )
        # get_profile_by_user_idはdepartments JOINを行うため、departments情報を含める
        self.data_with_dept = {
            **self.data,
            "departments": {
                "department_code": "LIT",
                "department_name": "文学部",
            },
        }
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data_with_dept]).build()
        self.repo = UserProfileRepository(self.mock_client)

    # --- get_profile_by_user_id ---

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id(self):
        result = await self.repo.get_profile_by_user_id("user-1")
        assert result is not None
        assert result["user_id"] == "user-1"
        assert result["department_code"] == "LIT"
        assert result["department_name"] == "文学部"
        self.mock_client.table.assert_called_with("user_profiles")

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.get_profile_by_user_id("nonexistent")
        assert result is None

    # --- get_profiles_by_user_ids ---

    @pytest.mark.asyncio
    async def test_get_profiles_by_user_ids(self):
        result = await self.repo.get_profiles_by_user_ids(["user-1"])
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_profiles_by_user_ids_empty_input(self):
        result = await self.repo.get_profiles_by_user_ids([])
        assert result == []

    # --- get_profile_by_student_id ---

    @pytest.mark.asyncio
    async def test_get_profile_by_student_id(self):
        result = await self.repo.get_profile_by_student_id("S12345678")
        assert result is not None

    @pytest.mark.asyncio
    async def test_get_profile_by_student_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.get_profile_by_student_id("NOTEXIST")
        assert result is None

    # --- create_profile ---

    @pytest.mark.asyncio
    async def test_create_profile(self):
        """create_profileは作成後にget_profile_by_user_idを呼ぶ"""
        result = await self.repo.create_profile({"user_id": "user-1", "student_id": "S12345678"})
        assert result is not None
        assert result["user_id"] == "user-1"

    @pytest.mark.asyncio
    async def test_create_profile_empty_response(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.create_profile({"user_id": "user-1"})
        assert result == {}

    # --- update_profile ---

    @pytest.mark.asyncio
    async def test_update_profile(self):
        """update_profileはget_profile_by_user_idを内部的に呼ぶ"""
        result = await self.repo.update_profile("user-1", {"first_name_kanji": "次郎"})
        assert result is not None

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.update_profile("nonexistent", {"first_name_kanji": "次郎"})
        assert result is None

    # --- delete_profile ---

    @pytest.mark.asyncio
    async def test_delete_profile(self):
        result = await self.repo.delete_profile("user-1")
        assert result is True

    # --- check_student_id_exists ---

    @pytest.mark.asyncio
    async def test_check_student_id_exists_true(self):
        result = await self.repo.check_student_id_exists("S12345678")
        assert result is True

    @pytest.mark.asyncio
    async def test_check_student_id_exists_false(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.check_student_id_exists("NOTEXIST")
        assert result is False

    # --- get_profile_count ---

    @pytest.mark.asyncio
    async def test_get_profile_count(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[], count=15).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.get_profile_count()
        assert result == 15

    # --- check_email_exists ---

    @pytest.mark.asyncio
    async def test_check_email_exists_true(self):
        result = await self.repo.check_email_exists("test@example.com")
        assert result is True

    @pytest.mark.asyncio
    async def test_check_email_exists_false(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = UserProfileRepository(self.mock_client)
        result = await self.repo.check_email_exists("notfound@example.com")
        assert result is False
