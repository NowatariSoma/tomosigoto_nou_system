"""
スケジューリング最適化のテスト
"""
import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4

from app.services.optimization.models import SchedulingProblem, Player, Room, TimeSlot, PartAssignment
from app.services.optimization.optimizer import SchedulingOptimizer
from app.services.optimization.adapters import SchedulingDataAdapter
from app.services.scheduling_optimization_service import SchedulingOptimizationService


def create_simple_test_problem() -> SchedulingProblem:
    """シンプルなテスト用問題を作成"""
    # パートデータ
    parts = [
        {"id": "part-1", "name": "シテ方"},
        {"id": "part-2", "name": "地謡"},
        {"id": "part-3", "name": "囃子方"}
    ]
    
    # 部屋データ
    rooms = [
        Room(id=1, name="会場1"),
        Room(id=2, name="会場2")
    ]
    
    # 時間コマデータ
    time_slots = [
        TimeSlot(id=1, name="1限目"),
        TimeSlot(id=2, name="2限目"),
        TimeSlot(id=3, name="3限目")
    ]
    
    # プレイヤーデータ（指導者1人、一般プレイヤー2人）
    players = []
    
    # 指導者
    instructor_assignments = [
        PartAssignment(part_id="part-1", part_name="シテ方", priority=80),
        PartAssignment(part_id="part-2", part_name="地謡", priority=70)
    ]
    instructor = Player(
        id=1,
        name="指導者1",
        part_assignments=instructor_assignments,
        is_instructor=True,
        user_id="user-instructor-1"
    )
    players.append(instructor)
    
    # 一般プレイヤー1
    player1_assignments = [
        PartAssignment(part_id="part-1", part_name="シテ方", priority=60)
    ]
    player1 = Player(
        id=2,
        name="プレイヤー1",
        part_assignments=player1_assignments,
        is_instructor=False,
        user_id="user-player-1"
    )
    players.append(player1)
    
    # 一般プレイヤー2
    player2_assignments = [
        PartAssignment(part_id="part-3", part_name="囃子方", priority=50)
    ]
    player2 = Player(
        id=3,
        name="プレイヤー2",
        part_assignments=player2_assignments,
        is_instructor=False,
        user_id="user-player-2"
    )
    players.append(player2)
    
    return SchedulingProblem(
        parts=parts,
        rooms=rooms,
        time_slots=time_slots,
        players=players
    )


class TestSchedulingOptimizer:
    """SchedulingOptimizerのテスト"""
    
    def test_create_sample_problem(self):
        """サンプル問題の作成テスト"""
        problem = create_simple_test_problem()
        
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
        problem = create_simple_test_problem()
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
        user_roles_data = [{"user_id": "user-1", "is_instructor": True}]

        errors = SchedulingDataAdapter.validate_scheduling_data(
            schedule_data, venues_data, parts_data, users_data, member_assignments_data,
            user_roles_data=user_roles_data
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
            'user_repository': Mock(),
            'attendance_repository': Mock(),
            'user_role_repository': Mock(),
        }
    
    @pytest.fixture
    def service(self, mock_repositories):
        """サービスのインスタンス作成"""
        return SchedulingOptimizationService(**mock_repositories)
    
    @pytest.mark.skip(reason="モックリポジトリのデータが不足しており実装との乖離が大きいため要修正")
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
    
    @pytest.mark.skip(reason="モックリポジトリのデータが不足しており実装との乖離が大きいため要修正")
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


class TestLateArrivalSupport:
    """遅刻・途中参加対応のテスト"""

    def test_player_is_available_at_no_restriction(self):
        """available_slot_ids=None のとき全スロット参加可能"""
        player = Player(
            id=1, name="テスト", part_assignments=[],
            available_slot_ids=None
        )
        assert player.is_available_at(1) is True
        assert player.is_available_at(99) is True

    def test_player_is_available_at_restricted(self):
        """available_slot_ids が設定されているとき指定スロットのみ参加可能"""
        player = Player(
            id=1, name="遅刻者", part_assignments=[],
            available_slot_ids=[2, 3]
        )
        assert player.is_available_at(1) is False
        assert player.is_available_at(2) is True
        assert player.is_available_at(3) is True

    def test_compute_available_slot_ids_no_restriction(self):
        """available_from/available_to 未設定 → None（全スロット）"""
        from datetime import time
        time_slots = [
            TimeSlot(id=1, name="1限目", start_time=time(9, 0), end_time=time(10, 0)),
            TimeSlot(id=2, name="2限目", start_time=time(10, 0), end_time=time(11, 0)),
        ]
        result = SchedulingDataAdapter._compute_available_slot_ids({}, time_slots)
        assert result is None

    def test_compute_available_slot_ids_late_arrival(self):
        """遅刻（available_from=10:00）→ 1限目は除外"""
        from datetime import time
        time_slots = [
            TimeSlot(id=1, name="1限目", start_time=time(9, 0), end_time=time(10, 0)),
            TimeSlot(id=2, name="2限目", start_time=time(10, 0), end_time=time(11, 0)),
            TimeSlot(id=3, name="3限目", start_time=time(11, 0), end_time=time(12, 0)),
        ]
        attendance = {"available_from": "10:00:00", "available_to": None}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [2, 3]

    def test_compute_available_slot_ids_early_departure(self):
        """途中退席（available_to=10:00）→ 2限目以降は除外"""
        from datetime import time
        time_slots = [
            TimeSlot(id=1, name="1限目", start_time=time(9, 0), end_time=time(10, 0)),
            TimeSlot(id=2, name="2限目", start_time=time(10, 0), end_time=time(11, 0)),
            TimeSlot(id=3, name="3限目", start_time=time(11, 0), end_time=time(12, 0)),
        ]
        attendance = {"available_from": None, "available_to": "10:00:00"}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [1]

    def test_compute_available_slot_ids_both(self):
        """遅刻＋途中退席 → 中間スロットのみ"""
        from datetime import time
        time_slots = [
            TimeSlot(id=1, name="1限目", start_time=time(9, 0), end_time=time(10, 0)),
            TimeSlot(id=2, name="2限目", start_time=time(10, 0), end_time=time(11, 0)),
            TimeSlot(id=3, name="3限目", start_time=time(11, 0), end_time=time(12, 0)),
        ]
        attendance = {"available_from": "10:00:00", "available_to": "11:00:00"}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [2]

    def test_compute_available_slot_ids_sentinel_from(self):
        """センチネルモード: 全スロット時刻なし + available_from=2限目以降"""
        time_slots = [
            TimeSlot(id=1, name="1限目"),
            TimeSlot(id=2, name="2限目"),
            TimeSlot(id=3, name="3限目"),
        ]
        attendance = {"available_from": "02:00:00", "available_to": None}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [2, 3]

    def test_compute_available_slot_ids_sentinel_to(self):
        """センチネルモード: 全スロット時刻なし + available_to=2限目まで"""
        time_slots = [
            TimeSlot(id=1, name="1限目"),
            TimeSlot(id=2, name="2限目"),
            TimeSlot(id=3, name="3限目"),
        ]
        attendance = {"available_from": None, "available_to": "02:00:00"}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [1, 2]

    def test_compute_available_slot_ids_sentinel_both(self):
        """センチネルモード: 全スロット時刻なし + from=2, to=3"""
        time_slots = [
            TimeSlot(id=10, name="1限目"),  # IDは任意
            TimeSlot(id=20, name="2限目"),
            TimeSlot(id=30, name="3限目"),
            TimeSlot(id=40, name="4限目"),
        ]
        attendance = {"available_from": "02:00:00", "available_to": "03:00:00"}
        result = SchedulingDataAdapter._compute_available_slot_ids(attendance, time_slots)
        assert result == [20, 30]

    def test_solve_with_late_instructor(self):
        """遅刻した指導者は参加不可スロットを指導しない"""
        # part 1つ・room 2つ・slot 2つ
        # 指導者は slot 1 参加不可 → part-1 は slot 2 に配置されるはず
        parts = [{"id": "part-1", "name": "シテ方"}]
        rooms = [Room(id=1, name="会場1"), Room(id=2, name="会場2")]
        time_slots = [
            TimeSlot(id=1, name="1限目"),
            TimeSlot(id=2, name="2限目"),
        ]

        # 遅刻指導者: slot 2のみ参加可能
        instructor = Player(
            id=1, name="遅刻指導者",
            part_assignments=[
                PartAssignment(part_id="part-1", part_name="シテ方", priority=80),
            ],
            is_instructor=True,
            available_slot_ids=[2]
        )
        problem = SchedulingProblem(parts=parts, rooms=rooms, time_slots=time_slots, players=[instructor])
        optimizer = SchedulingOptimizer(problem)
        solution = optimizer.solve(time_limit_seconds=5)

        assert solution is not None
        assert len(solution.sessions) == 1
        # 遅刻指導者は slot 1 に配置できないため slot 2 になるはず
        assert solution.sessions[0].time_slot_id == 2, \
            f"遅刻指導者が slot 1 を指導してしまっている: {solution.sessions[0]}"


if __name__ == "__main__":
    pytest.main([__file__])
