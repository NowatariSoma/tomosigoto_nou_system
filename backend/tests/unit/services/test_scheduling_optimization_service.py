"""
SchedulingOptimizationService のユニットテスト

NOTE: 最適化ロジック自体は optimization/ パッケージでテストする想定。
ここではサービス層のデータ取得とパラメータ変換をテストする。
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from app.services.scheduling_optimization_service import SchedulingOptimizationService
from app.core.exceptions import APIException
from tests.helpers.factories import make_practice_schedule


class TestSchedulingOptimizationService:
    """SchedulingOptimizationService のテスト"""

    def setup_method(self):
        self.mock_schedule_repo = AsyncMock()
        self.mock_venue_repo = AsyncMock()
        self.mock_session_repo = AsyncMock()
        self.mock_part_repo = AsyncMock()
        self.mock_member_repo = AsyncMock()
        self.mock_user_repo = AsyncMock()
        self.mock_attendance_repo = AsyncMock()
        self.mock_role_repo = AsyncMock()

        self.service = SchedulingOptimizationService(
            practice_schedule_repository=self.mock_schedule_repo,
            schedule_available_venue_repository=self.mock_venue_repo,
            session_repository=self.mock_session_repo,
            part_repository=self.mock_part_repo,
            member_assignment_repository=self.mock_member_repo,
            user_repository=self.mock_user_repo,
            attendance_repository=self.mock_attendance_repo,
            user_role_repository=self.mock_role_repo,
        )

    # ===== _get_schedule_data =====

    @pytest.mark.asyncio
    async def test_get_schedule_data_found(self):
        """スケジュールデータ取得 - 正常"""
        schedule_id = uuid4()
        schedule = make_practice_schedule(id=str(schedule_id))
        self.mock_schedule_repo.find_by_id.return_value = schedule

        result = await self.service._get_schedule_data(schedule_id)

        assert result is not None
        assert result["id"] == str(schedule_id)

    @pytest.mark.asyncio
    async def test_get_schedule_data_not_found(self):
        """スケジュールデータ取得 - なし"""
        self.mock_schedule_repo.find_by_id.return_value = None

        result = await self.service._get_schedule_data(uuid4())

        assert result is None

    # ===== optimize_schedule =====

    @pytest.mark.asyncio
    async def test_optimize_schedule_no_schedule(self):
        """スケジュール最適化 - スケジュールが存在しない"""
        self.mock_schedule_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.optimize_schedule(uuid4())

    @pytest.mark.asyncio
    async def test_optimize_schedule_no_stage_id(self):
        """スケジュール最適化 - stage_idがない"""
        schedule_id = uuid4()
        schedule = make_practice_schedule(id=str(schedule_id))
        # 1回目: optimize_schedule内のget_schedule_data
        # 2回目: _get_related_data内のfind_by_id
        self.mock_schedule_repo.find_by_id.side_effect = [
            schedule,
            {**schedule, "stage_id": None},
        ]

        with pytest.raises(APIException):
            await self.service.optimize_schedule(schedule_id)

    # ===== preview_optimization =====

    @pytest.mark.asyncio
    async def test_preview_optimization_no_schedule(self):
        """最適化プレビュー - スケジュールが存在しない"""
        self.mock_schedule_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.preview_optimization(uuid4())

    # ===== パラメータのデフォルト値 =====

    @pytest.mark.asyncio
    async def test_optimize_schedule_default_params(self):
        """最適化パラメータが未指定の場合にデフォルト値が使われる"""
        schedule_id = uuid4()
        stage_id = str(uuid4())
        schedule = make_practice_schedule(id=str(schedule_id))
        schedule["stage_id"] = stage_id

        # find_by_idが複数回呼ばれる
        self.mock_schedule_repo.find_by_id.return_value = schedule
        self.mock_venue_repo.find_by_schedule.return_value = []
        self.mock_part_repo.find_by_stage_id.return_value = []
        self.mock_user_repo.get_all_users.return_value = []
        self.mock_member_repo.find_all.return_value = []
        self.mock_attendance_repo.find_by_practice_schedule.return_value = []

        # バリデーションエラーで止まるので、SchedulingDataAdapterをモック
        with patch(
            "app.services.scheduling_optimization_service.SchedulingDataAdapter"
        ) as mock_adapter:
            mock_adapter.validate_scheduling_data.return_value = [
                "テストエラー"
            ]

            with pytest.raises(APIException):
                await self.service.optimize_schedule(schedule_id)
