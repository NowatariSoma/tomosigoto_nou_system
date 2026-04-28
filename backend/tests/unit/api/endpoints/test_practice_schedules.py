import pytest
from unittest.mock import Mock
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app
from app.api.deps import (
    get_practice_schedule_service,
    require_member_or_above,
    require_instructor_or_admin,
)

CURRENT_USER = {"id": str(uuid4()), "role": "admin"}
SCHEDULE_ID = str(uuid4())


class TestPracticeSlotsEndpoints:
    """Test cases for practice-slots endpoints"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[require_member_or_above] = lambda: CURRENT_USER
        app.dependency_overrides[require_instructor_or_admin] = lambda: CURRENT_USER
        app.dependency_overrides[get_practice_schedule_service] = lambda: self.mock_service
        self.client = TestClient(app, raise_server_exceptions=False)

    def teardown_method(self):
        app.dependency_overrides.pop(require_member_or_above, None)
        app.dependency_overrides.pop(require_instructor_or_admin, None)
        app.dependency_overrides.pop(get_practice_schedule_service, None)

    def test_get_practice_schedules_success(self, sample_practice_schedules):
        self.mock_service.get_all_practice_schedules.return_value = sample_practice_schedules
        response = self.client.get("/api/v1/practice_schedules/")
        assert response.status_code == 200
        assert len(response.json()) == len(sample_practice_schedules)

    def test_get_practice_schedule_by_id_success(self, sample_practice_schedule):
        self.mock_service.get_practice_schedule.return_value = sample_practice_schedule
        response = self.client.get(f"/api/v1/practice_schedules/{SCHEDULE_ID}")
        assert response.status_code == 200

    def test_get_practice_schedule_not_found(self):
        self.mock_service.get_practice_schedule.side_effect = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="練習スケジュールが見つかりません"
        )
        response = self.client.get(f"/api/v1/practice_schedules/{SCHEDULE_ID}")
        assert response.status_code == 404

    def test_get_practice_schedule_with_details_success(self, sample_practice_schedule_with_details):
        self.mock_service.get_practice_schedule_ideal_format_by_id.return_value = sample_practice_schedule_with_details
        response = self.client.get(f"/api/v1/practice_schedules/{SCHEDULE_ID}/details")
        assert response.status_code == 200

    def test_update_practice_schedule_success(self, sample_practice_schedule):
        self.mock_service.update_practice_schedule.return_value = sample_practice_schedule
        response = self.client.put(
            f"/api/v1/practice_schedules/{SCHEDULE_ID}",
            json={"description": "更新済み"}
        )
        assert response.status_code == 200

    def test_delete_practice_schedule_success(self):
        self.mock_service.remove_practice_schedule.return_value = True
        response = self.client.delete(f"/api/v1/practice_schedules/{SCHEDULE_ID}")
        assert response.status_code == 200

    def test_get_sessions_by_schedule_success(self):
        session = {
            "id": str(uuid4()),
            "schedule_id": SCHEDULE_ID,
            "slot_order": 1,
            "priority": 0,
        }
        self.mock_service.get_sessions_by_schedule.return_value = [session]
        response = self.client.get(f"/api/v1/practice_schedules/{SCHEDULE_ID}/sessions")
        assert response.status_code == 200

    def test_create_session_success(self):
        session = {
            "id": str(uuid4()),
            "schedule_id": SCHEDULE_ID,
            "slot_order": 1,
            "priority": 0,
        }
        self.mock_service.create_session.return_value = session
        session_data = {
            "schedule_id": SCHEDULE_ID,
            "slot_order": 1,
            "priority": 1,
        }
        response = self.client.post("/api/v1/practice_schedules/sessions", json=session_data)
        assert response.status_code == 200

    def test_endpoints_require_authentication(self):
        app.dependency_overrides.pop(require_member_or_above, None)
        app.dependency_overrides.pop(require_instructor_or_admin, None)
        app.dependency_overrides.pop(get_practice_schedule_service, None)
        client = TestClient(app)

        endpoints = [
            ("/api/v1/practice_schedules/", "GET"),
            (f"/api/v1/practice_schedules/{SCHEDULE_ID}", "GET"),
        ]
        for endpoint, method in endpoints:
            response = client.get(endpoint)
            assert response.status_code in [401, 403, 422], \
                f"Endpoint {endpoint} should require auth, got {response.status_code}"

    def test_unauthorized_access(self):
        def raise_401():
            raise HTTPException(status_code=401, detail="Could not validate credentials")

        app.dependency_overrides[require_member_or_above] = raise_401
        response = self.client.get("/api/v1/practice_schedules/")
        assert response.status_code == 401

    def test_create_practice_schedule_invalid_data(self):
        response = self.client.post(
            "/api/v1/practice_schedules/",
            json={"description": "説明のみ"}
        )
        assert response.status_code == 422

    def test_create_practice_schedule_service_error(self):
        self.mock_service.create_practice_schedule.side_effect = Exception("Database error")
        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "新しい練習セッション"
        }
        response = self.client.post("/api/v1/practice_schedules/", json=schedule_data)
        assert response.status_code == 500
