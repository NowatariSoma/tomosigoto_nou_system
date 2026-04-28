"""
スケジューリング最適化エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_scheduling_optimization_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)


class TestOptimizeSchedule:
    """POST /api/v1/scheduling/optimize のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_scheduling_optimization_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_scheduling_optimization_service, None)

    def test_optimize_returns_200(self):
        schedule_id = str(uuid4())
        result = {
            "status": "success",
            "schedule_id": schedule_id,
            "sessions_created": 5,
            "objective_value": 0.95,
            "is_optimal": True,
            "solve_time_seconds": 1.23,
            "instructor_distribution": {"instructor1": 3, "instructor2": 2},
            "part_distribution": {"part1": 3, "part2": 2},
        }
        self.mock_service.optimize_schedule.return_value = result
        payload = {
            "schedule_id": schedule_id,
        }
        response = self.client.post("/api/v1/scheduling/optimize", json=payload)
        assert response.status_code == 200

    def test_optimize_with_params(self):
        schedule_id = str(uuid4())
        result = {
            "status": "success",
            "schedule_id": schedule_id,
            "sessions_created": 5,
            "objective_value": 0.95,
            "is_optimal": True,
            "solve_time_seconds": 1.23,
            "instructor_distribution": {"instructor1": 3},
            "part_distribution": {"part1": 3},
        }
        self.mock_service.optimize_schedule.return_value = result
        payload = {
            "schedule_id": schedule_id,
            "optimization_params": {
                "max_iterations": 100,
            },
        }
        response = self.client.post("/api/v1/scheduling/optimize", json=payload)
        assert response.status_code == 200

    def test_optimize_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_scheduling_optimization_service, None)
        client = TestClient(app)
        payload = {
            "schedule_id": str(uuid4()),
        }
        response = client.post("/api/v1/scheduling/optimize", json=payload)
        assert response.status_code in [401, 403]


class TestPreviewOptimization:
    """POST /api/v1/scheduling/preview のテスト"""

    def setup_method(self):
        self.mock_service = Mock()
        app.dependency_overrides[get_scheduling_optimization_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_scheduling_optimization_service, None)

    def test_preview_returns_200(self):
        schedule_id = str(uuid4())
        result = {
            "status": "success",
            "schedule_id": schedule_id,
            "preview": True,
            "sessions_count": 5,
            "objective_value": 0.95,
            "is_optimal": True,
            "solve_time_seconds": 1.23,
            "instructor_distribution": {"instructor1": 3},
            "part_distribution": {"part1": 3},
            "schedule_matrix": {},
        }
        self.mock_service.preview_optimization.return_value = result
        payload = {
            "schedule_id": schedule_id,
        }
        response = self.client.post("/api/v1/scheduling/preview", json=payload)
        assert response.status_code == 200

    def test_preview_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_scheduling_optimization_service, None)
        client = TestClient(app)
        payload = {
            "schedule_id": str(uuid4()),
        }
        response = client.post("/api/v1/scheduling/preview", json=payload)
        assert response.status_code in [401, 403]


class TestHealthCheck:
    """GET /api/v1/scheduling/health のテスト"""

    def test_health_check_returns_200(self):
        """ヘルスチェックは認証不要"""
        client = TestClient(app)
        response = client.get("/api/v1/scheduling/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "scheduling_optimization"
