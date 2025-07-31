"""
スケジュールAPIエンドポイントのテストケース
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
from datetime import date, time, datetime
from uuid import uuid4, UUID
from typing import List, Dict, Any

from app.main import app
from app.schemas.schedule import ScheduleResponseSchema, PaginatedResponse
from app.core.pagination import PaginatedResult


class TestScheduleEndpoints:
    """スケジュールAPIエンドポイントのテストクラス"""
    
    @pytest.fixture
    def client(self):
        """FastAPIテストクライアント"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_current_user(self):
        """モック認証ユーザー"""
        return {
            "user_id": str(uuid4()),
            "email": "test@example.com",
            "name": "Test User"
        }
    
    @pytest.fixture
    def sample_schedule_response(self):
        """サンプルスケジュールレスポンス"""
        return {
            "id": str(uuid4()),
            "venue": {
                "id": str(uuid4()),
                "name": "第一稽古場",
                "capacity": 50,
                "address": "東京都千代田区"
            },
            "schedule_date": "2025-01-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "title": "定期練習",
            "description": "通常の練習セッション",
            "schedule_type": "regular",
            "status": "published",
            "metadata": {"location": "main_hall"},
            "created_at": "2025-01-01T00:00:00+00:00",
            "created_by": str(uuid4()),
            "duration_minutes": 480,
            "sessions_count": 2,
            "sessions": []
        }
    
    @pytest.fixture
    def sample_paginated_response(self, sample_schedule_response):
        """サンプルページネーションレスポンス"""
        return {
            "items": [sample_schedule_response],
            "total": 1,
            "page": 1,
            "limit": 20,
            "pages": 1,
            "has_next": False,
            "has_previous": False
        }

    def test_get_schedules_by_date_range(
        self,
        client, 
        mock_current_user,
        sample_schedule_response,
        sample_paginated_response
    ):
        """日付範囲指定でスケジュール取得エンドポイントテスト"""
        from app.main import app
        from app.api.deps import get_current_user, get_supabase_service
        from app.services.schedule_service import ScheduleService
        
        # Arrange - Mock dependencies
        def mock_get_current_user_dep():
            return mock_current_user
            
        def mock_get_supabase_service_dep():
            mock_supabase = Mock()
            mock_supabase.client = Mock()
            return mock_supabase
            
        def mock_get_schedule_service_dep():
            mock_service = Mock(spec=ScheduleService)
            mock_service.get_schedules_by_date_range = AsyncMock(
                return_value=PaginatedResult.create(
                    items=[sample_schedule_response],
                    total=1,
                    page=1,
                    limit=20
                )
            )
            return mock_service
        
        # Import the actual dependency function to override
        from app.api.v1.endpoints.schedules import get_schedule_service
        
        # Override dependencies
        app.dependency_overrides[get_current_user] = mock_get_current_user_dep
        app.dependency_overrides[get_supabase_service] = mock_get_supabase_service_dep
        app.dependency_overrides[get_schedule_service] = mock_get_schedule_service_dep
        
        # Act
        response = client.get(
            "/api/schedules/?start_date=2025-01-10&end_date=2025-01-20&page=1&limit=20"
        )
        
        # Clean up
        app.dependency_overrides.clear()
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == sample_schedule_response["title"]
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_schedules_by_part_id(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user,
        sample_schedule_response,
        sample_paginated_response
    ):
        """パートID指定でスケジュール取得エンドポイントテスト"""
        # Arrange
        part_id = str(uuid4())
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_service_instance.get_schedules_by_part_id = AsyncMock(
            return_value=PaginatedResult.create(
                items=[sample_schedule_response],
                total=1,
                page=1,
                limit=20
            )
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get(f"/api/schedules/?part_id={part_id}&page=1&limit=20")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_schedule_by_id(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user,
        sample_schedule_response
    ):
        """スケジュールID指定取得エンドポイントテスト"""
        # Arrange
        schedule_id = sample_schedule_response["id"]
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_service_instance.get_schedule_details = AsyncMock(
            return_value=sample_schedule_response
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get(f"/api/schedules/{schedule_id}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == schedule_id
        assert data["title"] == sample_schedule_response["title"]
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_schedule_by_id_not_found(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """存在しないスケジュールID指定取得エンドポイントテスト"""
        # Arrange
        schedule_id = str(uuid4())
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_service_instance.get_schedule_details = AsyncMock(return_value=None)
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get(f"/api/schedules/{schedule_id}")
        
        # Assert
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_monthly_schedules(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """月別スケジュール取得エンドポイントテスト"""
        # Arrange
        year = 2025
        month = 1
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_monthly_response = {
            "year": year,
            "month": month,
            "calendar_data": [],
            "total_schedules": 5,
            "schedule_types": {"regular": 3, "special": 2}
        }
        mock_service_instance.get_monthly_schedules = AsyncMock(
            return_value=mock_monthly_response
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get(f"/api/schedules/month/{year}/{month}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == year
        assert data["month"] == month
        assert data["total_schedules"] == 5
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_weekly_schedules(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """週別スケジュール取得エンドポイントテスト"""
        # Arrange
        year = 2025
        week_number = 3
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_weekly_response = {
            "year": year,
            "week_number": week_number,
            "start_date": "2025-01-13",
            "end_date": "2025-01-19",
            "calendar_data": [],
            "total_schedules": 3
        }
        mock_service_instance.get_weekly_schedules = AsyncMock(
            return_value=mock_weekly_response
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get(f"/api/schedules/week/{year}/{week_number}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == year
        assert data["week_number"] == week_number
        assert data["total_schedules"] == 3
    
    @patch('app.api.deps.get_current_user')
    def test_get_schedules_invalid_date_format(
        self, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """不正な日付フォーマットでのリクエストテスト"""
        # Arrange
        mock_get_current_user.return_value = mock_current_user
        
        # Act
        response = client.get("/api/schedules/?start_date=invalid-date")
        
        # Assert
        assert response.status_code == 422  # Validation Error
        data = response.json()
        assert "detail" in data
    
    @patch('app.api.deps.get_current_user')
    def test_get_schedules_invalid_pagination_params(
        self, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """不正なページネーションパラメータでのリクエストテスト"""
        # Arrange
        mock_get_current_user.return_value = mock_current_user
        
        # Act
        response = client.get("/api/schedules/?page=0&limit=200")
        
        # Assert
        assert response.status_code == 422  # Validation Error
        data = response.json()
        assert "detail" in data
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_get_schedules_with_all_filters(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user,
        sample_schedule_response
    ):
        """全フィルターパラメータを使用したスケジュール取得テスト"""
        # Arrange
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_service_instance.get_schedules_with_filters = AsyncMock(
            return_value=PaginatedResult.create(
                items=[sample_schedule_response],
                total=1,
                page=1,
                limit=20
            )
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Query parameters
        params = {
            "start_date": "2025-01-10",
            "end_date": "2025-01-20",
            "part_id": str(uuid4()),
            "venue_id": str(uuid4()),
            "schedule_type": "regular",
            "status": "published",
            "page": "1",
            "limit": "20",
            "sort_by": "schedule_date",
            "sort_order": "asc"
        }
        
        # Act
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        response = client.get(f"/api/schedules/?{query_string}")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
    
    def test_unauthorized_access(self, client):
        """認証なしでのアクセステスト"""
        # Act
        response = client.get("/api/schedules/")
        
        # Assert
        assert response.status_code == 401  # Unauthorized
    
    @patch('app.api.deps.get_current_user')
    @patch('app.services.schedule_service.ScheduleService')
    def test_service_error_handling(
        self, 
        mock_schedule_service, 
        mock_get_current_user,
        client, 
        mock_current_user
    ):
        """サービスエラー発生時のハンドリングテスト"""
        # Arrange
        mock_get_current_user.return_value = mock_current_user
        mock_service_instance = Mock()
        mock_service_instance.get_schedules_by_date_range = AsyncMock(
            side_effect=Exception("Service error")
        )
        mock_schedule_service.return_value = mock_service_instance
        
        # Act
        response = client.get("/api/schedules/?start_date=2025-01-10&end_date=2025-01-20")
        
        # Assert
        assert response.status_code == 500  # Internal Server Error
        data = response.json()
        assert "detail" in data