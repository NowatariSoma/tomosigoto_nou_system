"""
ScheduleTimeSlotService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4
from datetime import time

from app.services.schedule_time_slot_service import ScheduleTimeSlotService
from app.core.exceptions import APIException
from fastapi import HTTPException
from tests.helpers.factories import make_schedule_time_slot


class TestScheduleTimeSlotService:
    """ScheduleTimeSlotService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.service = ScheduleTimeSlotService(
            schedule_time_slot_repository=self.mock_repo,
        )

    # ===== get_all_schedule_time_slots =====

    @pytest.mark.asyncio
    async def test_get_all_schedule_time_slots_no_filter(self):
        """時間スロット一覧取得 - フィルタなし"""
        slots = [make_schedule_time_slot()]
        self.mock_repo.find_all.return_value = slots

        result = await self.service.get_all_schedule_time_slots()

        assert len(result) == 1
        self.mock_repo.find_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_schedule_time_slots_with_schedule_id(self):
        """時間スロット一覧取得 - スケジュールID指定"""
        schedule_id = uuid4()
        slots = [make_schedule_time_slot(schedule_id=str(schedule_id))]
        self.mock_repo.find_by_schedule.return_value = slots

        result = await self.service.get_all_schedule_time_slots(schedule_id=schedule_id)

        assert len(result) == 1
        self.mock_repo.find_by_schedule.assert_called_once_with(schedule_id)

    # ===== get_schedule_time_slot =====

    @pytest.mark.asyncio
    async def test_get_schedule_time_slot_success(self):
        """時間スロット取得 - 正常"""
        slot_id = uuid4()
        slot = make_schedule_time_slot(id=str(slot_id))
        self.mock_repo.find_by_id.return_value = slot

        result = await self.service.get_schedule_time_slot(slot_id)

        assert result["id"] == str(slot_id)

    @pytest.mark.asyncio
    async def test_get_schedule_time_slot_not_found(self):
        """時間スロット取得 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.get_schedule_time_slot(uuid4())

    # ===== create_schedule_time_slot =====

    @pytest.mark.asyncio
    async def test_create_schedule_time_slot_success(self):
        """時間スロット作成 - 正常"""
        schedule_id = uuid4()
        data = {
            "schedule_id": schedule_id,
            "slot_order": 1,
            "start_time": "09:00",
            "end_time": "10:00",
        }
        created = make_schedule_time_slot()

        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}
        self.mock_repo.create.return_value = created

        result = await self.service.create_schedule_time_slot(data)

        assert result is not None

    @pytest.mark.asyncio
    async def test_create_schedule_time_slot_invalid_time(self):
        """時間スロット作成 - 開始時刻>=終了時刻"""
        schedule_id = uuid4()
        data = {
            "schedule_id": schedule_id,
            "slot_order": 1,
            "start_time": "10:00",
            "end_time": "09:00",
        }

        self.mock_repo.find_schedule_by_id.return_value = {"id": str(schedule_id)}

        with pytest.raises(HTTPException) as exc_info:
            await self.service.create_schedule_time_slot(data)

        assert exc_info.value.status_code == 400

    # ===== delete_schedule_time_slot =====

    @pytest.mark.asyncio
    async def test_delete_schedule_time_slot_success(self):
        """時間スロット削除 - 正常"""
        slot_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_schedule_time_slot(
            id=str(slot_id)
        )
        self.mock_repo.delete.return_value = True

        result = await self.service.delete_schedule_time_slot(slot_id)

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_schedule_time_slot_not_found(self):
        """時間スロット削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.delete_schedule_time_slot(uuid4())

    # ===== _format_time_slot =====

    def test_format_time_slot_string_time(self):
        """時間スロットフォーマット - 文字列の時刻"""
        slot = {"id": "1", "start_time": "09:00:00", "end_time": "10:30:00"}

        result = self.service._format_time_slot(slot)

        assert result["start_time"] == "09:00"
        assert result["end_time"] == "10:30"

    def test_format_time_slot_time_object(self):
        """時間スロットフォーマット - timeオブジェクトの時刻"""
        slot = {"id": "1", "start_time": time(9, 0), "end_time": time(10, 30)}

        result = self.service._format_time_slot(slot)

        assert result["start_time"] == "09:00"
        assert result["end_time"] == "10:30"

    # ===== _parse_time_string =====

    def test_parse_time_string_hhmm(self):
        """時刻文字列パース - HH:MM形式"""
        result = self.service._parse_time_string("09:30")

        assert result == time(9, 30, 0)

    def test_parse_time_string_hhmmss(self):
        """時刻文字列パース - HH:MM:SS形式"""
        result = self.service._parse_time_string("09:30:15")

        assert result == time(9, 30, 15)

    def test_parse_time_string_invalid(self):
        """時刻文字列パース - 無効な形式"""
        with pytest.raises(ValueError):
            self.service._parse_time_string("invalid")

    # ===== delete_by_schedule =====

    @pytest.mark.asyncio
    async def test_delete_by_schedule(self):
        """スケジュール指定で一括削除"""
        self.mock_repo.delete_by_schedule.return_value = 6

        result = await self.service.delete_schedule_time_slots_by_schedule(uuid4())

        assert result == 6
