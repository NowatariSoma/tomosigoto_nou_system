"""
パートエンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_part_service, get_member_assignment_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_part, make_member_assignment


class TestGetParts:
    """GET /api/v1/parts/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)

    def test_get_parts_returns_200_with_data(self):
        data = [make_part(), make_part()]
        self.mock_service.get_all_parts.return_value = data
        response = self.client.get("/api/v1/parts/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_parts_returns_empty_list(self):
        self.mock_service.get_all_parts.return_value = []
        response = self.client.get("/api/v1/parts/")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_parts_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_parts.return_value = [make_part()]
        response = self.client.get("/api/v1/parts/")
        assert response.status_code == 200

    def test_get_parts_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/parts/")
        assert response.status_code in [401, 403]


class TestGetPartById:
    """GET /api/v1/parts/{part_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)

    def test_get_part_by_id_returns_200(self):
        part_id = str(uuid4())
        part_data = make_part(id=part_id)
        self.mock_service.get_part.return_value = part_data
        response = self.client.get(f"/api/v1/parts/{part_id}")
        assert response.status_code == 200
        assert response.json()["id"] == part_id


class TestCreatePart:
    """POST /api/v1/parts/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)

    def test_create_part_returns_200(self):
        part_data = make_part()
        self.mock_service.create_part.return_value = part_data
        payload = {
            "name": "新しいパート",
            "description": "テスト用パート",
            "status": "active",
            "stage_id": str(uuid4()),
        }
        response = self.client.post("/api/v1/parts/", json=payload)
        assert response.status_code == 200

    def test_create_part_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "name": "新しいパート",
            "description": "テスト用パート",
            "status": "active",
            "stage_id": str(uuid4()),
        }
        response = self.client.post("/api/v1/parts/", json=payload)
        assert response.status_code == 403


class TestUpdatePart:
    """PUT /api/v1/parts/{part_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)

    def test_update_part_returns_200(self):
        part_id = str(uuid4())
        updated_data = make_part(id=part_id, name="更新パート")
        self.mock_service.update_part.return_value = updated_data
        payload = {
            "name": "更新パート",
            "description": "更新説明",
            "status": "active",
            "stage_id": str(uuid4()),
        }
        response = self.client.put(f"/api/v1/parts/{part_id}", json=payload)
        assert response.status_code == 200

    def test_update_part_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        part_id = str(uuid4())
        payload = {
            "name": "更新パート",
            "description": "更新説明",
            "status": "active",
            "stage_id": str(uuid4()),
        }
        response = self.client.put(f"/api/v1/parts/{part_id}", json=payload)
        assert response.status_code == 403


class TestDeletePart:
    """DELETE /api/v1/parts/{part_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)

    def test_delete_part_returns_200(self):
        part_id = str(uuid4())
        self.mock_service.remove_part.return_value = None
        response = self.client.delete(f"/api/v1/parts/{part_id}")
        assert response.status_code == 200

    def test_delete_part_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        part_id = str(uuid4())
        response = self.client.delete(f"/api/v1/parts/{part_id}")
        assert response.status_code == 403

    def test_delete_part_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)
        client = TestClient(app)
        part_id = str(uuid4())
        response = client.delete(f"/api/v1/parts/{part_id}")
        assert response.status_code in [401, 403]


class TestGetPartMembers:
    """GET /api/v1/parts/{part_id}/members のテスト"""

    def setup_method(self):
        self.mock_part_service = AsyncMock()
        self.mock_assignment_service = AsyncMock()
        app.dependency_overrides[get_part_service] = lambda: self.mock_part_service
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_assignment_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_part_service, None)
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_get_part_members_returns_200(self):
        part_id = str(uuid4())
        self.mock_part_service.get_part.return_value = make_part(id=part_id)
        members = [make_member_assignment(part_id=part_id)]
        self.mock_assignment_service.get_assignments_with_details.return_value = members
        response = self.client.get(f"/api/v1/parts/{part_id}/members")
        assert response.status_code == 200

    def test_get_part_members_with_category_filter(self):
        part_id = str(uuid4())
        self.mock_part_service.get_part.return_value = make_part(id=part_id)
        members = [make_member_assignment(part_id=part_id, category="utai")]
        self.mock_assignment_service.get_assignments_with_details.return_value = members
        response = self.client.get(f"/api/v1/parts/{part_id}/members?category=utai")
        assert response.status_code == 200

    def test_get_part_members_invalid_category_returns_400(self):
        part_id = str(uuid4())
        self.mock_part_service.get_part.return_value = make_part(id=part_id)
        self.mock_assignment_service.get_assignments_with_details.return_value = []
        response = self.client.get(f"/api/v1/parts/{part_id}/members?category=invalid")
        assert response.status_code == 400
