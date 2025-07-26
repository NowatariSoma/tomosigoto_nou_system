"""
スケジュールサービスのテストケース
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import date, time, datetime
from uuid import uuid4, UUID
from typing import List, Dict, Any

from app.services.schedule_service import ScheduleService
from app.models.schedule import PracticeSchedule, Session
from app.schemas.schedule import ScheduleResponseSchema, PaginatedResponse
from app.core.pagination import PaginationParams, PaginatedResult


class TestScheduleService:
    """スケジュールサービスのテストクラス"""
    
    @pytest.fixture
    def mock_schedule_repository(self):
        """モックスケジュールリポジトリ"""
        mock_repo = Mock()
        # AsyncMockを設定
        mock_repo.get_schedule_by_id = AsyncMock()
        mock_repo.get_schedules_by_date_range = AsyncMock()
        mock_repo.get_schedules_by_part_id = AsyncMock()
        mock_repo.get_schedules_with_filters = AsyncMock()
        mock_repo.get_monthly_schedules = AsyncMock()
        mock_repo.get_weekly_schedules = AsyncMock()
        mock_repo.get_sessions_by_schedule_id = AsyncMock()
        mock_repo.count_schedules_by_filters = AsyncMock()
        return mock_repo
    
    @pytest.fixture
    def mock_venue_service(self):
        """モック会場サービス"""
        mock_service = Mock()
        mock_service.get_venue_by_id = AsyncMock()
        return mock_service
    
    @pytest.fixture
    def schedule_service(self, mock_schedule_repository, mock_venue_service):
        """スケジュールサービスインスタンス"""
        return ScheduleService(mock_schedule_repository, mock_venue_service)
    
    @pytest.fixture
    def sample_practice_schedule(self):
        """サンプル練習スケジュール"""
        return PracticeSchedule(
            id=uuid4(),
            venue_id=uuid4(),
            schedule_date=date(2025, 1, 15),
            start_time=time(9, 0),
            end_time=time(17, 0),
            title="定期練習",
            description="通常の練習セッション",
            schedule_type="regular",
            status="published",
            metadata={"location": "main_hall"},
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=uuid4()
        )
    
    @pytest.fixture
    def sample_session_list(self):
        """サンプルセッションリスト"""
        schedule_id = uuid4()
        return [
            Session(
                id=uuid4(),
                schedule_id=schedule_id,
                start_time=time(10, 0),
                end_time=time(12, 0),
                title="謡の練習",
                session_type="practice",
                priority=1,
                status="scheduled"
            ),
            Session(
                id=uuid4(),
                schedule_id=schedule_id,
                start_time=time(14, 0),
                end_time=time(16, 0),
                title="囃子の練習",
                session_type="practice",
                priority=2,
                status="scheduled"
            )
        ]

    async def test_get_schedule_details_success(
        self, 
        schedule_service, 
        mock_schedule_repository, 
        mock_venue_service,
        sample_practice_schedule,
        sample_session_list
    ):
        """スケジュール詳細取得 - 成功ケース"""
        # Arrange
        schedule_id = sample_practice_schedule.id
        mock_venue = {
            "id": str(sample_practice_schedule.venue_id),
            "name": "第一稽古場",
            "capacity": 50,
            "address": "東京都千代田区"
        }
        
        mock_schedule_repository.get_schedule_by_id.return_value = sample_practice_schedule
        mock_schedule_repository.get_sessions_by_schedule_id.return_value = sample_session_list
        mock_venue_service.get_venue_by_id.return_value = mock_venue
        
        # Act
        result = await schedule_service.get_schedule_details(schedule_id)
        
        # Assert
        assert result is not None
        assert result.id == schedule_id
        assert result.title == sample_practice_schedule.title
        assert result.sessions_count == len(sample_session_list)
        assert result.duration_minutes == 480  # 9:00-17:00 = 8時間
        mock_schedule_repository.get_schedule_by_id.assert_called_once_with(schedule_id)
        mock_schedule_repository.get_sessions_by_schedule_id.assert_called_once_with(schedule_id)
    
    async def test_get_schedule_details_not_found(
        self, 
        schedule_service, 
        mock_schedule_repository
    ):
        """スケジュール詳細取得 - 存在しないケース"""
        # Arrange
        schedule_id = uuid4()
        mock_schedule_repository.get_schedule_by_id.return_value = None
        
        # Act
        result = await schedule_service.get_schedule_details(schedule_id)
        
        # Assert
        assert result is None
        mock_schedule_repository.get_schedule_by_id.assert_called_once_with(schedule_id)
    
    async def test_get_schedules_by_date_range(
        self, 
        schedule_service, 
        mock_schedule_repository,
        sample_practice_schedule
    ):
        """日付範囲指定でスケジュール取得"""
        # Arrange
        start_date = date(2025, 1, 10)
        end_date = date(2025, 1, 20)
        pagination = PaginationParams(page=1, limit=20)
        
        mock_schedule_repository.get_schedules_by_date_range.return_value = (
            [sample_practice_schedule], 1
        )
        
        # Act
        result = await schedule_service.get_schedules_by_date_range(
            start_date, end_date, pagination=pagination
        )
        
        # Assert
        assert isinstance(result, PaginatedResult)
        assert len(result.items) == 1
        assert result.total == 1
        assert result.page == 1
        assert result.limit == 20
        mock_schedule_repository.get_schedules_by_date_range.assert_called_once_with(
            start_date, end_date, part_id=None, pagination=pagination
        )
    
    async def test_get_schedules_by_part_id(
        self, 
        schedule_service, 
        mock_schedule_repository,
        sample_practice_schedule
    ):
        """パートID指定でスケジュール取得"""
        # Arrange
        part_id = uuid4()
        pagination = PaginationParams(page=1, limit=20)
        
        mock_schedule_repository.get_schedules_by_part_id.return_value = (
            [sample_practice_schedule], 1
        )
        
        # Act
        result = await schedule_service.get_schedules_by_part_id(
            part_id, pagination=pagination
        )
        
        # Assert
        assert isinstance(result, PaginatedResult)
        assert len(result.items) == 1
        assert result.total == 1
        mock_schedule_repository.get_schedules_by_part_id.assert_called_once_with(
            part_id, start_date=None, end_date=None, pagination=pagination
        )
    
    async def test_get_schedules_with_complex_filters(
        self, 
        schedule_service, 
        mock_schedule_repository,
        sample_practice_schedule
    ):
        """複合フィルター条件でスケジュール取得"""
        # Arrange
        filters = {
            "start_date": date(2025, 1, 10),
            "end_date": date(2025, 1, 20),
            "part_id": uuid4(),
            "venue_id": uuid4(),
            "schedule_type": "regular",
            "status": "published"
        }
        pagination = PaginationParams(page=1, limit=20)
        
        mock_schedule_repository.get_schedules_with_filters.return_value = (
            [sample_practice_schedule], 1
        )
        
        # Act
        result = await schedule_service.get_schedules_with_filters(
            filters, pagination=pagination
        )
        
        # Assert
        assert isinstance(result, PaginatedResult)
        assert len(result.items) == 1
        assert result.total == 1
        mock_schedule_repository.get_schedules_with_filters.assert_called_once_with(
            filters, pagination=pagination
        )
    
    async def test_get_monthly_schedules(
        self, 
        schedule_service, 
        mock_schedule_repository,
        sample_practice_schedule
    ):
        """月別スケジュール取得"""
        # Arrange
        year = 2025
        month = 1
        part_id = uuid4()
        
        mock_schedule_repository.get_monthly_schedules.return_value = [sample_practice_schedule]
        
        # Act
        result = await schedule_service.get_monthly_schedules(year, month, part_id)
        
        # Assert
        assert result.year == year
        assert result.month == month
        assert len(result.calendar_data) > 0
        assert result.total_schedules == 1
        mock_schedule_repository.get_monthly_schedules.assert_called_once_with(
            year, month, part_id
        )
    
    async def test_get_weekly_schedules(
        self, 
        schedule_service, 
        mock_schedule_repository,
        sample_practice_schedule
    ):
        """週別スケジュール取得"""
        # Arrange
        year = 2025
        week_number = 3
        part_id = uuid4()
        
        mock_schedule_repository.get_weekly_schedules.return_value = [sample_practice_schedule]
        
        # Act
        result = await schedule_service.get_weekly_schedules(year, week_number, part_id)
        
        # Assert
        assert result.year == year
        assert result.week_number == week_number
        assert len(result.calendar_data) > 0
        assert result.total_schedules == 1
        mock_schedule_repository.get_weekly_schedules.assert_called_once_with(
            year, week_number, part_id
        )
    
    async def test_optimize_for_calendar_display(
        self, 
        schedule_service,
        sample_practice_schedule
    ):
        """カレンダー表示用データ最適化"""
        # Arrange
        schedules = [sample_practice_schedule]
        year = 2025
        month = 1
        
        # Act
        result = schedule_service._optimize_for_calendar(schedules, year, month)
        
        # Assert
        assert len(result) > 0
        calendar_data = result[0]
        assert calendar_data.date == sample_practice_schedule.schedule_date
        assert len(calendar_data.schedules) == 1
        assert calendar_data.total_schedules == 1
        assert calendar_data.has_conflicts == False  # 1つだけなので競合なし
    
    async def test_detect_time_conflicts(
        self, 
        schedule_service
    ):
        """時間重複検出テスト"""
        # Arrange
        schedule1 = PracticeSchedule(
            id=uuid4(),
            venue_id=uuid4(),
            schedule_date=date(2025, 1, 15),
            start_time=time(9, 0),
            end_time=time(12, 0),
            title="午前練習",
            created_by=uuid4()
        )
        schedule2 = PracticeSchedule(
            id=uuid4(),
            venue_id=uuid4(),
            schedule_date=date(2025, 1, 15),
            start_time=time(11, 0),  # 重複
            end_time=time(14, 0),
            title="午後練習",
            created_by=uuid4()
        )
        schedules = [schedule1, schedule2]
        
        # Act
        result = schedule_service._optimize_for_calendar(schedules, 2025, 1)
        
        # Assert
        calendar_data = next(cd for cd in result if cd.date == date(2025, 1, 15))
        assert calendar_data.has_conflicts == True
        assert calendar_data.total_schedules == 2
    
    async def test_format_response_data(
        self, 
        schedule_service,
        mock_venue_service,
        sample_practice_schedule,
        sample_session_list
    ):
        """レスポンスデータフォーマット"""
        # Arrange
        mock_venue = {
            "id": str(sample_practice_schedule.venue_id),
            "name": "第一稽古場",
            "capacity": 50,
            "address": "東京都千代田区"
        }
        mock_venue_service.get_venue_by_id.return_value = mock_venue
        
        schedules = [sample_practice_schedule]
        sessions_map = {sample_practice_schedule.id: sample_session_list}
        
        # Act
        result = await schedule_service._format_response_data(schedules, sessions_map)
        
        # Assert
        assert len(result) == 1
        response_schedule = result[0]
        assert response_schedule.id == sample_practice_schedule.id
        assert response_schedule.venue.name == "第一稽古場"
        assert response_schedule.sessions_count == len(sample_session_list)
        assert response_schedule.duration_minutes == sample_practice_schedule.duration_minutes()
    
    async def test_service_error_handling(
        self, 
        schedule_service, 
        mock_schedule_repository
    ):
        """サービスエラーハンドリングテスト"""
        # Arrange
        schedule_id = uuid4()
        mock_schedule_repository.get_schedule_by_id.side_effect = Exception("Repository error")
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await schedule_service.get_schedule_details(schedule_id)
        
        assert "Repository error" in str(exc_info.value)