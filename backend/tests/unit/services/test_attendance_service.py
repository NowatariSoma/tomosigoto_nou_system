"""
AttendanceService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.attendance_service import AttendanceService
from app.core.exceptions import APIException
from tests.helpers.factories import make_attendance


class TestAttendanceService:
    """AttendanceService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.mock_user_repo = Mock()
        self.mock_profile_repo = Mock()
        self.service = AttendanceService(
            attendance_repository=self.mock_repo,
            user_repository=self.mock_user_repo,
            user_profile_repository=self.mock_profile_repo,
        )

    # ===== get_all_attendances =====

    def test_get_all_attendances(self):
        """全出欠記録取得"""
        attendances = [make_attendance(), make_attendance()]
        self.mock_repo.find_all.return_value = attendances

        result = self.service.get_all_attendances()

        assert result == attendances
        self.mock_repo.find_all.assert_called_once()

    # ===== get_attendance =====

    def test_get_attendance_success(self):
        """ID指定で出欠記録取得 - 正常"""
        attendance_id = uuid4()
        attendance = make_attendance(id=str(attendance_id))
        self.mock_repo.find_by_id.return_value = attendance

        result = self.service.get_attendance(attendance_id)

        assert result == attendance

    def test_get_attendance_not_found(self):
        """ID指定で出欠記録取得 - 存在しない場合"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_attendance(uuid4())

    # ===== get_attendances_by_practice =====

    def test_get_attendances_by_practice(self):
        """練習スケジュール別出欠記録取得"""
        schedule_id = uuid4()
        attendances = [make_attendance(practice_schedule_id=str(schedule_id))]
        self.mock_repo.find_by_practice_schedule.return_value = attendances

        result = self.service.get_attendances_by_practice(schedule_id)

        assert result == attendances
        self.mock_repo.find_by_practice_schedule.assert_called_once_with(schedule_id)

    # ===== get_attendances_by_user =====

    def test_get_attendances_by_user(self):
        """ユーザー別出欠記録取得"""
        user_id = uuid4()
        attendances = [make_attendance(user_id=str(user_id))]
        self.mock_repo.find_by_user.return_value = attendances

        result = self.service.get_attendances_by_user(user_id)

        assert result == attendances

    # ===== create_attendance =====

    def test_create_attendance_success(self):
        """出欠記録作成 - 正常"""
        schedule_id = str(uuid4())
        user_id = str(uuid4())
        attendance_data = {
            "practice_schedule_id": schedule_id,
            "user_id": user_id,
            "status": "present",
        }
        created = make_attendance(**attendance_data)

        self.mock_repo.find_by_practice_and_user.return_value = None
        self.mock_repo.create.return_value = created

        result = self.service.create_attendance(attendance_data)

        assert result == created
        self.mock_repo.find_by_practice_and_user.assert_called_once_with(
            schedule_id, user_id
        )
        self.mock_repo.create.assert_called_once_with(attendance_data)

    def test_create_attendance_duplicate(self):
        """出欠記録作成 - 重複がある場合はAPIException"""
        schedule_id = str(uuid4())
        user_id = str(uuid4())
        attendance_data = {
            "practice_schedule_id": schedule_id,
            "user_id": user_id,
            "status": "present",
        }

        self.mock_repo.find_by_practice_and_user.return_value = make_attendance()

        with pytest.raises(APIException):
            self.service.create_attendance(attendance_data)

        self.mock_repo.create.assert_not_called()

    # ===== update_attendance =====

    def test_update_attendance_success(self):
        """出欠記録更新 - 正常"""
        attendance_id = uuid4()
        existing = make_attendance(id=str(attendance_id))
        update_data = {"status": "absent"}
        updated = make_attendance(id=str(attendance_id), status="absent")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.update.return_value = updated

        result = self.service.update_attendance(attendance_id, update_data)

        assert result == updated

    def test_update_attendance_not_found(self):
        """出欠記録更新 - 存在しない場合"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.update_attendance(uuid4(), {"status": "absent"})

    # ===== upsert_attendance =====

    def test_upsert_attendance(self):
        """出欠記録upsert"""
        attendance_data = {"practice_schedule_id": str(uuid4()), "user_id": str(uuid4()), "status": "present"}
        upserted = make_attendance(**attendance_data)
        self.mock_repo.upsert.return_value = upserted

        result = self.service.upsert_attendance(attendance_data)

        assert result == upserted
        self.mock_repo.upsert.assert_called_once_with(attendance_data)

    # ===== remove_attendance =====

    def test_remove_attendance_success(self):
        """出欠記録削除 - 正常"""
        attendance_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_attendance(id=str(attendance_id))
        self.mock_repo.delete.return_value = None

        result = self.service.remove_attendance(attendance_id)

        assert result is True

    def test_remove_attendance_not_found(self):
        """出欠記録削除 - 存在しない場合"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.remove_attendance(uuid4())

    # ===== get_attendance_summary =====

    def test_get_attendance_summary(self):
        """出欠サマリー取得"""
        summary = [{"practice_schedule_id": "ps-1", "present": 5, "absent": 2}]
        self.mock_repo.get_attendance_summary.return_value = summary

        result = self.service.get_attendance_summary()

        assert result == summary

    # ===== bulk_update_attendances =====

    def test_bulk_update_attendances(self):
        """一括出欠更新"""
        schedule_id = uuid4()
        attendances_data = [
            {"user_id": str(uuid4()), "status": "present"},
            {"user_id": str(uuid4()), "status": "absent"},
        ]

        upserted_1 = make_attendance(status="present")
        upserted_2 = make_attendance(status="absent")
        self.mock_repo.upsert.side_effect = [upserted_1, upserted_2]

        result = self.service.bulk_update_attendances(
            schedule_id, attendances_data
        )

        assert len(result) == 2
        assert self.mock_repo.upsert.call_count == 2

    # ===== get_users_with_attendance_for_admin =====

    def test_get_users_with_attendance_for_admin_no_repos(self):
        """管理者用取得 - リポジトリが未設定の場合はエラー"""
        service_no_repos = AttendanceService(
            attendance_repository=self.mock_repo,
            user_repository=None,
            user_profile_repository=None,
        )

        with pytest.raises(APIException):
            service_no_repos.get_users_with_attendance_for_admin()
