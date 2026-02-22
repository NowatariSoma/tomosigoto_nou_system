"""
SessionInstructorService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

from app.services.session_instructor_service import SessionInstructorService
from app.core.exceptions import APIException
from fastapi import HTTPException
from tests.helpers.factories import make_session_instructor


class TestSessionInstructorService:
    """SessionInstructorService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.service = SessionInstructorService(
            session_instructor_repository=self.mock_repo,
        )

    # ===== get_all_session_instructors =====

    @pytest.mark.asyncio
    async def test_get_all_session_instructors_paginated(self):
        """セッション指導者一覧取得（ページネーション）"""
        items = [make_session_instructor()]
        self.mock_repo.find_all_with_details.return_value = items
        self.mock_repo.count_all.return_value = 1

        result = await self.service.get_all_session_instructors(page=1, per_page=20)

        assert result["items"] == items
        assert result["total"] == 1
        assert result["page"] == 1
        assert result["total_pages"] == 1

    @pytest.mark.asyncio
    async def test_get_all_session_instructors_with_filters(self):
        """セッション指導者一覧取得 - フィルタ付き"""
        schedule_id = uuid4()
        self.mock_repo.find_all_with_details.return_value = []
        self.mock_repo.count_all.return_value = 0

        result = await self.service.get_all_session_instructors(
            schedule_id=schedule_id, slot_order=1
        )

        self.mock_repo.find_all_with_details.assert_called_once_with(
            limit=20, offset=0, schedule_id=schedule_id, slot_order=1
        )

    # ===== get_session_instructor =====

    @pytest.mark.asyncio
    async def test_get_session_instructor_success(self):
        """セッション指導者取得 - 正常"""
        instructor_id = uuid4()
        instructor = make_session_instructor(id=str(instructor_id))
        self.mock_repo.find_by_id.return_value = instructor

        result = await self.service.get_session_instructor(instructor_id)

        assert result == instructor

    @pytest.mark.asyncio
    async def test_get_session_instructor_not_found(self):
        """セッション指導者取得 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.get_session_instructor(uuid4())

    # ===== create_session_instructor =====

    @pytest.mark.asyncio
    async def test_create_session_instructor_success(self):
        """セッション指導者作成 - 正常"""
        schedule_id = uuid4()
        attendance_id = uuid4()
        data = {
            "schedule_id": schedule_id,
            "attendance_id": attendance_id,
            "schedule_available_venue_id": None,
            "slot_order": 1,
        }
        created = make_session_instructor()

        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.find_attendance_by_id.return_value = {
            "id": str(attendance_id),
            "practice_schedule_id": str(schedule_id),
        }
        self.mock_repo.create.return_value = created

        result = await self.service.create_session_instructor(data)

        assert result == created

    @pytest.mark.asyncio
    async def test_create_session_instructor_schedule_not_found(self):
        """セッション指導者作成 - スケジュールなし"""
        data = {
            "schedule_id": uuid4(),
            "attendance_id": uuid4(),
            "schedule_available_venue_id": None,
        }
        self.mock_repo.find_schedule_by_id.return_value = None

        with pytest.raises(HTTPException):
            await self.service.create_session_instructor(data)

    @pytest.mark.asyncio
    async def test_create_session_instructor_attendance_not_found(self):
        """セッション指導者作成 - 出席記録なし"""
        schedule_id = uuid4()
        data = {
            "schedule_id": schedule_id,
            "attendance_id": uuid4(),
            "schedule_available_venue_id": None,
        }
        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.find_attendance_by_id.return_value = None

        with pytest.raises(HTTPException):
            await self.service.create_session_instructor(data)

    @pytest.mark.asyncio
    async def test_create_session_instructor_schedule_mismatch(self):
        """セッション指導者作成 - スケジュールと出席のスケジュールが不一致"""
        schedule_id = uuid4()
        other_schedule_id = uuid4()
        attendance_id = uuid4()
        data = {
            "schedule_id": schedule_id,
            "attendance_id": attendance_id,
            "schedule_available_venue_id": None,
        }
        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.find_attendance_by_id.return_value = {
            "id": str(attendance_id),
            "practice_schedule_id": str(other_schedule_id),
        }

        with pytest.raises(HTTPException):
            await self.service.create_session_instructor(data)

    # ===== delete_session_instructor =====

    @pytest.mark.asyncio
    async def test_delete_session_instructor_success(self):
        """セッション指導者削除 - 正常"""
        instructor_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_session_instructor(
            id=str(instructor_id)
        )
        self.mock_repo.delete.return_value = True

        result = await self.service.delete_session_instructor(instructor_id)

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_session_instructor_not_found(self):
        """セッション指導者削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.delete_session_instructor(uuid4())

    # ===== delete_session_instructors_by_schedule =====

    @pytest.mark.asyncio
    async def test_delete_by_schedule(self):
        """スケジュール指定で一括削除"""
        schedule_id = uuid4()
        self.mock_repo.delete_by_schedule.return_value = 3

        result = await self.service.delete_session_instructors_by_schedule(schedule_id)

        assert result == 3

    # ===== get_all_session_instructors_simple =====

    @pytest.mark.asyncio
    async def test_get_all_session_instructors_simple(self):
        """シンプル版一覧取得"""
        items = [make_session_instructor()]
        self.mock_repo.find_all_with_details.return_value = items

        result = await self.service.get_all_session_instructors_simple()

        assert result == items
        self.mock_repo.find_all_with_details.assert_called_once_with(
            limit=1000, offset=0, schedule_id=None, slot_order=None
        )
