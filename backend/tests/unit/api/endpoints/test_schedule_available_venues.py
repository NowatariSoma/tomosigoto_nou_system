"""
スケジュール利用可能会場エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_schedule_available_venue_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_schedule_available_venue


class TestGetScheduleAvailableVenues:
    """GET /api/v1/schedule-available-venues/ のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_get_all_returns_200(self):
        data = [make_schedule_available_venue()]
        self.mock_service.get_all_schedule_available_venues.return_value = data
        response = self.client.get("/api/v1/schedule-available-venues/")
        assert response.status_code == 200

    def test_get_with_schedule_filter(self):
        schedule_id = str(uuid4())
        data = [make_schedule_available_venue(schedule_id=schedule_id)]
        self.mock_service.get_all_schedule_available_venues.return_value = data
        response = self.client.get(f"/api/v1/schedule-available-venues/?schedule_id={schedule_id}")
        assert response.status_code == 200

    def test_get_with_venue_filter(self):
        venue_id = str(uuid4())
        data = [make_schedule_available_venue(venue_id=venue_id)]
        self.mock_service.get_all_schedule_available_venues.return_value = data
        response = self.client.get(f"/api/v1/schedule-available-venues/?venue_id={venue_id}")
        assert response.status_code == 200

    def test_get_as_member(self):
        clear_auth_overrides()
        override_auth_as_member()
        self.mock_service.get_all_schedule_available_venues.return_value = []
        response = self.client.get("/api/v1/schedule-available-venues/")
        assert response.status_code == 200

    def test_get_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/schedule-available-venues/")
        assert response.status_code in [401, 403]


class TestGetScheduleAvailableVenueById:
    """GET /api/v1/schedule-available-venues/{schedule_venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_get_by_id_returns_200(self):
        venue_id = str(uuid4())
        data = make_schedule_available_venue(id=venue_id)
        self.mock_service.get_schedule_available_venue.return_value = data
        response = self.client.get(f"/api/v1/schedule-available-venues/{venue_id}")
        assert response.status_code == 200


class TestGetScheduleAvailableVenuesBySchedule:
    """GET /api/v1/schedule-available-venues/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_get_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        data = [make_schedule_available_venue(schedule_id=schedule_id)]
        self.mock_service.get_schedule_available_venues_by_schedule.return_value = data
        response = self.client.get(f"/api/v1/schedule-available-venues/schedule/{schedule_id}")
        assert response.status_code == 200


class TestGetScheduleAvailableVenuesByVenue:
    """GET /api/v1/schedule-available-venues/venue/{venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_get_by_venue_returns_200(self):
        venue_id = str(uuid4())
        data = [make_schedule_available_venue(venue_id=venue_id)]
        self.mock_service.get_schedule_available_venues_by_venue.return_value = data
        response = self.client.get(f"/api/v1/schedule-available-venues/venue/{venue_id}")
        assert response.status_code == 200


class TestCreateScheduleAvailableVenue:
    """POST /api/v1/schedule-available-venues/ のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_create_returns_200(self):
        data = make_schedule_available_venue()
        self.mock_service.create_schedule_available_venue.return_value = data
        payload = {
            "schedule_id": str(uuid4()),
            "venue_id": str(uuid4()),
            "is_preferred": False,
            "priority": 0,
        }
        response = self.client.post("/api/v1/schedule-available-venues/", json=payload)
        assert response.status_code == 200

    def test_create_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "schedule_id": str(uuid4()),
            "venue_id": str(uuid4()),
            "is_preferred": False,
            "priority": 0,
        }
        response = self.client.post("/api/v1/schedule-available-venues/", json=payload)
        assert response.status_code == 403


class TestCreateScheduleAvailableVenuesBulk:
    """POST /api/v1/schedule-available-venues/bulk のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_bulk_create_returns_200(self):
        result = {
            "created_count": 1,
            "created_items": [make_schedule_available_venue()],
            "errors": [],
        }
        self.mock_service.create_schedule_available_venues_bulk.return_value = result
        payload = {
            "schedule_id": str(uuid4()),
            "venues": [
                {"venue_id": str(uuid4()), "is_preferred": True, "priority": 1},
            ],
        }
        response = self.client.post("/api/v1/schedule-available-venues/bulk", json=payload)
        assert response.status_code == 200


class TestUpdateScheduleAvailableVenue:
    """PUT /api/v1/schedule-available-venues/{schedule_venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_update_returns_200(self):
        venue_id = str(uuid4())
        updated_data = make_schedule_available_venue(id=venue_id, priority=5)
        self.mock_service.update_schedule_available_venue.return_value = updated_data
        payload = {"priority": 5}
        response = self.client.put(f"/api/v1/schedule-available-venues/{venue_id}", json=payload)
        assert response.status_code == 200

    def test_update_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        venue_id = str(uuid4())
        payload = {"priority": 5}
        response = self.client.put(f"/api/v1/schedule-available-venues/{venue_id}", json=payload)
        assert response.status_code == 403


class TestDeleteScheduleAvailableVenue:
    """DELETE /api/v1/schedule-available-venues/{schedule_venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_delete_returns_200(self):
        venue_id = str(uuid4())
        self.mock_service.delete_schedule_available_venue.return_value = True
        response = self.client.delete(f"/api/v1/schedule-available-venues/{venue_id}")
        assert response.status_code == 200

    def test_delete_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        venue_id = str(uuid4())
        response = self.client.delete(f"/api/v1/schedule-available-venues/{venue_id}")
        assert response.status_code == 403

    def test_delete_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)
        client = TestClient(app)
        venue_id = str(uuid4())
        response = client.delete(f"/api/v1/schedule-available-venues/{venue_id}")
        assert response.status_code in [401, 403]


class TestDeleteScheduleAvailableVenuesBySchedule:
    """DELETE /api/v1/schedule-available-venues/schedule/{schedule_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_delete_by_schedule_returns_200(self):
        schedule_id = str(uuid4())
        self.mock_service.delete_schedule_available_venues_by_schedule.return_value = 3
        response = self.client.delete(f"/api/v1/schedule-available-venues/schedule/{schedule_id}")
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 3


class TestDeleteScheduleAvailableVenuesByVenue:
    """DELETE /api/v1/schedule-available-venues/venue/{venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_schedule_available_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_schedule_available_venue_service, None)

    def test_delete_by_venue_returns_200(self):
        venue_id = str(uuid4())
        self.mock_service.delete_schedule_available_venues_by_venue.return_value = 2
        response = self.client.delete(f"/api/v1/schedule-available-venues/venue/{venue_id}")
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 2
