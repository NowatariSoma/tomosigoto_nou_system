import pytest
from datetime import date, time, datetime
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app


class TestPracticeSlotsEndpoints:
    """Test cases for practice-slots endpoints"""

    def setup_method(self):
        """Setup test client for each test"""
        self.client = TestClient(app)

    def test_get_practice_schedules_success(self, sample_practice_schedules):
        """Test successful GET /practice-slots/"""
        from app.api.deps import get_practice_schedule_service

        # Create a mock service with async method
        mock_service = Mock()
        mock_service.get_all_practice_schedules = AsyncMock(return_value=sample_practice_schedules)

        def mock_get_service():
            return mock_service

        # Override dependency
        app.dependency_overrides[get_practice_schedule_service] = mock_get_service

        try:
            response = self.client.get("/api/practice-slots/")

            assert response.status_code == 200
            response_data = response.json()

            # Check that we got the expected number of schedules
            assert len(response_data) == len(sample_practice_schedules)

            # Check the basic fields for each schedule
            for i, schedule in enumerate(response_data):
                expected = sample_practice_schedules[i]
                assert schedule['id'] == expected['id']
                assert schedule['schedule_date'] == expected['schedule_date']
                assert schedule['description'] == expected['description']
                assert schedule['schedule_type'] == expected['schedule_type']
                assert schedule['status'] == expected['status']

            mock_service.get_all_practice_schedules.assert_called_once()
        finally:
            # Clean up
            app.dependency_overrides.clear()

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_get_practice_schedule_by_id_success(
        self, mock_get_service, mock_get_current_user, sample_practice_schedule
    ):
        """Test successful GET /practice-slots/{schedule_id}"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_practice_schedule = AsyncMock(return_value=sample_practice_schedule)
        mock_get_service.return_value = mock_service

        schedule_id = "test-schedule-id"
        response = self.client.get(
            f"/api/practice-slots/{schedule_id}",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == sample_practice_schedule
        mock_service.get_practice_schedule.assert_called_once_with(schedule_id)

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_get_practice_schedule_not_found(
        self, mock_get_service, mock_get_current_user
    ):
        """Test GET /practice-slots/{schedule_id} with non-existent schedule"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_practice_schedule = AsyncMock(
            side_effect=HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="練習スケジュールが見つかりません"
            )
        )
        mock_get_service.return_value = mock_service

        response = self.client.get(
            "/api/practice-slots/nonexistent-id",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 404
        assert "練習スケジュールが見つかりません" in response.json()["detail"]

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_get_practice_schedule_with_details_success(
        self, mock_get_service, mock_get_current_user, sample_practice_schedule_with_details
    ):
        """Test successful GET /practice-slots/{schedule_id}/details"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_practice_schedule_with_details = AsyncMock(
            return_value=sample_practice_schedule_with_details
        )
        mock_get_service.return_value = mock_service

        schedule_id = "test-schedule-id"
        response = self.client.get(
            f"/api/practice-slots/{schedule_id}/details",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert "available_venues" in response_data
        assert "sessions" in response_data
        mock_service.get_practice_schedule_with_details.assert_called_once_with(schedule_id)

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_create_practice_schedule_success(
        self, mock_get_service, mock_get_current_user, sample_practice_schedule
    ):
        """Test successful POST /practice-slots/"""
        mock_get_current_user.return_value = {"id": "current-user-id"}
        mock_service = Mock()
        mock_service.create_practice_schedule = AsyncMock(return_value=sample_practice_schedule)
        mock_get_service.return_value = mock_service

        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "新しい練習セッション",
            "schedule_type": "regular",
            "status": "active"
        }

        response = self.client.post(
            "/api/practice-slots/",
            headers={"Authorization": "Bearer valid-token"},
            json=schedule_data
        )

        assert response.status_code == 200
        assert response.json() == sample_practice_schedule
        mock_service.create_practice_schedule.assert_called_once()

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_create_practice_schedule_with_details_success(
        self, mock_get_service, mock_get_current_user, sample_practice_schedule_with_details
    ):
        """Test successful POST /practice-slots/with-details"""
        mock_get_current_user.return_value = {"id": "current-user-id"}
        mock_service = Mock()
        mock_service.create_practice_schedule_with_details = AsyncMock(
            return_value=sample_practice_schedule_with_details
        )
        mock_get_service.return_value = mock_service

        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "新しい練習セッション",
            "available_venues": [
                {
                    "venue_id": "venue-1",
                    "is_preferred": True,
                    "priority": 1
                }
            ],
            "sessions": [
                {
                    "title": "セッション1",
                    "start_time": "09:00:00",
                    "end_time": "12:00:00",
                    "priority": 1,
                    "instructors": [
                        {"user_id": "instructor-1"}
                    ]
                }
            ]
        }

        response = self.client.post(
            "/api/practice-slots/with-details",
            headers={"Authorization": "Bearer valid-token"},
            json=schedule_data
        )

        assert response.status_code == 200
        response_data = response.json()
        assert "available_venues" in response_data
        assert "sessions" in response_data
        mock_service.create_practice_schedule_with_details.assert_called_once()

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_update_practice_schedule_success(
        self, mock_get_service, mock_get_current_user, sample_practice_schedule
    ):
        """Test successful PUT /practice-slots/{schedule_id}"""
        mock_get_current_user.return_value = {"id": "current-user-id"}
        mock_service = Mock()
        mock_service.update_practice_schedule = AsyncMock(return_value=sample_practice_schedule)
        mock_get_service.return_value = mock_service

        schedule_id = "test-schedule-id"
        update_data = {
            "description": "更新された練習セッション",
            "status": "updated"
        }

        response = self.client.put(
            f"/api/practice-slots/{schedule_id}",
            headers={"Authorization": "Bearer valid-token"},
            json=update_data
        )

        assert response.status_code == 200
        assert response.json() == sample_practice_schedule
        mock_service.update_practice_schedule.assert_called_once()

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_delete_practice_schedule_success(
        self, mock_get_service, mock_get_current_user
    ):
        """Test successful DELETE /practice-slots/{schedule_id}"""
        mock_get_current_user.return_value = {"id": "current-user-id"}
        mock_service = Mock()
        mock_service.remove_practice_schedule = AsyncMock(return_value=True)
        mock_get_service.return_value = mock_service

        schedule_id = "test-schedule-id"

        response = self.client.delete(
            f"/api/practice-slots/{schedule_id}",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == {"message": "練習スケジュールが正常に削除されました"}
        mock_service.remove_practice_schedule.assert_called_once_with(schedule_id)

    # ===== セッション関連テスト =====

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_get_sessions_by_schedule_success(
        self, mock_get_service, mock_get_current_user, sample_sessions
    ):
        """Test successful GET /practice-slots/{schedule_id}/sessions"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_sessions_by_schedule = AsyncMock(return_value=sample_sessions)
        mock_get_service.return_value = mock_service

        schedule_id = "test-schedule-id"
        response = self.client.get(
            f"/api/practice-slots/{schedule_id}/sessions",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == sample_sessions
        mock_service.get_sessions_by_schedule.assert_called_once_with(schedule_id)

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_create_session_success(
        self, mock_get_service, mock_get_current_user, sample_session
    ):
        """Test successful POST /practice-slots/sessions"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.create_session = AsyncMock(return_value=sample_session)
        mock_get_service.return_value = mock_service

        session_data = {
            "schedule_id": "schedule-1",
            "title": "新しいセッション",
            "start_time": "09:00:00",
            "end_time": "12:00:00",
            "priority": 1
        }

        response = self.client.post(
            "/api/practice-slots/sessions",
            headers={"Authorization": "Bearer valid-token"},
            json=session_data
        )

        assert response.status_code == 200
        assert response.json() == sample_session
        mock_service.create_session.assert_called_once()

    # ===== 認証テスト =====

    def test_endpoints_require_authentication(self):
        """Test that all endpoints require authentication"""
        endpoints = [
            ("/api/practice-slots/", "GET"),
            ("/api/practice-slots/test-id", "GET"),
            ("/api/practice-slots/test-id/details", "GET"),
            ("/api/practice-slots/", "POST"),
            ("/api/practice-slots/test-id", "PUT"),
            ("/api/practice-slots/test-id", "DELETE"),
            ("/api/practice-slots/test-id/sessions", "GET"),
            ("/api/practice-slots/sessions", "POST"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = self.client.get(endpoint)
            elif method == "POST":
                response = self.client.post(endpoint, json={})
            elif method == "PUT":
                response = self.client.put(endpoint, json={})
            elif method == "DELETE":
                response = self.client.delete(endpoint)

            # All endpoints should return 403 or 422 (validation error) without proper auth
            assert response.status_code in [403, 422], f"Endpoint {endpoint} should require auth"

    @patch('app.api.deps.get_current_user')
    def test_unauthorized_access(self, mock_get_current_user):
        """Test unauthorized access returns 401"""
        mock_get_current_user.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

        response = self.client.get("/api/practice-slots/")

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    # ===== バリデーションテスト =====

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_create_practice_schedule_invalid_data(
        self, mock_get_service, mock_get_current_user
    ):
        """Test POST /practice-slots/ with invalid data"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_get_service.return_value = mock_service

        # Invalid data (missing required fields)
        invalid_data = {
            "description": "説明のみ"  # schedule_date, start_time, end_time missing
        }

        response = self.client.post(
            "/api/practice-slots/",
            headers={"Authorization": "Bearer valid-token"},
            json=invalid_data
        )

        # Should return validation error
        assert response.status_code == 422
        mock_service.create_practice_schedule.assert_not_called()

    @patch('app.api.endpoints.practice_slots.get_current_user', new_callable=AsyncMock)
    @patch('app.api.deps.get_practice_schedule_service')
    def test_create_practice_schedule_service_error(
        self, mock_get_service, mock_get_current_user
    ):
        """Test POST /practice-slots/ when service throws an error"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.create_practice_schedule = AsyncMock(
            side_effect=Exception("Database error")
        )
        mock_get_service.return_value = mock_service

        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "新しい練習セッション"
        }

        response = self.client.post(
            "/api/practice-slots/",
            headers={"Authorization": "Bearer valid-token"},
            json=schedule_data
        )

        assert response.status_code == 500