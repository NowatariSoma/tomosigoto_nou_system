"""
PracticeScheduleService のユニットテスト

NOTE: 1842行の大規模サービスなので、主要なCRUDメソッド
(get_all, get_by_id, create, update, delete) に集中してテストする。
"""
import pytest
from unittest.mock import Mock
from uuid import UUID, uuid4

from app.services.practice_schedule_service import PracticeScheduleService
from app.core.exceptions import APIException
from tests.helpers.factories import (
    make_practice_schedule,
    make_venue,
    make_schedule_available_venue,
)


class TestPracticeScheduleService:
    """PracticeScheduleService のテスト"""

    def setup_method(self):
        self.mock_schedule_repo = Mock()
        self.mock_venue_repo = Mock()
        self.mock_session_repo = Mock()
        self.mock_instructor_repo = Mock()
        self.mock_venue_assignment_repo = Mock()
        self.mock_member_assignment_repo = Mock()
        self.mock_attendance_repo = Mock()
        self.mock_profile_repo = Mock()
        self.mock_time_slot_repo = Mock()

        self.service = PracticeScheduleService(
            practice_schedule_repository=self.mock_schedule_repo,
            schedule_available_venue_repository=self.mock_venue_assignment_repo,
            session_repository=self.mock_session_repo,
            session_instructor_repository=self.mock_instructor_repo,
            venue_repository=self.mock_venue_repo,
            member_assignment_repository=self.mock_member_assignment_repo,
            attendance_repository=self.mock_attendance_repo,
            user_profile_repository=self.mock_profile_repo,
            schedule_time_slot_repository=self.mock_time_slot_repo,
        )

    # ===== get_all_practice_schedules =====

    def test_get_all_practice_schedules_success(self):
        """全練習スケジュール取得 - 正常"""
        venue_id = str(uuid4())
        schedule_data = make_practice_schedule()
        schedule_data["schedule_available_venues"] = [
            {
                "venue_id": venue_id,
                "venues": {"name": "テスト会場", "campus": "メインキャンパス"},
            }
        ]
        self.mock_schedule_repo.find_all_with_relations.return_value = [schedule_data]

        result = self.service.get_all_practice_schedules()

        assert len(result) == 1
        assert result[0]["venue_ids"] == [venue_id]
        assert result[0]["venues"][0]["name"] == "テスト会場"

    def test_get_all_practice_schedules_empty(self):
        """全練習スケジュール取得 - 空"""
        self.mock_schedule_repo.find_all_with_relations.return_value = []

        result = self.service.get_all_practice_schedules()

        assert result == []

    def test_get_all_practice_schedules_no_venues(self):
        """全練習スケジュール取得 - 会場情報なし"""
        schedule_data = make_practice_schedule()
        schedule_data["schedule_available_venues"] = []
        self.mock_schedule_repo.find_all_with_relations.return_value = [schedule_data]
        self.mock_venue_assignment_repo.find_by_schedule.return_value = []

        result = self.service.get_all_practice_schedules()

        assert len(result) == 1
        assert result[0]["venue_ids"] == []
        assert result[0]["venues"] == []

    def test_get_all_practice_schedules_fallback_venue_fetch(self):
        """全練習スケジュール取得 - リレーションクエリ失敗のフォールバック"""
        schedule_id = str(uuid4())
        venue_id = str(uuid4())
        schedule_data = make_practice_schedule(id=schedule_id)
        schedule_data["schedule_available_venues"] = None

        # フォールバックで取得
        self.mock_venue_assignment_repo.find_by_schedule.return_value = [
            {
                "venue_id": venue_id,
                "name": "フォールバック会場",
                "campus": "サブキャンパス",
            }
        ]
        self.mock_schedule_repo.find_all_with_relations.return_value = [schedule_data]

        result = self.service.get_all_practice_schedules()

        assert len(result) == 1
        assert result[0]["venue_ids"] == [venue_id]
        assert result[0]["venues"][0]["name"] == "フォールバック会場"

    # ===== get_practice_schedule =====

    def test_get_practice_schedule_success(self):
        """ID指定で練習スケジュール取得 - 正常"""
        schedule_id = uuid4()
        venue_id = str(uuid4())
        schedule = make_practice_schedule(id=str(schedule_id))

        self.mock_schedule_repo.find_by_id.return_value = schedule
        self.mock_venue_assignment_repo.find_by_schedule.return_value = [
            {
                "venue_id": venue_id,
                "name": "テスト会場",
                "campus": "メインキャンパス",
            }
        ]

        result = self.service.get_practice_schedule(schedule_id)

        assert result["id"] == str(schedule_id)
        assert result["venue_ids"] == [venue_id]

    def test_get_practice_schedule_not_found(self):
        """ID指定で練習スケジュール取得 - 存在しない"""
        self.mock_schedule_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_practice_schedule(uuid4())

    # ===== create_practice_schedule =====

    def test_create_practice_schedule_success(self):
        """練習スケジュール作成 - 正常"""
        venue_id_1 = str(uuid4())
        venue_id_2 = str(uuid4())
        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "title": "テスト練習",
            "venue_ids": [venue_id_1, venue_id_2],
            "created_by": "user-1",
            "updated_by": "user-1",
        }

        created_schedule = make_practice_schedule(id=str(uuid4()))
        self.mock_schedule_repo.create.return_value = created_schedule
        self.mock_venue_assignment_repo.create.return_value = {}

        result = self.service.create_practice_schedule(schedule_data)

        assert result["venue_ids"] == [venue_id_1, venue_id_2]
        # created_by/updated_by が削除されることを確認
        create_call_data = self.mock_schedule_repo.create.call_args[0][0]
        assert "created_by" not in create_call_data
        assert "updated_by" not in create_call_data
        assert "venue_ids" not in create_call_data
        # 2つの会場が作成される
        assert self.mock_venue_assignment_repo.create.call_count == 2

    def test_create_practice_schedule_no_venues(self):
        """練習スケジュール作成 - 会場なし"""
        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "title": "テスト練習",
        }

        created_schedule = make_practice_schedule()
        self.mock_schedule_repo.create.return_value = created_schedule

        result = self.service.create_practice_schedule(schedule_data)

        assert result["venue_ids"] == []
        self.mock_venue_assignment_repo.create.assert_not_called()

    def test_create_practice_schedule_empty_stage_id(self):
        """練習スケジュール作成 - stage_idが空文字列"""
        schedule_data = {
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "stage_id": "",
        }

        created_schedule = make_practice_schedule()
        self.mock_schedule_repo.create.return_value = created_schedule

        result = self.service.create_practice_schedule(schedule_data)

        # stage_idがNoneに変換されていることを確認
        create_call_data = self.mock_schedule_repo.create.call_args[0][0]
        assert create_call_data["stage_id"] is None

    # ===== remove_practice_schedule =====

    def test_remove_practice_schedule_success(self):
        """練習スケジュール削除 - 正常"""
        schedule_id = uuid4()
        schedule = make_practice_schedule(id=str(schedule_id))

        self.mock_schedule_repo.find_by_id.return_value = schedule
        self.mock_instructor_repo.delete_by_schedule.return_value = 0
        self.mock_session_repo.delete_by_schedule.return_value = 0
        self.mock_venue_assignment_repo.delete_by_schedule.return_value = 0
        self.mock_schedule_repo.delete.return_value = None

        result = self.service.remove_practice_schedule(schedule_id)

        assert result is True
        # 関連データが先に削除されることを確認
        self.mock_instructor_repo.delete_by_schedule.assert_called_once_with(schedule_id)
        self.mock_session_repo.delete_by_schedule.assert_called_once_with(schedule_id)
        self.mock_venue_assignment_repo.delete_by_schedule.assert_called_once_with(schedule_id)
        self.mock_schedule_repo.delete.assert_called_once_with(schedule_id)

    def test_remove_practice_schedule_not_found(self):
        """練習スケジュール削除 - 存在しない"""
        self.mock_schedule_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.remove_practice_schedule(uuid4())

        self.mock_schedule_repo.delete.assert_not_called()

    # ===== get_practice_schedule_with_details =====

    def test_get_practice_schedule_with_details_success(self):
        """詳細情報付きスケジュール取得 - 正常"""
        schedule_id = uuid4()
        detailed = make_practice_schedule(id=str(schedule_id))
        detailed["sessions"] = []
        detailed["available_venues"] = []

        self.mock_schedule_repo.find_with_details.return_value = detailed

        result = self.service.get_practice_schedule_with_details(schedule_id)

        assert result == detailed

    def test_get_practice_schedule_with_details_not_found(self):
        """詳細情報付きスケジュール取得 - 存在しない"""
        self.mock_schedule_repo.find_with_details.return_value = None

        with pytest.raises(APIException):
            self.service.get_practice_schedule_with_details(uuid4())

    # ===== get_schedule_available_venues =====

    def test_get_schedule_available_venues(self):
        """利用可能会場取得"""
        schedule_id = uuid4()
        venues = [make_schedule_available_venue(schedule_id=str(schedule_id))]
        self.mock_venue_assignment_repo.find_by_schedule.return_value = venues

        result = self.service.get_schedule_available_venues(schedule_id)

        assert result == venues

    # ===== get_sessions_by_schedule =====

    def test_get_sessions_by_schedule_success(self):
        """セッション一覧取得 - 正常"""
        schedule_id = uuid4()
        sessions = [{"id": str(uuid4()), "schedule_id": str(schedule_id)}]
        self.mock_session_repo.find_by_schedule.return_value = sessions

        result = self.service.get_sessions_by_schedule(schedule_id)

        assert len(result) == 1
        assert result[0]["instructors"] == []

    # ===== get_practice_schedule_by_date =====

    def test_get_practice_schedule_by_date_found(self):
        """日付指定でスケジュール取得 - 存在する"""
        schedule = make_practice_schedule(schedule_date="2024-02-15")
        self.mock_schedule_repo.find_by_date.return_value = schedule

        result = self.service.get_practice_schedule_by_date("2024-02-15")

        assert result == schedule

    def test_get_practice_schedule_by_date_not_found(self):
        """日付指定でスケジュール取得 - 存在しない"""
        self.mock_schedule_repo.find_by_date.return_value = None

        result = self.service.get_practice_schedule_by_date("2024-12-31")

        assert result is None
