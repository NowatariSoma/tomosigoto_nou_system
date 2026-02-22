"""
セッション指導者エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_session_instructor_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_session_instructor


class TestGetInstructorCandidates:
    """GET /api/v1/session-instructors/candidates のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_candidates_returns_200(self):
        schedule_id = str(uuid4())
        candidates = [{"id": str(uuid4()), "name": "テスト指導者"}]
        self.mock_service.get_instructor_candidates.return_value = candidates
        response = self.client.get(f"/api/v1/session-instructors/candidates?practice_schedule_id={schedule_id}")
        assert response.status_code == 200

    def test_get_candidates_as_member_returns_403(self):
        """指導者以上のみアクセス可能"""
        clear_auth_overrides()
        override_auth_as_member()
        schedule_id = str(uuid4())
        response = self.client.get(f"/api/v1/session-instructors/candidates?practice_schedule_id={schedule_id}")
        assert response.status_code == 403


class TestGetSessionInstructors:
    """GET /api/v1/session-instructors/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_session_instructors_returns_200(self):
        data = [make_session_instructor()]
        self.mock_service.get_all_session_instructors_simple.return_value = data
        response = self.client.get("/api/v1/session-instructors/")
        assert response.status_code == 200

    def test_get_session_instructors_with_schedule_filter(self):
        schedule_id = str(uuid4())
        data = [make_session_instructor(schedule_id=schedule_id)]
        self.mock_service.get_all_session_instructors_simple.return_value = data
        response = self.client.get(f"/api/v1/session-instructors/?schedule_id={schedule_id}")
        assert response.status_code == 200

    def test_get_session_instructors_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_session_instructors_simple.return_value = []
        response = self.client.get("/api/v1/session-instructors/")
        assert response.status_code == 200

    def test_get_session_instructors_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/session-instructors/")
        assert response.status_code in [401, 403]


class TestGetSessionInstructorById:
    """GET /api/v1/session-instructors/{session_instructor_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_by_id_returns_200(self):
        instructor_id = str(uuid4())
        data = make_session_instructor(id=instructor_id)
        self.mock_service.get_session_instructor.return_value = data
        response = self.client.get(f"/api/v1/session-instructors/{instructor_id}")
        assert response.status_code == 200


class TestGetSessionInstructorsBySchedule:
    """GET /api/v1/session-instructors/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        data = [make_session_instructor(schedule_id=schedule_id)]
        self.mock_service.get_session_instructors_by_schedule.return_value = data
        response = self.client.get(f"/api/v1/session-instructors/schedule/{schedule_id}")
        assert response.status_code == 200


class TestGetSessionInstructorsByScheduleAndSlot:
    """GET /api/v1/session-instructors/schedule/{schedule_id}/slot/{slot_order} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_by_schedule_and_slot_returns_200(self):
        schedule_id = str(uuid4())
        data = [make_session_instructor(schedule_id=schedule_id, slot_order=1)]
        self.mock_service.get_session_instructors_by_schedule_and_slot.return_value = data
        response = self.client.get(f"/api/v1/session-instructors/schedule/{schedule_id}/slot/1")
        assert response.status_code == 200


class TestGetSessionInstructorsByAttendance:
    """GET /api/v1/session-instructors/attendance/{attendance_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_get_by_attendance_returns_200(self):
        attendance_id = str(uuid4())
        data = [make_session_instructor(attendance_id=attendance_id)]
        self.mock_service.get_session_instructors_by_attendance.return_value = data
        response = self.client.get(f"/api/v1/session-instructors/attendance/{attendance_id}")
        assert response.status_code == 200


class TestCreateSessionInstructor:
    """POST /api/v1/session-instructors/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_create_returns_200(self):
        data = make_session_instructor()
        self.mock_service.create_session_instructor.return_value = data
        payload = {
            "attendance_id": str(uuid4()),
            "schedule_id": str(uuid4()),
            "schedule_available_venue_id": str(uuid4()),
            "slot_order": 1,
        }
        response = self.client.post("/api/v1/session-instructors/", json=payload)
        assert response.status_code == 200

    def test_create_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "attendance_id": str(uuid4()),
            "schedule_id": str(uuid4()),
            "schedule_available_venue_id": str(uuid4()),
            "slot_order": 1,
        }
        response = self.client.post("/api/v1/session-instructors/", json=payload)
        assert response.status_code == 403


class TestCreateSessionInstructorsBulk:
    """POST /api/v1/session-instructors/bulk のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_bulk_create_returns_200(self):
        result = {
            "created_count": 1,
            "created_items": [make_session_instructor()],
            "errors": [],
        }
        self.mock_service.create_session_instructors_bulk.return_value = result
        payload = {
            "schedule_id": str(uuid4()),
            "slot_order": 1,
            "schedule_available_venue_id": str(uuid4()),
            "attendance_ids": [str(uuid4())],
        }
        response = self.client.post("/api/v1/session-instructors/bulk", json=payload)
        assert response.status_code == 200


class TestUpdateSessionInstructor:
    """PUT /api/v1/session-instructors/{session_instructor_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_update_returns_200(self):
        instructor_id = str(uuid4())
        updated_data = make_session_instructor(id=instructor_id, slot_order=2)
        self.mock_service.update_session_instructor.return_value = updated_data
        payload = {"slot_order": 2}
        response = self.client.put(f"/api/v1/session-instructors/{instructor_id}", json=payload)
        assert response.status_code == 200

    def test_update_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        instructor_id = str(uuid4())
        payload = {"slot_order": 2}
        response = self.client.put(f"/api/v1/session-instructors/{instructor_id}", json=payload)
        assert response.status_code == 403


class TestDeleteSessionInstructor:
    """DELETE /api/v1/session-instructors/{session_instructor_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_delete_returns_200(self):
        instructor_id = str(uuid4())
        self.mock_service.delete_session_instructor.return_value = True
        response = self.client.delete(f"/api/v1/session-instructors/{instructor_id}")
        assert response.status_code == 200

    def test_delete_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        instructor_id = str(uuid4())
        response = self.client.delete(f"/api/v1/session-instructors/{instructor_id}")
        assert response.status_code == 403

    def test_delete_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)
        client = TestClient(app)
        instructor_id = str(uuid4())
        response = client.delete(f"/api/v1/session-instructors/{instructor_id}")
        assert response.status_code in [401, 403]


class TestDeleteSessionInstructorsBySchedule:
    """DELETE /api/v1/session-instructors/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_delete_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        self.mock_service.delete_session_instructors_by_schedule.return_value = 3
        response = self.client.delete(f"/api/v1/session-instructors/schedule/{schedule_id}")
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 3


class TestDeleteSessionInstructorsByScheduleAndSlot:
    """DELETE /api/v1/session-instructors/schedule/{schedule_id}/slot/{slot_order} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_delete_by_schedule_and_slot_returns_200(self):
        schedule_id = str(uuid4())
        self.mock_service.delete_session_instructors_by_schedule_and_slot.return_value = 2
        response = self.client.delete(f"/api/v1/session-instructors/schedule/{schedule_id}/slot/1")
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 2


class TestMoveSessionInstructor:
    """PUT /api/v1/session-instructors/{session_instructor_id}/move のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_session_instructor_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_session_instructor_service, None)

    def test_move_returns_200(self):
        instructor_id = str(uuid4())
        target_venue_id = str(uuid4())
        updated_data = make_session_instructor(id=instructor_id)
        self.mock_service.move_session_instructor.return_value = updated_data
        response = self.client.put(
            f"/api/v1/session-instructors/{instructor_id}/move"
            f"?target_venue_id={target_venue_id}&target_slot_order=2"
        )
        assert response.status_code == 200

    def test_move_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        instructor_id = str(uuid4())
        target_venue_id = str(uuid4())
        response = self.client.put(
            f"/api/v1/session-instructors/{instructor_id}/move"
            f"?target_venue_id={target_venue_id}&target_slot_order=2"
        )
        assert response.status_code == 403
