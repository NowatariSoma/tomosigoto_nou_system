"""
スケジュールリポジトリのテストケース
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import date, time, datetime
from uuid import uuid4, UUID
from typing import List, Dict, Any

from app.repositories.schedule_repository import ScheduleRepository
from app.models.schedule import PracticeSchedule, Session
from app.core.pagination import PaginationParams


class TestScheduleRepository:
    """スケジュールリポジトリのテストクラス"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """モックSupabaseクライアント"""
        mock_client = Mock()
        mock_client.table = Mock()
        return mock_client
    
    @pytest.fixture
    def schedule_repository(self, mock_supabase_client):
        """スケジュールリポジトリインスタンス"""
        return ScheduleRepository(mock_supabase_client)
    
    @pytest.fixture
    def sample_schedule_data(self):
        """サンプルスケジュールデータ"""
        return {
            "id": str(uuid4()),
            "venue_id": str(uuid4()),
            "schedule_date": "2025-01-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "title": "定期練習",
            "description": "通常の練習セッション",
            "schedule_type": "regular",
            "status": "published",
            "metadata": {"location": "main_hall"},
            "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:00+00:00",
            "created_by": str(uuid4())
        }
    
    @pytest.fixture
    def sample_session_data(self):
        """サンプルセッションデータ"""
        return {
            "id": str(uuid4()),
            "schedule_id": str(uuid4()),
            "start_time": "10:00:00",
            "end_time": "12:00:00",
            "title": "謡の練習",
            "description": "基本の謡の練習",
            "session_type": "practice",
            "priority": 1,
            "resources": {"instruments": ["taiko"]},
            "location_in_venue": "練習室A",
            "status": "scheduled",
            "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:00+00:00"
        }

    async def test_get_schedule_by_id_success(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """スケジュールID指定取得 - 成功ケース"""
        # Arrange
        schedule_id = UUID(sample_schedule_data["id"])
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # Act
        result = await schedule_repository.get_schedule_by_id(schedule_id)
        
        # Assert
        assert result is not None
        assert result.id == schedule_id
        assert result.title == sample_schedule_data["title"]
        assert result.status == sample_schedule_data["status"]
        mock_supabase_client.table.assert_called_with("practice_schedules")
    
    async def test_get_schedule_by_id_not_found(self, schedule_repository, mock_supabase_client):
        """スケジュールID指定取得 - 存在しないケース"""
        # Arrange
        schedule_id = uuid4()
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # Act
        result = await schedule_repository.get_schedule_by_id(schedule_id)
        
        # Assert
        assert result is None
    
    async def test_get_schedules_by_date_range(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """日付範囲指定でスケジュール取得"""
        # Arrange
        start_date = date(2025, 1, 10)
        end_date = date(2025, 1, 20)
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        mock_response.count = 1
        
        # Mock the chained calls
        mock_table = Mock()
        mock_select = Mock()
        mock_gte = Mock()
        mock_lte = Mock()
        mock_order = Mock()
        mock_range = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.gte.return_value = mock_gte
        mock_gte.lte.return_value = mock_lte
        mock_lte.order.return_value = mock_order
        mock_order.range.return_value = mock_range
        mock_range.execute.return_value = mock_response
        
        pagination = PaginationParams(page=1, limit=20)
        
        # Act
        schedules, total = await schedule_repository.get_schedules_by_date_range(
            start_date, end_date, pagination=pagination
        )
        
        # Assert
        assert len(schedules) == 1
        assert total == 1
        assert schedules[0].title == sample_schedule_data["title"]
        mock_supabase_client.table.assert_called_with("practice_schedules")
    
    async def test_get_schedules_by_part_id(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """パートID指定でスケジュール取得"""
        # Arrange
        part_id = uuid4()
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        mock_response.count = 1
        
        # Mock the complex join query
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        mock_order = Mock()
        mock_range = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.order.return_value = mock_order
        mock_order.range.return_value = mock_range
        mock_range.execute.return_value = mock_response
        
        pagination = PaginationParams(page=1, limit=20)
        
        # Act
        schedules, total = await schedule_repository.get_schedules_by_part_id(
            part_id, pagination=pagination
        )
        
        # Assert
        assert len(schedules) == 1
        assert total == 1
        assert schedules[0].title == sample_schedule_data["title"]
    
    async def test_get_schedules_with_filters(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """複合フィルター条件でスケジュール取得"""
        # Arrange
        filters = {
            "start_date": date(2025, 1, 10),
            "end_date": date(2025, 1, 20),
            "venue_id": uuid4(),
            "schedule_type": "regular",
            "status": "published"
        }
        
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        mock_response.count = 1
        
        # Mock the chained calls for complex filters
        mock_table = Mock()
        mock_select = Mock()
        mock_filter_chain = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        
        # Chain multiple filter calls
        current_mock = mock_select
        for _ in filters:
            next_mock = Mock()
            current_mock.gte = Mock(return_value=next_mock)
            current_mock.lte = Mock(return_value=next_mock)
            current_mock.eq = Mock(return_value=next_mock)
            current_mock = next_mock
        
        current_mock.order = Mock(return_value=current_mock)
        current_mock.range = Mock(return_value=current_mock)
        current_mock.execute = Mock(return_value=mock_response)
        
        pagination = PaginationParams(page=1, limit=20)
        
        # Act
        schedules, total = await schedule_repository.get_schedules_with_filters(
            filters, pagination=pagination
        )
        
        # Assert
        assert len(schedules) == 1
        assert total == 1
        assert schedules[0].title == sample_schedule_data["title"]
    
    async def test_get_monthly_schedules(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """月別スケジュール取得"""
        # Arrange
        year = 2025
        month = 1
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        
        mock_table = Mock()
        mock_select = Mock()
        mock_gte = Mock()
        mock_lt = Mock()
        mock_order = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.gte.return_value = mock_gte
        mock_gte.lt.return_value = mock_lt
        mock_lt.order.return_value = mock_order
        mock_order.execute.return_value = mock_response
        
        # Act
        schedules = await schedule_repository.get_monthly_schedules(year, month)
        
        # Assert
        assert len(schedules) == 1
        assert schedules[0].title == sample_schedule_data["title"]
    
    async def test_get_weekly_schedules(self, schedule_repository, mock_supabase_client, sample_schedule_data):
        """週別スケジュール取得"""
        # Arrange
        year = 2025
        week_number = 3
        mock_response = Mock()
        mock_response.data = [sample_schedule_data]
        
        mock_table = Mock()
        mock_select = Mock()
        mock_gte = Mock()
        mock_lte = Mock()
        mock_order = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.gte.return_value = mock_gte
        mock_gte.lte.return_value = mock_lte
        mock_lte.order.return_value = mock_order
        mock_order.execute.return_value = mock_response
        
        # Act
        schedules = await schedule_repository.get_weekly_schedules(year, week_number)
        
        # Assert
        assert len(schedules) == 1
        assert schedules[0].title == sample_schedule_data["title"]
    
    async def test_get_sessions_by_schedule_id(self, schedule_repository, mock_supabase_client, sample_session_data):
        """スケジュール別セッション取得"""
        # Arrange
        schedule_id = uuid4()
        mock_response = Mock()
        mock_response.data = [sample_session_data]
        
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        mock_order = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.order.return_value = mock_order
        mock_order.execute.return_value = mock_response
        
        # Act
        sessions = await schedule_repository.get_sessions_by_schedule_id(schedule_id)
        
        # Assert
        assert len(sessions) == 1
        assert sessions[0].title == sample_session_data["title"]
        mock_supabase_client.table.assert_called_with("sessions")
    
    async def test_count_schedules_by_filters(self, schedule_repository, mock_supabase_client):
        """フィルター条件でのスケジュール件数取得"""
        # Arrange
        filters = {"status": "published"}
        mock_response = Mock()
        mock_response.count = 42
        
        mock_table = Mock()
        mock_select = Mock()
        mock_eq = Mock()
        
        mock_supabase_client.table.return_value = mock_table
        mock_table.select.return_value = mock_select
        mock_select.eq.return_value = mock_eq
        mock_eq.execute.return_value = mock_response
        
        # Act
        count = await schedule_repository.count_schedules_by_filters(filters)
        
        # Assert
        assert count == 42
    
    async def test_repository_error_handling(self, schedule_repository, mock_supabase_client):
        """リポジトリエラーハンドリングテスト"""
        # Arrange
        schedule_id = uuid4()
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.side_effect = Exception("Database error")
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await schedule_repository.get_schedule_by_id(schedule_id)
        
        assert "Database error" in str(exc_info.value)