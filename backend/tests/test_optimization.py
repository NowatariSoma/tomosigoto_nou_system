"""
最適化システムのテスト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tests.fixtures.optimization_test_data import (
    create_simple_test_problem,
    create_test_member_assignments_data,
    create_test_attendance_data,
    create_test_data_with_categories
)
from app.services.optimization.models import PartAssignment, Player
from app.services.optimization.constants import PriorityConfig


class TestDataModels:
    """データモデルのテスト"""
    
    def test_part_assignment_creation(self):
        """PartAssignmentの作成テスト"""
        assignment = PartAssignment(part_id="uuid-1", part_name="第1バイオリン", priority=80)
        assert assignment.part_id == "uuid-1"
        assert assignment.part_name == "第1バイオリン"
        assert assignment.priority == 80
    
    def test_part_assignment_validation(self):
        """PartAssignmentのバリデーションテスト"""
        # 正常な範囲
        assignment = PartAssignment(part_id="uuid-1", part_name="第1バイオリン", priority=50)
        assert 0 <= assignment.priority <= 100
        
        # 境界値テスト
        PartAssignment(part_id="uuid-1", part_name="第1バイオリン", priority=0)   # 最小値
        PartAssignment(part_id="uuid-1", part_name="第1バイオリン", priority=100) # 最大値
    
    def test_player_creation(self):
        """Playerの作成テスト"""
        player = Player(
            id=1,
            name="テストプレイヤー",
            part_assignments=[
                PartAssignment(part_id="part_a", part_name="第1バイオリン", priority=90),
                PartAssignment(part_id="part_b", part_name="第2バイオリン", priority=30)
            ],
            is_instructor=False
        )
        
        assert player.id == 1
        assert player.name == "テストプレイヤー"
        assert len(player.part_assignments) == 2
        assert not player.is_instructor
        
        # パートIDの確認
        assert player.part_ids == ["part_a", "part_b"]


class TestProblemCreation:
    """問題作成のテスト"""
    
    def test_simple_problem_structure(self):
        """シンプル問題の構造テスト"""
        problem = create_simple_test_problem()
        
        # 基本データの確認
        assert len(problem.players) == 3
        assert len(problem.rooms) == 2
        assert len(problem.time_slots) == 2
        assert len(problem.parts) == 2
        
        # 指導者数の確認
        instructors = [p for p in problem.players if p.is_instructor]
        assert len(instructors) == 1
        
        # 一般プレイヤー数の確認
        regular_players = [p for p in problem.players if not p.is_instructor]
        assert len(regular_players) == 2
    
    def test_player_part_assignments(self):
        """プレイヤーのパート割り当てテスト"""
        problem = create_simple_test_problem()
        
        # 指導者のパート割り当て確認
        instructor = next(p for p in problem.players if p.is_instructor)
        assert len(instructor.part_assignments) == 2
        assert instructor.part_assignments[0].part_id == "part_a"
        assert instructor.part_assignments[0].priority == 80
        assert instructor.part_assignments[1].part_id == "part_b"
        assert instructor.part_assignments[1].priority == 60
        
        # パートIDの確認
        assert instructor.part_ids == ["part_a", "part_b"]
    
    def test_data_validation(self):
        """データ検証テスト"""
        problem = create_simple_test_problem()
        
        # 問題の基本構造確認
        assert problem.players is not None
        assert problem.rooms is not None
        assert problem.time_slots is not None
        assert problem.parts is not None
        
        # プレイヤーのパート割り当て確認
        for player in problem.players:
            assert len(player.part_assignments) > 0
            for assignment in player.part_assignments:
                assert 0 <= assignment.priority <= 100
                # パートIDが問題のパートリストに含まれているか確認
                part_ids = [part["id"] for part in problem.parts]
                assert assignment.part_id in part_ids


if __name__ == "__main__":
    # 基本的なテスト実行
    data_test = TestDataModels()
    problem_test = TestProblemCreation()
    
    print("=== 最適化システムテスト ===")
    
    # データモデルテスト
    try:
        data_test.test_part_assignment_creation()
        data_test.test_part_assignment_validation()
        data_test.test_player_creation()
        print("✅ データモデルテスト: 成功")
    except Exception as e:
        print(f"❌ データモデルテスト: 失敗 - {e}")
    
    # 問題作成テスト
    try:
        problem_test.test_simple_problem_structure()
        problem_test.test_player_part_assignments()
        problem_test.test_data_validation()
        print("✅ 問題作成テスト: 成功")
    except Exception as e:
        print(f"❌ 問題作成テスト: 失敗 - {e}")
    
    print("\n=== テスト完了 ===")


class TestPriorityCalculation:
    """優先度計算のテスト"""
    
    def test_mai_category_bonus(self):
        """舞カテゴリボーナスのテスト"""
        test_data = create_test_data_with_categories()
        
        # 舞カテゴリの優先度ボーナスを確認
        expected = test_data["expected_priorities"]
        assert expected["user_1_mai"] == 50 + PriorityConfig.MAI_CATEGORY_BONUS
        assert expected["user_1_utai"] == 30  # ボーナスなし
        print("✅ 舞カテゴリボーナステスト: 成功")
    
    def test_attendance_filtering(self):
        """出席フィルタリングのテスト"""
        test_data = create_test_data_with_categories()
        attendance_data = test_data["attendance"]
        
        # 出席確定ユーザーのみが含まれることを確認
        filtered_users = []
        for attendance in attendance_data:
            if attendance["status"] in PriorityConfig.ATTENDANCE_REQUIRED_STATUSES:
                filtered_users.append(attendance["user_id"])
        
        expected_filtered = test_data["expected_filtered_users"]
        assert set(filtered_users) == set(expected_filtered)
        assert "user_3" not in filtered_users  # 欠席ユーザーは除外
        print("✅ 出席フィルタリングテスト: 成功")
    
    def test_priority_range(self):
        """優先度範囲のテスト"""
        test_data = create_test_data_with_categories()
        expected = test_data["expected_priorities"]
        
        # 全ての優先度が0-130の範囲内であることを確認
        for key, priority in expected.items():
            assert 0 <= priority <= 130, f"{key}の優先度が範囲外: {priority}"
        print("✅ 優先度範囲テスト: 成功")


if __name__ == "__main__":
    print("=== 最適化システムテスト実行 ===\n")
    
    data_test = TestDataModels()
    problem_test = TestProblemCreation()
    priority_test = TestPriorityCalculation()
    
    # データモデルテスト
    try:
        data_test.test_part_assignment_creation()
        data_test.test_part_assignment_validation()
        data_test.test_player_creation()
        print("✅ データモデルテスト: 成功")
    except Exception as e:
        print(f"❌ データモデルテスト: 失敗 - {e}")
    
    # 問題作成テスト
    try:
        problem_test.test_simple_problem_structure()
        problem_test.test_player_part_assignments()
        problem_test.test_data_validation()
        print("✅ 問題作成テスト: 成功")
    except Exception as e:
        print(f"❌ 問題作成テスト: 失敗 - {e}")
    
    # 優先度計算テスト
    try:
        priority_test.test_mai_category_bonus()
        priority_test.test_attendance_filtering()
        priority_test.test_priority_range()
        print("✅ 優先度計算テスト: 成功")
    except Exception as e:
        print(f"❌ 優先度計算テスト: 失敗 - {e}")
    
    print("\n=== テスト完了 ===")
