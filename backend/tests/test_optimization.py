"""
最適化システムのテスト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from fixtures.optimization_test_data import create_simple_test_problem
from app.services.optimization.models import PartType, PartAssignment, Player


class TestDataModels:
    """データモデルのテスト"""
    
    def test_part_assignment_creation(self):
        """PartAssignmentの作成テスト"""
        assignment = PartAssignment(PartType.A, 80)
        assert assignment.part == PartType.A
        assert assignment.priority == 80
    
    def test_part_assignment_validation(self):
        """PartAssignmentのバリデーションテスト"""
        # 正常な範囲
        assignment = PartAssignment(PartType.A, 50)
        assert 0 <= assignment.priority <= 100
        
        # 境界値テスト
        PartAssignment(PartType.A, 0)   # 最小値
        PartAssignment(PartType.A, 100) # 最大値
    
    def test_player_creation(self):
        """Playerの作成テスト"""
        player = Player(
            id=1,
            name="テストプレイヤー",
            part_assignments=[
                PartAssignment(PartType.A, 90),
                PartAssignment(PartType.B, 30)
            ],
            is_instructor=False
        )
        
        assert player.id == 1
        assert player.name == "テストプレイヤー"
        assert len(player.part_assignments) == 2
        assert not player.is_instructor
        
        # 後方互換性の確認
        assert player.parts == [PartType.A, PartType.B]


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
        assert instructor.part_assignments[0].part == PartType.A
        assert instructor.part_assignments[0].priority == 80
        assert instructor.part_assignments[1].part == PartType.B
        assert instructor.part_assignments[1].priority == 60
        
        # 後方互換性の確認
        assert instructor.parts == [PartType.A, PartType.B]
    
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
                assert assignment.part in problem.parts


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
