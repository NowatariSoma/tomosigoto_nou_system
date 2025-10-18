"""
最適化エンジンのテスト

ORToolsOptimizerクラスのテスト
"""

import pytest
from app.services.optimizer import ORToolsOptimizer
from app.models.optimization import OptimizationRequest
from app.models.schedule import ScheduleData, Member, Venue, Constraints


class TestORToolsOptimizer:
    """ORToolsOptimizerのテストクラス"""
    
    @pytest.fixture
    def sample_request(self):
        """サンプルリクエストの作成"""
        return OptimizationRequest(
            schedule_data=ScheduleData(
                start_date="2024-01-01",
                end_date="2024-01-31",
                practice_days=["monday", "wednesday", "friday"]
            ),
            members=[
                Member(
                    id="member_1",
                    name="田中太郎",
                    part="シテ",
                    skill_level="上級",
                    availability=["monday", "wednesday"]
                ),
                Member(
                    id="member_2",
                    name="佐藤花子",
                    part="ワキ",
                    skill_level="中級",
                    availability=["monday", "friday"]
                ),
                Member(
                    id="member_3",
                    name="鈴木一郎",
                    part="地謡",
                    skill_level="上級",
                    availability=["wednesday", "friday"]
                )
            ],
            venues=[
                Venue(
                    id="venue_1",
                    name="大ホール",
                    capacity=30,
                    available_times=["09:00-12:00", "14:00-17:00"],
                    priority=5
                ),
                Venue(
                    id="venue_2",
                    name="中ホール",
                    capacity=20,
                    available_times=["09:00-12:00", "14:00-17:00"],
                    priority=4
                ),
                Venue(
                    id="venue_3",
                    name="練習室A",
                    capacity=15,
                    available_times=["09:00-12:00", "14:00-17:00"],
                    priority=3
                )
            ],
            constraints=Constraints(
                max_practice_hours_per_week=10,
                min_members_per_session=1,
                max_sessions_per_day=4,
                min_break_time=30
            )
        )
    
    @pytest.fixture
    def optimizer(self):
        """最適化エンジンのインスタンス作成"""
        return ORToolsOptimizer(timeout_seconds=10)
    
    def test_optimizer_initialization(self, optimizer):
        """最適化エンジンの初期化テスト"""
        assert optimizer.timeout_seconds == 10
        assert optimizer.model is None
        assert optimizer.solver is None
    
    def test_optimize_schedule_success(self, optimizer, sample_request):
        """スケジュール最適化の成功テスト"""
        result = optimizer.optimize_schedule(sample_request)
        
        assert result is not None
        assert result.constraints_satisfied is True
        assert result.processing_time > 0
        assert result.model_version == "ortools-v1.0.0"
        assert result.optimization_status in ["OPTIMAL", "FEASIBLE"]
        
        # 最適化されたスケジュールの検証
        schedule = result.optimized_schedule
        assert schedule is not None
        assert len(schedule.sessions) > 0
        assert len(schedule.assignments) > 0
        assert schedule.total_sessions > 0
        assert schedule.total_practice_time > 0
    
    def test_optimize_schedule_with_invalid_constraints(self, optimizer):
        """無効な制約での最適化テスト"""
        invalid_request = OptimizationRequest(
            schedule_data=ScheduleData(
                start_date="2024-01-01",
                end_date="2024-01-31",
                practice_days=["monday"]
            ),
            members=[],  # メンバーなし
            venues=[
                Venue(
                    id="venue_1",
                    name="大ホール",
                    capacity=30,
                    available_times=["09:00-12:00"]
                )
            ]
        )
        
        result = optimizer.optimize_schedule(invalid_request)
        
        assert result.constraints_satisfied is False
        assert result.optimization_status == "ERROR"
        assert result.reward == 0.0
    
    def test_optimize_schedule_with_insufficient_capacity(self, optimizer):
        """容量不足での最適化テスト"""
        insufficient_request = OptimizationRequest(
            schedule_data=ScheduleData(
                start_date="2024-01-01",
                end_date="2024-01-31",
                practice_days=["monday"]
            ),
            members=[
                Member(
                    id="member_1",
                    name="田中太郎",
                    part="シテ",
                    skill_level="上級",
                    availability=["monday"]
                ),
                Member(
                    id="member_2",
                    name="佐藤花子",
                    part="ワキ",
                    skill_level="中級",
                    availability=["monday"]
                )
            ],
            venues=[
                Venue(
                    id="venue_1",
                    name="小ホール",
                    capacity=1,  # 容量不足
                    available_times=["09:00-12:00"]
                )
            ]
        )
        
        result = optimizer.optimize_schedule(insufficient_request)
        
        assert result.constraints_satisfied is False
        assert result.optimization_status == "ERROR"
    
    def test_scene_creation_from_members(self, optimizer, sample_request):
        """メンバーから場面作成のテスト"""
        scenes = optimizer._create_scenes_from_members(sample_request.members)
        
        assert len(scenes) == 3  # シテ、ワキ、地謡
        
        # シテの場面確認
        shite_scene = next(scene for scene in scenes if scene['name'] == 'シテ')
        assert shite_scene['priority'] == 5
        assert shite_scene['category'] == '役柄'
        assert 'member_1' in shite_scene['members']
        
        # ワキの場面確認
        waki_scene = next(scene for scene in scenes if scene['name'] == 'ワキ')
        assert waki_scene['priority'] == 4
        assert waki_scene['category'] == '役柄'
        assert 'member_2' in waki_scene['members']
        
        # 地謡の場面確認
        jiutai_scene = next(scene for scene in scenes if scene['name'] == '地謡')
        assert jiutai_scene['priority'] == 3
        assert jiutai_scene['category'] == '歌'
        assert 'member_3' in jiutai_scene['members']
    
    def test_timeslot_creation(self, optimizer, sample_request):
        """時間帯作成のテスト"""
        timeslots = optimizer._create_timeslots(sample_request.schedule_data)
        
        assert len(timeslots) == 4  # 4つの時間帯
        
        # 時間帯の内容確認
        assert timeslots[0]['start_time'] == '09:00'
        assert timeslots[0]['end_time'] == '12:00'
        assert timeslots[0]['priority'] == 3
        
        assert timeslots[1]['start_time'] == '13:00'
        assert timeslots[1]['end_time'] == '16:00'
        assert timeslots[1]['priority'] == 4
    
    def test_part_priority_mapping(self, optimizer):
        """パート優先度マッピングのテスト"""
        assert optimizer._get_part_priority('シテ') == 5
        assert optimizer._get_part_priority('ワキ') == 4
        assert optimizer._get_part_priority('地謡') == 3
        assert optimizer._get_part_priority('謡') == 3
        assert optimizer._get_part_priority('笛') == 3
        assert optimizer._get_part_priority('小鼓') == 2
        assert optimizer._get_part_priority('未知のパート') == 1
    
    def test_part_category_mapping(self, optimizer):
        """パートカテゴリマッピングのテスト"""
        assert optimizer._get_part_category('シテ') == '役柄'
        assert optimizer._get_part_category('ワキ') == '役柄'
        assert optimizer._get_part_category('地謡') == '歌'
        assert optimizer._get_part_category('謡') == '歌'
        assert optimizer._get_part_category('笛') == '楽器'
        assert optimizer._get_part_category('小鼓') == '楽器'
        assert optimizer._get_part_category('未知のパート') == 'その他'
