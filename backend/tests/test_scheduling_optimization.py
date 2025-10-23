"""
スケジューリング最適化のテスト
"""
import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4

from app.services.optimization.models import SchedulingProblem, Player, Room, TimeSlot, PartType
from app.services.optimization.optimizer import SchedulingOptimizer
from app.services.optimization.adapters import SchedulingDataAdapter
from app.services.scheduling_optimization_service import SchedulingOptimizationService


class TestSchedulingOptimizer:
    """SchedulingOptimizerのテスト"""
    
    def test_create_sample_problem(self):
        """サンプル問題の作成テスト"""
        problem = SchedulingOptimizer.create_sample_problem()
        
        assert isinstance(problem, SchedulingProblem)
        assert len(problem.players) > 0
        assert len(problem.rooms) > 0
        assert len(problem.time_slots) > 0
        assert len(problem.parts) > 0
        
        # 指導者の存在確認
        instructors = [p for p in problem.players if p.is_instructor]
        assert len(instructors) > 0
        
        # 一般プレイヤーの存在確認
        regular_players = [p for p in problem.players if not p.is_instructor]
        assert len(regular_players) > 0
    
    def test_solve_sample_problem(self):
        """サンプル問題の求解テスト"""
        problem = SchedulingOptimizer.create_sample_problem()
        optimizer = SchedulingOptimizer(problem)
        
        solution = optimizer.solve(time_limit_seconds=10)
        
        assert solution is not None
        assert len(solution.sessions) > 0
        assert solution.objective_value is not None
        assert solution.solve_time_seconds > 0


class TestSchedulingDataAdapter:
    """SchedulingDataAdapterのテスト"""
    
    def test_validate_scheduling_data_valid(self):
        """有効なデータの検証テスト"""
        schedule_data = {"id": "test-id", "division_count": 6}
        venues_data = [{"id": "venue-1", "name": "会場1"}]
        parts_data = [{"id": "part-1", "name": "A"}]
        users_data = [{"id": "user-1", "name": "ユーザー1"}]
        member_assignments_data = [{"user_id": "user-1", "part_id": "part-1"}]
        
        errors = SchedulingDataAdapter.validate_scheduling_data(
            schedule_data, venues_data, parts_data, users_data, member_assignments_data
        )
        
        assert len(errors) == 0
    
    def test_validate_scheduling_data_invalid(self):
        """無効なデータの検証テスト"""
        schedule_data = {}  # 必須フィールドが不足
        venues_data = []
        parts_data = []
        users_data = []
        member_assignments_data = []
        
        errors = SchedulingDataAdapter.validate_scheduling_data(
            schedule_data, venues_data, parts_data, users_data, member_assignments_data
        )
        
        assert len(errors) > 0
        assert any("スケジュールID" in error for error in errors)
        assert any("会場" in error for error in errors)
        assert any("パート" in error for error in errors)
    
    def test_create_venue_mapping(self):
        """会場マッピングの作成テスト"""
        venues_data = [
            {"id": "venue-1", "name": "会場1"},
            {"id": "venue-2", "name": "会場2"}
        ]
        
        mapping = SchedulingDataAdapter.create_venue_mapping(venues_data)
        
        assert mapping[1] == "venue-1"
        assert mapping[2] == "venue-2"
    
    def test_create_part_mapping(self):
        """パートマッピングの作成テスト"""
        parts_data = [
            {"id": "part-1", "name": "A"},
            {"id": "part-2", "name": "B"}
        ]
        
        mapping = SchedulingDataAdapter.create_part_mapping(parts_data)
        
        assert mapping["A"] == "part-1"
        assert mapping["B"] == "part-2"


class TestSchedulingOptimizationService:
    """SchedulingOptimizationServiceのテスト"""
    
    @pytest.fixture
    def mock_repositories(self):
        """モックリポジトリの作成"""
        return {
            'practice_schedule_repository': Mock(),
            'schedule_available_venue_repository': Mock(),
            'session_repository': Mock(),
            'part_repository': Mock(),
            'member_assignment_repository': Mock(),
            'user_repository': Mock()
        }
    
    @pytest.fixture
    def service(self, mock_repositories):
        """サービスのインスタンス作成"""
        return SchedulingOptimizationService(**mock_repositories)
    
    @pytest.mark.asyncio
    async def test_optimize_schedule_success(self, service, mock_repositories):
        """スケジュール最適化の成功テスト"""
        schedule_id = uuid4()
        
        # モックデータの設定
        schedule_data = {"id": str(schedule_id), "division_count": 6}
        venues_data = [{"id": "venue-1", "name": "会場1"}]
        parts_data = [{"id": "part-1", "name": "A"}]
        users_data = [{"id": "user-1", "name": "ユーザー1"}]
        member_assignments_data = [{"user_id": "user-1", "part_id": "part-1"}]
        
        # リポジトリのモック設定
        mock_repositories['practice_schedule_repository'].find_by_id = AsyncMock(return_value=schedule_data)
        mock_repositories['schedule_available_venue_repository'].find_by_schedule = AsyncMock(return_value=venues_data)
        mock_repositories['part_repository'].find_all = AsyncMock(return_value=parts_data)
        mock_repositories['user_repository'].find_all = AsyncMock(return_value=users_data)
        mock_repositories['member_assignment_repository'].find_all = AsyncMock(return_value=member_assignments_data)
        mock_repositories['session_repository'].delete_by_schedule = AsyncMock()
        mock_repositories['session_repository'].create = AsyncMock(return_value={"id": "session-1"})
        
        # 最適化実行
        result = await service.optimize_schedule(schedule_id)
        
        assert result["status"] == "success"
        assert result["schedule_id"] == str(schedule_id)
        assert "sessions_created" in result
        assert "objective_value" in result
    
    @pytest.mark.asyncio
    async def test_optimize_schedule_not_found(self, service, mock_repositories):
        """スケジュールが見つからない場合のテスト"""
        schedule_id = uuid4()
        
        # リポジトリのモック設定（スケジュールが見つからない）
        mock_repositories['practice_schedule_repository'].find_by_id = AsyncMock(return_value=None)
        
        # 最適化実行（エラーが発生することを確認）
        with pytest.raises(Exception):  # APIExceptionが発生することを期待
            await service.optimize_schedule(schedule_id)
    
    @pytest.mark.asyncio
    async def test_preview_optimization_success(self, service, mock_repositories):
        """最適化プレビューの成功テスト"""
        schedule_id = uuid4()
        
        # モックデータの設定
        schedule_data = {"id": str(schedule_id), "division_count": 6}
        venues_data = [{"id": "venue-1", "name": "会場1"}]
        parts_data = [{"id": "part-1", "name": "A"}]
        users_data = [{"id": "user-1", "name": "ユーザー1"}]
        member_assignments_data = [{"user_id": "user-1", "part_id": "part-1"}]
        
        # リポジトリのモック設定
        mock_repositories['practice_schedule_repository'].find_by_id = AsyncMock(return_value=schedule_data)
        mock_repositories['schedule_available_venue_repository'].find_by_schedule = AsyncMock(return_value=venues_data)
        mock_repositories['part_repository'].find_all = AsyncMock(return_value=parts_data)
        mock_repositories['user_repository'].find_all = AsyncMock(return_value=users_data)
        mock_repositories['member_assignment_repository'].find_all = AsyncMock(return_value=member_assignments_data)
        
        # プレビュー実行
        result = await service.preview_optimization(schedule_id)
        
        assert result["status"] == "success"
        assert result["preview"] is True
        assert result["schedule_id"] == str(schedule_id)
        assert "sessions_count" in result
        assert "objective_value" in result


if __name__ == "__main__":
    pytest.main([__file__])
