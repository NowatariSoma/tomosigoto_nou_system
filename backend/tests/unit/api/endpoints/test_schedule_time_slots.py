"""
スケジュール時間スロットエンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_schedule_time_slot_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_schedule_time_slot


class TestGetScheduleTimeSlots:
    """GET /api/v1/schedule-time-slots/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_get_all_returns_200(self):
        data = [make_schedule_time_slot()]
        self.mock_service.get_all_schedule_time_slots.return_value = data
        response = self.client.get("/api/v1/schedule-time-slots/")
        assert response.status_code == 200

    def test_get_with_schedule_filter(self):
        schedule_id = str(uuid4())
        data = [make_schedule_time_slot(schedule_id=schedule_id)]
        self.mock_service.get_all_schedule_time_slots.return_value = data
        response = self.client.get(f"/api/v1/schedule-time-slots/?schedule_id={schedule_id}")
        assert response.status_code == 200

    def test_get_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_schedule_time_slots.return_value = []
        response = self.client.get("/api/v1/schedule-time-slots/")
        assert response.status_code == 200

    def test_get_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/schedule-time-slots/")
        assert response.status_code in [401, 403]


class TestGetScheduleTimeSlotById:
    """GET /api/v1/schedule-time-slots/{time_slot_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_get_by_id_returns_200(self):
        slot_id = str(uuid4())
        data = make_schedule_time_slot(id=slot_id)
        self.mock_service.get_schedule_time_slot.return_value = data
        response = self.client.get(f"/api/v1/schedule-time-slots/{slot_id}")
        assert response.status_code == 200


class TestGetScheduleTimeSlotsBySchedule:
    """GET /api/v1/schedule-time-slots/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_get_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        data = [make_schedule_time_slot(schedule_id=schedule_id)]
        self.mock_service.get_schedule_time_slots_by_schedule.return_value = data
        response = self.client.get(f"/api/v1/schedule-time-slots/schedule/{schedule_id}")
        assert response.status_code == 200


class TestCreateScheduleTimeSlot:
    """POST /api/v1/schedule-time-slots/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_create_returns_200(self):
        data = make_schedule_time_slot()
        self.mock_service.create_schedule_time_slot.return_value = data
        payload = {
            "schedule_id": str(uuid4()),
            "slot_order": 1,
            "start_time": "09:00",
            "end_time": "10:00",
        }
        response = self.client.post("/api/v1/schedule-time-slots/", json=payload)
        assert response.status_code == 200

    def test_create_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "schedule_id": str(uuid4()),
            "slot_order": 1,
            "start_time": "09:00",
            "end_time": "10:00",
        }
        response = self.client.post("/api/v1/schedule-time-slots/", json=payload)
        assert response.status_code == 403

    def test_create_invalid_slot_order_returns_422(self):
        """slot_orderが0以下はPydanticバリデーションエラー（422）"""
        payload = {
            "schedule_id": str(uuid4()),
            "slot_order": 0,
            "start_time": "09:00",
            "end_time": "10:00",
        }
        response = self.client.post("/api/v1/schedule-time-slots/", json=payload)
        assert response.status_code == 422

    def test_create_invalid_time_range_returns_400(self):
        """開始時刻が終了時刻より後はバリデーションエラー"""
        payload = {
            "schedule_id": str(uuid4()),
            "slot_order": 1,
            "start_time": "10:00",
            "end_time": "09:00",
        }
        response = self.client.post("/api/v1/schedule-time-slots/", json=payload)
        assert response.status_code == 400


class TestCreateScheduleTimeSlotsBulk:
    """POST /api/v1/schedule-time-slots/bulk のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_bulk_create_returns_200(self):
        result = {
            "created_count": 1,
            "created_items": [make_schedule_time_slot()],
            "errors": [],
        }
        self.mock_service.create_schedule_time_slots_bulk.return_value = result
        payload = {
            "schedule_id": str(uuid4()),
            "time_slots": [
                {"slot_order": 1, "start_time": "09:00", "end_time": "10:00"},
            ],
        }
        response = self.client.post("/api/v1/schedule-time-slots/bulk", json=payload)
        assert response.status_code == 200


class TestUpdateScheduleTimeSlot:
    """PUT /api/v1/schedule-time-slots/{time_slot_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_update_returns_200(self):
        slot_id = str(uuid4())
        updated_data = make_schedule_time_slot(id=slot_id)
        self.mock_service.update_schedule_time_slot.return_value = updated_data
        payload = {"start_time": "10:00", "end_time": "11:00"}
        response = self.client.put(f"/api/v1/schedule-time-slots/{slot_id}", json=payload)
        assert response.status_code == 200

    def test_update_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        slot_id = str(uuid4())
        payload = {"start_time": "10:00"}
        response = self.client.put(f"/api/v1/schedule-time-slots/{slot_id}", json=payload)
        assert response.status_code == 403


class TestDeleteScheduleTimeSlot:
    """DELETE /api/v1/schedule-time-slots/{time_slot_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_delete_returns_200(self):
        slot_id = str(uuid4())
        self.mock_service.delete_schedule_time_slot.return_value = True
        response = self.client.delete(f"/api/v1/schedule-time-slots/{slot_id}")
        assert response.status_code == 200

    def test_delete_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        slot_id = str(uuid4())
        response = self.client.delete(f"/api/v1/schedule-time-slots/{slot_id}")
        assert response.status_code == 403

    def test_delete_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)
        client = TestClient(app)
        slot_id = str(uuid4())
        response = client.delete(f"/api/v1/schedule-time-slots/{slot_id}")
        assert response.status_code in [401, 403]


class TestDeleteScheduleTimeSlotsBySchedule:
    """DELETE /api/v1/schedule-time-slots/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_schedule_time_slot_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_time_slot_service, None)

    def test_delete_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        self.mock_service.delete_schedule_time_slots_by_schedule.return_value = 4
        response = self.client.delete(f"/api/v1/schedule-time-slots/schedule/{schedule_id}")
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 4
