"""
メンバー所属エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_member_assignment_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_member_assignment


class TestGetMemberAssignments:
    """GET /api/v1/member-assignments/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_get_all_assignments_returns_200(self):
        data = [make_member_assignment(), make_member_assignment()]
        self.mock_service.get_all_assignments.return_value = data
        response = self.client.get("/api/v1/member-assignments/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_all_assignments_empty(self):
        self.mock_service.get_all_assignments.return_value = []
        response = self.client.get("/api/v1/member-assignments/")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_all_assignments_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_assignments.return_value = [make_member_assignment()]
        response = self.client.get("/api/v1/member-assignments/")
        assert response.status_code == 200

    def test_get_all_assignments_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/member-assignments/")
        assert response.status_code in [401, 403]


class TestGetMemberAssignmentsByUser:
    """GET /api/v1/member-assignments/by-user/{user_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_get_assignments_by_user_returns_200(self):
        user_id = str(uuid4())
        data = [make_member_assignment(user_id=user_id)]
        self.mock_service.get_assignments_by_user.return_value = data
        response = self.client.get(f"/api/v1/member-assignments/by-user/{user_id}")
        assert response.status_code == 200


class TestGetMemberAssignmentById:
    """GET /api/v1/member-assignments/{assignment_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_get_assignment_by_id_returns_200(self):
        assignment_id = str(uuid4())
        data = make_member_assignment(id=assignment_id)
        self.mock_service.get_assignment_by_id.return_value = data
        response = self.client.get(f"/api/v1/member-assignments/{assignment_id}")
        assert response.status_code == 200
        assert response.json()["id"] == assignment_id


class TestCreateMemberAssignment:
    """POST /api/v1/member-assignments/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_create_assignment_returns_200(self):
        assignment_data = make_member_assignment()
        self.mock_service.create_assignment.return_value = assignment_data
        payload = {
            "user_id": str(uuid4()),
            "part_id": str(uuid4()),
            "category": "utai",
            "display_order": 1,
        }
        response = self.client.post("/api/v1/member-assignments/", json=payload)
        assert response.status_code == 200

    def test_create_assignment_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "user_id": str(uuid4()),
            "part_id": str(uuid4()),
            "category": "utai",
            "display_order": 1,
        }
        response = self.client.post("/api/v1/member-assignments/", json=payload)
        assert response.status_code == 403


class TestBulkAssignToPart:
    """POST /api/v1/member-assignments/bulk/{part_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_bulk_assign_returns_200(self):
        part_id = str(uuid4())
        assignments = [make_member_assignment(part_id=part_id)]
        self.mock_service.bulk_assign_to_part.return_value = assignments
        payload = {
            "assignments": [
                {
                    "user_id": str(uuid4()),
                    "category": "utai",
                    "display_order": 1,
                }
            ]
        }
        response = self.client.post(f"/api/v1/member-assignments/bulk/{part_id}", json=payload)
        assert response.status_code == 200

    def test_bulk_assign_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        part_id = str(uuid4())
        payload = {
            "assignments": [
                {
                    "user_id": str(uuid4()),
                    "category": "utai",
                    "display_order": 1,
                }
            ]
        }
        response = self.client.post(f"/api/v1/member-assignments/bulk/{part_id}", json=payload)
        assert response.status_code == 403


class TestUpdateMemberAssignment:
    """PUT /api/v1/member-assignments/{assignment_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_update_assignment_returns_200(self):
        assignment_id = str(uuid4())
        updated_data = make_member_assignment(id=assignment_id, category="mai")
        self.mock_service.update_assignment.return_value = updated_data
        payload = {
            "user_id": str(uuid4()),
            "part_id": str(uuid4()),
            "category": "mai",
            "display_order": 2,
        }
        response = self.client.put(f"/api/v1/member-assignments/{assignment_id}", json=payload)
        assert response.status_code == 200

    def test_update_assignment_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        assignment_id = str(uuid4())
        payload = {
            "user_id": str(uuid4()),
            "part_id": str(uuid4()),
            "category": "mai",
            "display_order": 2,
        }
        response = self.client.put(f"/api/v1/member-assignments/{assignment_id}", json=payload)
        assert response.status_code == 403


class TestDeleteMemberAssignment:
    """DELETE /api/v1/member-assignments/{assignment_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_delete_assignment_returns_200(self):
        assignment_id = str(uuid4())
        self.mock_service.remove_assignment.return_value = None
        response = self.client.delete(f"/api/v1/member-assignments/{assignment_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Member assignment deleted successfully"

    def test_delete_assignment_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        assignment_id = str(uuid4())
        response = self.client.delete(f"/api/v1/member-assignments/{assignment_id}")
        assert response.status_code == 403

    def test_delete_assignment_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)
        client = TestClient(app)
        assignment_id = str(uuid4())
        response = client.delete(f"/api/v1/member-assignments/{assignment_id}")
        assert response.status_code in [401, 403]


class TestDeleteMemberAssignmentByUserAndPart:
    """DELETE /api/v1/member-assignments/by-user-and-part/{user_id}/{part_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_delete_by_user_and_part_returns_200(self):
        user_id = str(uuid4())
        part_id = str(uuid4())
        self.mock_service.remove_assignment_by_user_and_part.return_value = None
        response = self.client.delete(f"/api/v1/member-assignments/by-user-and-part/{user_id}/{part_id}")
        assert response.status_code == 200
        assert response.json()["message"] == "Member assignment deleted successfully"

    def test_delete_by_user_and_part_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        user_id = str(uuid4())
        part_id = str(uuid4())
        response = self.client.delete(f"/api/v1/member-assignments/by-user-and-part/{user_id}/{part_id}")
        assert response.status_code == 403
