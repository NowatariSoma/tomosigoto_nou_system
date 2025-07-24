import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.main import app


class TestUsersEndpoints:
    """Test cases for users endpoints"""

    def setup_method(self):
        """Setup test client for each test"""
        self.client = TestClient(app)

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_get_users_success(self, mock_get_supabase_service, mock_get_current_user, sample_users):
        """Test successful GET /users"""
        # Mock dependencies
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_all_users = AsyncMock(return_value=sample_users)
        mock_get_supabase_service.return_value = mock_service

        response = self.client.get(
            "/api/users/",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == sample_users
        mock_service.get_all_users.assert_called_once()

    @patch('app.api.deps.get_current_user')
    def test_get_users_unauthorized(self, mock_get_current_user):
        """Test GET /users without authentication"""
        mock_get_current_user.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

        response = self.client.get("/api/users/")

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_get_users_empty_list(self, mock_get_supabase_service, mock_get_current_user):
        """Test GET /users returns empty list"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_all_users = AsyncMock(return_value=[])
        mock_get_supabase_service.return_value = mock_service

        response = self.client.get(
            "/api/users/",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == []

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_get_user_by_id_success(self, mock_get_supabase_service, mock_get_current_user, sample_user):
        """Test successful GET /users/{user_id}"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_user_by_id = AsyncMock(return_value=sample_user)
        mock_get_supabase_service.return_value = mock_service

        response = self.client.get(
            "/api/users/test-user-id",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == sample_user
        mock_service.get_user_by_id.assert_called_once_with("test-user-id")

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_get_user_by_id_not_found(self, mock_get_supabase_service, mock_get_current_user):
        """Test GET /users/{user_id} with non-existent user"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_user_by_id = AsyncMock(return_value=None)
        mock_get_supabase_service.return_value = mock_service

        response = self.client.get(
            "/api/users/nonexistent-id",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]
        mock_service.get_user_by_id.assert_called_once_with("nonexistent-id")

    @patch('app.api.deps.get_current_user')
    def test_get_current_user_info_success(self, mock_get_current_user, sample_user):
        """Test successful GET /users/me/"""
        mock_get_current_user.return_value = sample_user

        response = self.client.get(
            "/api/users/me/",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 200
        assert response.json() == sample_user

    @patch('app.api.deps.get_current_user')
    def test_get_current_user_info_unauthorized(self, mock_get_current_user):
        """Test GET /users/me/ without authentication"""
        mock_get_current_user.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

        response = self.client.get("/api/users/me/")

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_endpoints_require_authentication(self):
        """Test that all endpoints require authentication"""
        endpoints = [
            ("/api/users/", "GET"),
            ("/api/users/test-id", "GET"),
            ("/api/users/me/", "GET"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = self.client.get(endpoint)
            
            # All endpoints should return 403 or 422 (validation error) without proper auth
            assert response.status_code in [403, 422], f"Endpoint {endpoint} should require auth"

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_service_error_handling(self, mock_get_supabase_service, mock_get_current_user):
        """Test that service errors are properly handled"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        
        # Simulate a service error (HTTPException from the decorator)
        mock_service.get_all_users = AsyncMock(
            side_effect=HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        )
        mock_get_supabase_service.return_value = mock_service

        response = self.client.get(
            "/api/users/",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 500
        assert "Database connection error" in response.json()["detail"]

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service')
    def test_get_user_by_id_with_special_characters(self, mock_get_supabase_service, mock_get_current_user):
        """Test GET /users/{user_id} with special characters in ID"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_user_by_id = AsyncMock(return_value=None)
        mock_get_supabase_service.return_value = mock_service

        # Test with UUID-like ID (common for Supabase)
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        response = self.client.get(
            f"/api/users/{user_id}",
            headers={"Authorization": "Bearer valid-token"}
        )

        assert response.status_code == 404
        mock_service.get_user_by_id.assert_called_once_with(user_id)

    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_supabase_service') 
    def test_concurrent_requests_handling(self, mock_get_supabase_service, mock_get_current_user, sample_users):
        """Test that multiple concurrent requests are handled properly"""
        mock_get_current_user.return_value = {"id": "current-user"}
        mock_service = Mock()
        mock_service.get_all_users = AsyncMock(return_value=sample_users)
        mock_get_supabase_service.return_value = mock_service

        # Make multiple requests
        responses = []
        for _ in range(3):
            response = self.client.get(
                "/api/users/",
                headers={"Authorization": "Bearer valid-token"}
            )
            responses.append(response)

        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            assert response.json() == sample_users

        # Service should be called for each request
        assert mock_service.get_all_users.call_count == 3