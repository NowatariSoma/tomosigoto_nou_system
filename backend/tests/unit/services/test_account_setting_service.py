"""
AccountSettingService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

from app.services.account_setting_service import AccountSettingService
from app.core.exceptions import APIException
from app.schemas.account_setting import (
    AccountSettingProfileCreate,
    AccountSettingUpdateRequest,
)
from tests.helpers.factories import make_user_profile


class TestAccountSettingService:
    """AccountSettingService のテスト"""

    def setup_method(self):
        self.mock_profile_repo = AsyncMock()
        self.mock_department_repo = AsyncMock()
        self.mock_history_repo = AsyncMock()
        self.service = AccountSettingService(
            user_profile_repository=self.mock_profile_repo,
            department_repository=self.mock_department_repo,
            history_repository=self.mock_history_repo,
        )

    # ===== get_profile_by_user_id =====

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id_success(self):
        """ユーザーIDでプロフィール取得 - 正常"""
        user_id = str(uuid4())
        profile_data = make_user_profile(
            user_id=user_id,
            grade=3,
            department_id=str(uuid4()),
        )
        # department_code/department_nameが含まれるケース
        profile_data["department_code"] = "CS"
        profile_data["department_name"] = "情報工学部"

        self.mock_profile_repo.get_profile_by_user_id.return_value = profile_data

        result = await self.service.get_profile_by_user_id(user_id)

        assert result is not None
        assert result.user_id == user_id
        assert result.year == 3

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id_not_found(self):
        """ユーザーIDでプロフィール取得 - なし"""
        self.mock_profile_repo.get_profile_by_user_id.return_value = None

        result = await self.service.get_profile_by_user_id(str(uuid4()))

        assert result is None

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id_fallback_department(self):
        """ユーザーIDでプロフィール取得 - 学部情報をdepartment_idから取得"""
        user_id = str(uuid4())
        dept_id = str(uuid4())
        profile_data = make_user_profile(
            user_id=user_id,
            grade=2,
            department_id=dept_id,
        )
        # department_codeがデフォルト値("LIT")の場合、department_idから再取得
        profile_data["department_code"] = "LIT"
        profile_data["department_name"] = "文学部"

        self.mock_profile_repo.get_profile_by_user_id.return_value = profile_data
        self.mock_department_repo.get_department_by_id.return_value = {
            "department_code": "ENG",
            "department_name": "工学部",
        }

        result = await self.service.get_profile_by_user_id(user_id)

        assert result is not None
        assert result.department_code == "ENG"

    # ===== create_profile =====

    @pytest.mark.asyncio
    async def test_create_profile_success(self):
        """プロフィール作成 - 正常"""
        user_id = str(uuid4())
        dept_id = str(uuid4())
        profile_create = AccountSettingProfileCreate(
            student_id="S12345678",
            first_name_kanji="太郎",
            first_name_katakana="タロウ",
            last_name_kanji="テスト",
            last_name_katakana="テスト",
            year=3,
            department_code="CS",
            email="test@example.com",
        )

        self.mock_department_repo.get_department_by_code.return_value = {
            "id": dept_id,
            "department_code": "CS",
            "department_name": "情報工学部",
        }
        self.mock_profile_repo.check_student_id_exists.return_value = False

        created_data = make_user_profile(
            user_id=user_id,
            student_id="S12345678",
            grade=3,
            department_id=dept_id,
        )
        created_data["department_code"] = "CS"
        created_data["department_name"] = "情報工学部"
        self.mock_profile_repo.create_profile.return_value = created_data

        result = await self.service.create_profile(user_id, profile_create)

        assert result.student_id == "S12345678"
        self.mock_profile_repo.create_profile.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_profile_invalid_department(self):
        """プロフィール作成 - 無効な学部コード"""
        profile_create = AccountSettingProfileCreate(
            student_id="S12345678",
            first_name_kanji="太郎",
            first_name_katakana="タロウ",
            last_name_kanji="テスト",
            last_name_katakana="テスト",
            year=3,
            department_code="INVALID",
            email="test@example.com",
        )

        self.mock_department_repo.get_department_by_code.return_value = None

        with pytest.raises(APIException):
            await self.service.create_profile(str(uuid4()), profile_create)

    @pytest.mark.asyncio
    async def test_create_profile_duplicate_student_id(self):
        """プロフィール作成 - 学籍番号重複"""
        profile_create = AccountSettingProfileCreate(
            student_id="S12345678",
            first_name_kanji="太郎",
            first_name_katakana="タロウ",
            last_name_kanji="テスト",
            last_name_katakana="テスト",
            year=3,
            department_code="CS",
            email="test@example.com",
        )

        self.mock_department_repo.get_department_by_code.return_value = {
            "id": str(uuid4()),
            "department_code": "CS",
        }
        self.mock_profile_repo.check_student_id_exists.return_value = True

        with pytest.raises(APIException):
            await self.service.create_profile(str(uuid4()), profile_create)

    # ===== delete_profile =====

    @pytest.mark.asyncio
    async def test_delete_profile_success(self):
        """プロフィール削除 - 正常"""
        user_id = str(uuid4())
        self.mock_profile_repo.get_profile_by_user_id.return_value = make_user_profile(
            user_id=user_id
        )
        self.mock_profile_repo.delete_profile.return_value = True

        result = await self.service.delete_profile(user_id)

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_profile_not_found(self):
        """プロフィール削除 - 存在しない"""
        self.mock_profile_repo.get_profile_by_user_id.return_value = None

        with pytest.raises(APIException):
            await self.service.delete_profile(str(uuid4()))

    # ===== get_all_departments =====

    @pytest.mark.asyncio
    async def test_get_all_departments(self):
        """全学部取得"""
        departments = [
            {
                "id": str(uuid4()),
                "department_code": "CS",
                "department_name": "情報工学部",
                "is_active": True,
            },
            {
                "id": str(uuid4()),
                "department_code": "LIT",
                "department_name": "文学部",
                "is_active": True,
            },
        ]
        self.mock_department_repo.get_all_departments.return_value = departments

        result = await self.service.get_all_departments()

        assert len(result) == 2

    # ===== validate_profile_data =====

    @pytest.mark.asyncio
    async def test_validate_profile_data_valid(self):
        """バリデーション - 正常データ"""
        profile_data = {
            "student_id": "S12345678",
            "email": "valid@example.com",
            "year": 3,
            "first_name_kanji": "太郎",
            "last_name_kanji": "テスト",
            "first_name_katakana": "タロウ",
            "last_name_katakana": "テスト",
        }

        self.mock_profile_repo.check_student_id_exists.return_value = False
        self.mock_profile_repo.check_email_exists.return_value = False

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is True
        assert len(result.errors) == 0

    @pytest.mark.asyncio
    async def test_validate_profile_data_empty_student_id(self):
        """バリデーション - 空の学籍番号"""
        profile_data = {"student_id": ""}

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is False
        assert any(e.field == "student_id" for e in result.errors)

    @pytest.mark.asyncio
    async def test_validate_profile_data_short_student_id(self):
        """バリデーション - 短すぎる学籍番号"""
        profile_data = {"student_id": "S123"}

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is False
        assert any(e.field == "student_id" for e in result.errors)

    @pytest.mark.asyncio
    async def test_validate_profile_data_invalid_email(self):
        """バリデーション - 無効なメールアドレス"""
        profile_data = {"email": "invalid"}

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is False
        assert any(e.field == "email" for e in result.errors)

    @pytest.mark.asyncio
    async def test_validate_profile_data_invalid_year(self):
        """バリデーション - 無効な学年"""
        profile_data = {"year": 7}

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is False
        assert any(e.field == "year" for e in result.errors)

    @pytest.mark.asyncio
    async def test_validate_profile_data_empty_name(self):
        """バリデーション - 空の名前"""
        profile_data = {"first_name_kanji": ""}

        result = await self.service.validate_profile_data(profile_data)

        assert result.is_valid is False
