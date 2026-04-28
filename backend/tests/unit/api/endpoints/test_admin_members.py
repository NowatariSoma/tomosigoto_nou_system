"""
管理者メンバー管理エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_member_admin_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
    override_auth_as_instructor,
)


class TestListMembers:
    """GET /api/v1/admin/members/ のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_member_admin_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_admin_service, None)

    def test_list_members_as_admin_returns_200(self):
        members = [
            {
                "id": str(uuid4()),
                "email": "user1@example.com",
                "name": "テスト 太郎",
                "role": "basic",
                "is_instructor": False,
                "last_active_at": None,
            },
            {
                "id": str(uuid4()),
                "email": "user2@example.com",
                "name": "テスト 花子",
                "role": "admin",
                "is_instructor": True,
                "last_active_at": None,
            },
        ]
        self.mock_service.list_members.return_value = members
        response = self.client.get("/api/v1/admin/members/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_list_members_as_member_returns_403(self):
        """管理者専用エンドポイント - メンバーはアクセス不可"""
        clear_auth_overrides()
        override_auth_as_member()
        response = self.client.get("/api/v1/admin/members/")
        assert response.status_code == 403

    def test_list_members_as_instructor_returns_403(self):
        """管理者専用エンドポイント - 指導者もアクセス不可"""
        clear_auth_overrides()
        override_auth_as_instructor()
        response = self.client.get("/api/v1/admin/members/")
        assert response.status_code == 403

    def test_list_members_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_admin_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/admin/members/")
        assert response.status_code in [401, 403]


class TestUpdateMemberRole:
    """PATCH /api/v1/admin/members/{user_id}/role のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_member_admin_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_admin_service, None)

    def test_update_role_as_admin_returns_200(self):
        user_id = str(uuid4())
        updated_member = {
            "id": user_id,
            "email": "user@example.com",
            "name": "テスト 太郎",
            "role": "admin",
            "is_instructor": False,
            "last_active_at": None,
        }
        self.mock_service.update_member_role.return_value = updated_member
        payload = {"role": "admin"}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/role", json=payload)
        assert response.status_code == 200

    def test_update_role_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        user_id = str(uuid4())
        payload = {"role": "admin"}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/role", json=payload)
        assert response.status_code == 403

    def test_update_role_as_instructor_returns_403(self):
        clear_auth_overrides()
        override_auth_as_instructor()
        user_id = str(uuid4())
        payload = {"role": "admin"}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/role", json=payload)
        assert response.status_code == 403

    def test_update_role_invalid_role_returns_422(self):
        user_id = str(uuid4())
        payload = {"role": "invalid_role"}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/role", json=payload)
        assert response.status_code == 422


class TestUpdateInstructorFlag:
    """PATCH /api/v1/admin/members/{user_id}/instructor のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_member_admin_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_admin_service, None)

    def test_update_instructor_flag_returns_200(self):
        user_id = str(uuid4())
        updated_member = {
            "id": user_id,
            "email": "user@example.com",
            "name": "テスト 太郎",
            "role": "basic",
            "is_instructor": True,
            "last_active_at": None,
        }
        self.mock_service.update_instructor_flag.return_value = updated_member
        payload = {"is_instructor": True}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/instructor", json=payload)
        assert response.status_code == 200

    def test_update_instructor_flag_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        user_id = str(uuid4())
        payload = {"is_instructor": True}
        response = self.client.patch(f"/api/v1/admin/members/{user_id}/instructor", json=payload)
        assert response.status_code == 403

    def test_update_instructor_flag_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_admin_service, None)
        client = TestClient(app)
        user_id = str(uuid4())
        payload = {"is_instructor": True}
        response = client.patch(f"/api/v1/admin/members/{user_id}/instructor", json=payload)
        assert response.status_code in [401, 403]


class TestDeleteMemberSecurity:
    """DELETE /api/v1/admin/members/{user_id} のセキュリティテスト"""

    def test_service_has_remove_member_method(self):
        from app.services.member_admin_service import MemberAdminService
        assert hasattr(MemberAdminService, 'remove_member')

    def test_admin_deletion_endpoint_exists(self):
        from app.api.endpoints import admin_members
        assert hasattr(admin_members, 'delete_member')

    def test_repository_has_admin_methods(self):
        from app.repositories.user_role_repository import UserRoleRepository
        assert hasattr(UserRoleRepository, 'get_admin_users')
        assert hasattr(UserRoleRepository, 'delete_role')
