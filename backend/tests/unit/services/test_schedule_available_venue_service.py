"""
ScheduleAvailableVenueService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.schedule_available_venue_service import ScheduleAvailableVenueService
from app.core.exceptions import APIException
from fastapi import HTTPException
from tests.helpers.factories import make_schedule_available_venue


class TestScheduleAvailableVenueService:
    """ScheduleAvailableVenueService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.service = ScheduleAvailableVenueService(
            schedule_available_venue_repository=self.mock_repo,
        )

    # ===== get_all_schedule_available_venues =====

    def test_get_all_schedule_available_venues(self):
        """利用可能会場一覧取得"""
        venues = [make_schedule_available_venue()]
        self.mock_repo.find_all_with_details.return_value = venues

        result = self.service.get_all_schedule_available_venues()

        assert result == venues

    def test_get_all_with_schedule_filter(self):
        """スケジュール指定で利用可能会場取得"""
        schedule_id = uuid4()
        self.mock_repo.find_all_with_details.return_value = []

        result = self.service.get_all_schedule_available_venues(
            schedule_id=schedule_id
        )

        self.mock_repo.find_all_with_details.assert_called_once_with(
            limit=1000, offset=0, schedule_id=schedule_id, venue_id=None
        )

    # ===== get_schedule_available_venue =====

    def test_get_schedule_available_venue_success(self):
        """ID指定で取得 - 正常"""
        venue_id = uuid4()
        venue = make_schedule_available_venue(id=str(venue_id))
        self.mock_repo.find_by_id.return_value = venue

        result = self.service.get_schedule_available_venue(venue_id)

        assert result == venue

    def test_get_schedule_available_venue_not_found(self):
        """ID指定で取得 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_schedule_available_venue(uuid4())

    # ===== create_schedule_available_venue =====

    def test_create_schedule_available_venue_success(self):
        """利用可能会場作成 - 正常"""
        schedule_id = uuid4()
        venue_id = uuid4()
        data = {"schedule_id": schedule_id, "venue_id": venue_id}
        created = make_schedule_available_venue()

        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.find_venue_by_id.return_value = {"id": str(venue_id)}
        self.mock_repo.find_by_schedule_and_venue.return_value = None
        self.mock_repo.create.return_value = created

        result = self.service.create_schedule_available_venue(data)

        assert result == created

    def test_create_schedule_available_venue_duplicate(self):
        """利用可能会場作成 - 重複"""
        schedule_id = uuid4()
        venue_id = uuid4()
        data = {"schedule_id": schedule_id, "venue_id": venue_id}

        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.find_venue_by_id.return_value = {"id": str(venue_id)}
        self.mock_repo.find_by_schedule_and_venue.return_value = {"id": "existing"}

        with pytest.raises(HTTPException) as exc_info:
            self.service.create_schedule_available_venue(data)

        assert exc_info.value.status_code == 409

    # ===== delete_schedule_available_venue =====

    def test_delete_schedule_available_venue_success(self):
        """利用可能会場削除 - 正常"""
        venue_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_schedule_available_venue(
            id=str(venue_id)
        )
        self.mock_repo.delete.return_value = True

        result = self.service.delete_schedule_available_venue(venue_id)

        assert result is True

    def test_delete_schedule_available_venue_not_found(self):
        """利用可能会場削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.delete_schedule_available_venue(uuid4())

    # ===== update_schedule_available_venue =====

    def test_update_schedule_available_venue_success(self):
        """利用可能会場更新 - 正常"""
        venue_id = uuid4()
        existing = make_schedule_available_venue(id=str(venue_id))
        update_data = {"is_preferred": True}
        updated = make_schedule_available_venue(id=str(venue_id), is_preferred=True)

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.update.return_value = updated

        result = self.service.update_schedule_available_venue(
            venue_id, update_data
        )

        assert result == updated

    def test_update_schedule_available_venue_not_found(self):
        """利用可能会場更新 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.update_schedule_available_venue(
                uuid4(), {"is_preferred": True}
            )

    # ===== delete_by_schedule / delete_by_venue =====

    def test_delete_by_schedule(self):
        """スケジュール指定で一括削除"""
        self.mock_repo.delete_by_schedule.return_value = 2

        result = self.service.delete_schedule_available_venues_by_schedule(
            uuid4()
        )

        assert result == 2

    def test_delete_by_venue(self):
        """会場指定で一括削除"""
        self.mock_repo.delete_by_venue.return_value = 3

        result = self.service.delete_schedule_available_venues_by_venue(uuid4())

        assert result == 3
