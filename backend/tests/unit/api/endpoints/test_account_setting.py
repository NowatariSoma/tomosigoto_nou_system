"""
アカウント設定エンドポイントのユニットテスト
"""
import pytest
from typing import Any
from unittest.mock import Mock, MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_account_setting_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)


def make_account_profile(**overrides: Any) -> dict[str, Any]:
    """AccountSettingProfileResponse に合致するテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "student_id": f"S{uuid4().hex[:8].upper()}",
        "first_name_kanji": "太郎",
        "first_name_katakana": "タロウ",
        "last_name_kanji": "テスト",
        "last_name_katakana": "テスト",
        "year": 3,
        "department_code": "CS",
        "department_name": "情報学部",
        "email": f"test-{uuid4().hex[:8]}@example.com",
        "avatar_url": None,
        "preferences": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


class TestCheckProfileExists:
    """GET /api/v1/account-setting/profile/exists のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_profile_exists_returns_true(self):
        self.mock_service.get_profile_by_user_id.return_value = make_account_profile()
        response = self.client.get("/api/v1/account-setting/profile/exists")
        assert response.status_code == 200
        assert response.json()["exists"] is True

    def test_profile_not_exists_returns_false(self):
        self.mock_service.get_profile_by_user_id.return_value = None
        response = self.client.get("/api/v1/account-setting/profile/exists")
        assert response.status_code == 200
        assert response.json()["exists"] is False

    def test_profile_exists_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/account-setting/profile/exists")
        assert response.status_code in [401, 403]


class TestGetCurrentUserProfile:
    """GET /api/v1/account-setting/profile のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_profile_returns_200(self):
        profile_data = make_account_profile()
        self.mock_service.get_profile_by_user_id.return_value = profile_data
        response = self.client.get("/api/v1/account-setting/profile")
        assert response.status_code == 200

    def test_get_profile_not_found(self):
        self.mock_service.get_profile_by_user_id.return_value = None
        response = self.client.get("/api/v1/account-setting/profile")
        # APIException(ErrorMessage.USER_NOT_FOUND) が発生するはず
        assert response.status_code in [404, 500]


class TestGetUserProfile:
    """GET /api/v1/account-setting/profile/{user_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_user_profile_returns_200(self):
        user_id = str(uuid4())
        profile_data = make_account_profile(user_id=user_id)
        self.mock_service.get_profile_by_user_id.return_value = profile_data
        response = self.client.get(f"/api/v1/account-setting/profile/{user_id}")
        assert response.status_code == 200

    def test_get_user_profile_not_found(self):
        user_id = str(uuid4())
        self.mock_service.get_profile_by_user_id.return_value = None
        response = self.client.get(f"/api/v1/account-setting/profile/{user_id}")
        assert response.status_code in [404, 500]


class TestCreateUserProfile:
    """POST /api/v1/account-setting/profile のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_create_profile_returns_201(self):
        profile_data = make_account_profile()
        self.mock_service.get_profile_by_user_id.return_value = None
        validation = MagicMock()
        validation.is_valid = True
        self.mock_service.validate_profile_data.return_value = validation
        self.mock_service.create_profile.return_value = profile_data
        payload = {
            "student_id": "S12345678",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "テスト",
            "last_name_katakana": "テスト",
            "year": 3,
            "department_code": "CS",
        }
        response = self.client.post("/api/v1/account-setting/profile", json=payload)
        assert response.status_code == 201

    def test_create_profile_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)
        client = TestClient(app)
        payload = {
            "student_id": "S12345678",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "テスト",
            "last_name_katakana": "テスト",
            "year": 3,
            "department_code": "CS",
        }
        response = client.post("/api/v1/account-setting/profile", json=payload)
        assert response.status_code in [401, 403]


class TestUpdateUserProfile:
    """PUT /api/v1/account-setting/profile のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_update_profile_returns_200(self):
        profile_data = make_account_profile()
        validation = MagicMock()
        validation.is_valid = True
        self.mock_service.validate_profile_data.return_value = validation
        self.mock_service.update_profile.return_value = profile_data
        payload = {"first_name_kanji": "次郎"}
        response = self.client.put("/api/v1/account-setting/profile", json=payload)
        assert response.status_code == 200


class TestDeleteUserProfile:
    """DELETE /api/v1/account-setting/profile のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_delete_profile_returns_200(self):
        self.mock_service.delete_profile.return_value = True
        response = self.client.delete("/api/v1/account-setting/profile")
        assert response.status_code == 200
        assert response.json()["message"] == "Profile deleted successfully"

    def test_delete_profile_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)
        client = TestClient(app)
        response = client.delete("/api/v1/account-setting/profile")
        assert response.status_code in [401, 403]


class TestGetDepartments:
    """GET /api/v1/account-setting/departments のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_departments_returns_200(self):
        departments = [
            {
                "id": str(uuid4()),
                "department_code": "CS",
                "department_name": "情報学部",
                "is_active": True,
                "campus": "メインキャンパス",
                "created_at": "2024-01-01T00:00:00.000Z",
                "updated_at": "2024-01-01T00:00:00.000Z",
            },
        ]
        self.mock_service.get_all_departments.return_value = departments
        response = self.client.get("/api/v1/account-setting/departments")
        assert response.status_code == 200


class TestGetDepartmentByCode:
    """GET /api/v1/account-setting/departments/{department_code} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_department_by_code_returns_200(self):
        department = {
            "id": str(uuid4()),
            "department_code": "CS",
            "department_name": "情報学部",
            "is_active": True,
            "campus": "メインキャンパス",
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z",
        }
        self.mock_service.get_department_by_code.return_value = department
        response = self.client.get("/api/v1/account-setting/departments/CS")
        assert response.status_code == 200

    def test_get_department_by_code_not_found(self):
        self.mock_service.get_department_by_code.return_value = None
        response = self.client.get("/api/v1/account-setting/departments/INVALID")
        assert response.status_code in [404, 500]


class TestGetProfileStatistics:
    """GET /api/v1/account-setting/statistics のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_statistics_as_admin_returns_200(self):
        self.mock_service.get_profile_statistics.return_value = {"total": 10, "active": 8}
        response = self.client.get("/api/v1/account-setting/statistics")
        assert response.status_code == 200

    def test_get_statistics_as_member_returns_403(self):
        """管理者専用エンドポイント"""
        clear_auth_overrides()
        override_auth_as_member()
        response = self.client.get("/api/v1/account-setting/statistics")
        assert response.status_code == 403


class TestValidateProfileData:
    """POST /api/v1/account-setting/validate のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_validate_returns_200(self):
        validation_result = {"is_valid": True, "errors": []}
        self.mock_service.validate_profile_data.return_value = validation_result
        payload = {"student_id": "S12345678"}
        response = self.client.post("/api/v1/account-setting/validate", json=payload)
        assert response.status_code == 200


class TestGetProfileByStudentId:
    """GET /api/v1/account-setting/profile/student-id/{student_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_account_setting_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_account_setting_service, None)

    def test_get_profile_by_student_id_returns_200(self):
        profile_data = make_account_profile(student_id="S12345678")
        self.mock_service.get_profile_by_student_id.return_value = profile_data
        response = self.client.get("/api/v1/account-setting/profile/student-id/S12345678")
        assert response.status_code == 200

    def test_get_profile_by_student_id_not_found(self):
        self.mock_service.get_profile_by_student_id.return_value = None
        response = self.client.get("/api/v1/account-setting/profile/student-id/INVALID")
        assert response.status_code in [404, 500]
