"""
舞台エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_stage_service, get_part_service, get_member_assignment_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_stage, make_part, make_member_assignment


class TestGetStages:
    """GET /api/v1/stages/ のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)

    def test_get_stages_returns_200(self):
        data = [make_stage(), make_stage()]
        self.mock_service.get_all_stages.return_value = data
        response = self.client.get("/api/v1/stages/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_stages_with_status_filter(self):
        data = [make_stage(status="active")]
        self.mock_service.get_stages_by_status.return_value = data
        response = self.client.get("/api/v1/stages/?status_filter=active")
        assert response.status_code == 200
        self.mock_service.get_stages_by_status.assert_called_once_with("active")

    def test_get_stages_empty(self):
        self.mock_service.get_all_stages.return_value = []
        response = self.client.get("/api/v1/stages/")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_stages_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_stages.return_value = [make_stage()]
        response = self.client.get("/api/v1/stages/")
        assert response.status_code == 200

    def test_get_stages_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/stages/")
        assert response.status_code in [401, 403]


class TestGetStageById:
    """GET /api/v1/stages/{stage_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)

    def test_get_stage_by_id_returns_200(self):
        stage_id = str(uuid4())
        stage_data = make_stage(id=stage_id)
        self.mock_service.get_stage_by_id.return_value = stage_data
        response = self.client.get(f"/api/v1/stages/{stage_id}")
        assert response.status_code == 200


class TestCreateStage:
    """POST /api/v1/stages/ のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)

    def test_create_stage_returns_201(self):
        stage_data = make_stage()
        self.mock_service.create_stage.return_value = stage_data
        payload = {
            "name": "新しい舞台",
            "description": "テスト用舞台",
            "performance_date": "2024-06-15",
            "status": "active",
        }
        response = self.client.post("/api/v1/stages/", json=payload)
        assert response.status_code == 201

    def test_create_stage_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "name": "新しい舞台",
            "description": "テスト用舞台",
            "performance_date": "2024-06-15",
            "status": "active",
        }
        response = self.client.post("/api/v1/stages/", json=payload)
        assert response.status_code == 403


class TestUpdateStage:
    """PUT /api/v1/stages/{stage_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)

    def test_update_stage_returns_200(self):
        stage_id = str(uuid4())
        updated_data = make_stage(id=stage_id, name="更新舞台")
        self.mock_service.update_stage.return_value = updated_data
        payload = {"name": "更新舞台"}
        response = self.client.put(f"/api/v1/stages/{stage_id}", json=payload)
        assert response.status_code == 200

    def test_update_stage_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        stage_id = str(uuid4())
        payload = {"name": "更新舞台"}
        response = self.client.put(f"/api/v1/stages/{stage_id}", json=payload)
        assert response.status_code == 403


class TestDeleteStage:
    """DELETE /api/v1/stages/{stage_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)

    def test_delete_stage_returns_204(self):
        stage_id = str(uuid4())
        self.mock_service.delete_stage.return_value = None
        response = self.client.delete(f"/api/v1/stages/{stage_id}")
        assert response.status_code == 204

    def test_delete_stage_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        stage_id = str(uuid4())
        response = self.client.delete(f"/api/v1/stages/{stage_id}")
        assert response.status_code == 403

    def test_delete_stage_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)
        client = TestClient(app)
        stage_id = str(uuid4())
        response = client.delete(f"/api/v1/stages/{stage_id}")
        assert response.status_code in [401, 403]


class TestGetStageParts:
    """GET /api/v1/stages/{stage_id}/parts のテスト"""

    def setup_method(self):
        self.mock_stage_service = Mock()
        self.mock_part_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_stage_service
        app.dependency_overrides[get_part_service] = lambda: self.mock_part_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)
        app.dependency_overrides.pop(get_part_service, None)

    def test_get_stage_parts_returns_200(self):
        stage_id = str(uuid4())
        self.mock_stage_service.get_stage_by_id.return_value = make_stage(id=stage_id)
        parts = [make_part(stage_id=stage_id)]
        self.mock_part_service.get_parts_by_stage_id.return_value = parts
        response = self.client.get(f"/api/v1/stages/{stage_id}/parts")
        assert response.status_code == 200


class TestGetStageMembers:
    """GET /api/v1/stages/{stage_id}/members のテスト"""

    def setup_method(self):
        self.mock_stage_service = Mock()
        self.mock_part_service = Mock()
        self.mock_assignment_service = Mock()
        app.dependency_overrides[get_stage_service] = lambda: self.mock_stage_service
        app.dependency_overrides[get_part_service] = lambda: self.mock_part_service
        app.dependency_overrides[get_member_assignment_service] = lambda: self.mock_assignment_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_stage_service, None)
        app.dependency_overrides.pop(get_part_service, None)
        app.dependency_overrides.pop(get_member_assignment_service, None)

    def test_get_stage_members_returns_200(self):
        stage_id = str(uuid4())
        part_id = str(uuid4())
        self.mock_stage_service.get_stage_by_id.return_value = make_stage(id=stage_id)
        self.mock_part_service.get_parts_by_stage_id.return_value = [make_part(id=part_id, stage_id=stage_id)]
        self.mock_assignment_service.get_assignments_with_details.return_value = [
            make_member_assignment(part_id=part_id)
        ]
        response = self.client.get(f"/api/v1/stages/{stage_id}/members")
        assert response.status_code == 200

    def test_get_stage_members_no_parts_returns_empty(self):
        stage_id = str(uuid4())
        self.mock_stage_service.get_stage_by_id.return_value = make_stage(id=stage_id)
        self.mock_part_service.get_parts_by_stage_id.return_value = []
        response = self.client.get(f"/api/v1/stages/{stage_id}/members")
        assert response.status_code == 200
        assert response.json() == []
