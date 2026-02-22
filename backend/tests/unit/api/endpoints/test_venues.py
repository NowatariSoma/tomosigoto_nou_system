"""
会場エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_venue_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_venue


class TestGetVenues:
    """GET /api/v1/venues/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)

    def test_get_venues_returns_200_with_data(self):
        data = [make_venue(), make_venue()]
        self.mock_service.get_all_venues.return_value = data
        response = self.client.get("/api/v1/venues/")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_venues_returns_empty_list(self):
        self.mock_service.get_all_venues.return_value = []
        response = self.client.get("/api/v1/venues/")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_venues_as_member(self):
        """メンバーでもアクセスできる"""
        clear_auth_overrides()
        override_auth_as_member()
        data = [make_venue()]
        self.mock_service.get_all_venues.return_value = data
        response = self.client.get("/api/v1/venues/")
        assert response.status_code == 200

    def test_get_venues_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/venues/")
        assert response.status_code in [401, 403]


class TestGetVenueById:
    """GET /api/v1/venues/{venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)

    def test_get_venue_by_id_returns_200(self):
        venue_id = str(uuid4())
        venue_data = make_venue(id=venue_id)
        self.mock_service.get_venue.return_value = venue_data
        response = self.client.get(f"/api/v1/venues/{venue_id}")
        assert response.status_code == 200
        assert response.json()["id"] == venue_id

    def test_get_venue_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)
        client = TestClient(app)
        venue_id = str(uuid4())
        response = client.get(f"/api/v1/venues/{venue_id}")
        assert response.status_code in [401, 403]


class TestCreateVenue:
    """POST /api/v1/venues/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)

    def test_create_venue_returns_200(self):
        venue_data = make_venue()
        self.mock_service.create_venue.return_value = venue_data
        payload = {
            "name": "新しい会場",
            "capacity": 100,
            "campus": "メインキャンパス",
            "is_active": True,
            "code": "NEW-VENUE",
            "address": "東京都テスト区1-1",
            "latitude": 35.6812,
            "longitude": 139.7671,
        }
        response = self.client.post("/api/v1/venues/", json=payload)
        assert response.status_code == 200

    def test_create_venue_as_member_returns_403(self):
        """メンバーは会場を作成できない（指導者以上が必要）"""
        clear_auth_overrides()
        override_auth_as_member()
        payload = {
            "name": "新しい会場",
            "capacity": 100,
            "campus": "メインキャンパス",
            "is_active": True,
            "code": "NEW-VENUE",
            "address": "東京都テスト区1-1",
            "latitude": 35.6812,
            "longitude": 139.7671,
        }
        response = self.client.post("/api/v1/venues/", json=payload)
        assert response.status_code == 403

    def test_create_venue_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)
        client = TestClient(app)
        payload = {
            "name": "新しい会場",
            "capacity": 100,
            "campus": "メインキャンパス",
            "is_active": True,
            "code": "NEW-VENUE",
            "address": "東京都テスト区1-1",
            "latitude": 35.6812,
            "longitude": 139.7671,
        }
        response = client.post("/api/v1/venues/", json=payload)
        assert response.status_code in [401, 403]


class TestPatchVenue:
    """PATCH /api/v1/venues/{venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)

    def test_patch_venue_returns_200(self):
        venue_id = str(uuid4())
        venue_data = make_venue(id=venue_id, name="更新会場")
        self.mock_service.update_venue.return_value = venue_data
        payload = {"name": "更新会場"}
        response = self.client.patch(f"/api/v1/venues/{venue_id}", json=payload)
        assert response.status_code == 200

    def test_patch_venue_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        venue_id = str(uuid4())
        payload = {"name": "更新会場"}
        response = self.client.patch(f"/api/v1/venues/{venue_id}", json=payload)
        assert response.status_code == 403


class TestDeleteVenue:
    """DELETE /api/v1/venues/{venue_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_venue_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)

    def test_delete_venue_returns_200(self):
        venue_id = str(uuid4())
        self.mock_service.remove_venue.return_value = None
        response = self.client.delete(f"/api/v1/venues/{venue_id}")
        assert response.status_code == 200

    def test_delete_venue_as_member_returns_403(self):
        clear_auth_overrides()
        override_auth_as_member()
        venue_id = str(uuid4())
        response = self.client.delete(f"/api/v1/venues/{venue_id}")
        assert response.status_code == 403

    def test_delete_venue_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_venue_service, None)
        client = TestClient(app)
        venue_id = str(uuid4())
        response = client.delete(f"/api/v1/venues/{venue_id}")
        assert response.status_code in [401, 403]
