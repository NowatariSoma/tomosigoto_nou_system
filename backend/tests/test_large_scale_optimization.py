"""
大規模最適化テスト
20パート、5部屋、60人（指導者10人）での最適化性能テスト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tests.fixtures.large_scale_test_data import create_large_scale_test_problem
from app.services.optimization.optimizer import SchedulingOptimizer
from app.services.optimization.constants import SchedulingConfig
import time


def test_large_scale_optimization():
    """大規模データでの最適化テスト"""
    print("=== 大規模最適化テスト開始 ===")
    
    # テストデータ作成
    print("1. テストデータ作成中...")
    problem = create_large_scale_test_problem()
    print(f"   - パート数: {len(problem.parts)}")
    print(f"   - 部屋数: {len(problem.rooms)}")
    print(f"   - 時間コマ数: {len(problem.time_slots)}")
    print(f"   - 総プレイヤー数: {len(problem.players)}")
    print(f"   - 指導者数: {len([p for p in problem.players if p.is_instructor])}")
    
    # 最適化実行
    print("\n2. 最適化実行中...")
    optimizer = SchedulingOptimizer(problem)
    
    start_time = time.time()
    solution = optimizer.solve(
        time_limit_seconds=60,  # 60秒制限
        equality_weight=100
    )
    solve_time = time.time() - start_time
    
    if solution:
        print(f"   ✅ 最適化成功！")
        print(f"   - 解決時間: {solve_time:.2f}秒")
        print(f"   - 最適解: {solution.is_optimal}")
        print(f"   - 目的関数値: {solution.objective_value}")
        print(f"   - 作成セッション数: {len(solution.sessions)}")
        
        # セッション分布
        print(f"\n3. セッション分布:")
        part_distribution = solution.get_part_distribution()
        instructor_distribution = solution.get_instructor_distribution()
        
        print(f"   - パート別セッション数:")
        for part_id, count in part_distribution.items():
            part_name = next((p["name"] for p in problem.parts if p["id"] == part_id), part_id)
            print(f"     {part_name}: {count}セッション")
        
        print(f"   - 指導者別セッション数:")
        for instructor_id, count in instructor_distribution.items():
            instructor_name = next((p.name for p in problem.players if p.id == instructor_id), f"指導者{instructor_id}")
            print(f"     {instructor_name}: {count}セッション")
        
        # 時間割表示
        print(f"\n4. 時間割:")
        schedule_matrix = solution.get_schedule_matrix()
        for time_slot_id in sorted(schedule_matrix.keys()):
            print(f"   {time_slot_id}限目:")
            for room_id in sorted(schedule_matrix[time_slot_id].keys()):
                sessions = schedule_matrix[time_slot_id][room_id]
                if sessions:
                    for session in sessions:
                        part_name = next((p["name"] for p in problem.parts if p["id"] == session.part_id), session.part_id)
                        instructor_name = next((p.name for p in problem.players if p.id == session.instructor_id), f"指導者{session.instructor_id}")
                        print(f"     部屋{room_id}: {part_name} (指導者: {instructor_name})")
                else:
                    print(f"     部屋{room_id}: 空き")
        
        return True
    else:
        print(f"   ❌ 最適化失敗")
        print(f"   - 解決時間: {solve_time:.2f}秒")
        return False


def test_performance_benchmark():
    """性能ベンチマークテスト"""
    print("\n=== 性能ベンチマーク ===")
    
    problem = create_large_scale_test_problem()
    optimizer = SchedulingOptimizer(problem)
    
    time_limits = [10, 30, 60, 120]  # 秒
    
    for time_limit in time_limits:
        print(f"\n時間制限: {time_limit}秒")
        start_time = time.time()
        
        solution = optimizer.solve(
            time_limit_seconds=time_limit,
            equality_weight=100
        )
        
        solve_time = time.time() - start_time
        
        if solution:
            print(f"  ✅ 成功 - 解決時間: {solve_time:.2f}秒, セッション数: {len(solution.sessions)}")
        else:
            print(f"  ❌ 失敗 - 解決時間: {solve_time:.2f}秒")


if __name__ == "__main__":
    print("大規模最適化システムテスト")
    print("=" * 50)
    
    # 基本テスト
    success = test_large_scale_optimization()
    
    if success:
        # 性能ベンチマーク
        test_performance_benchmark()
    
    print("\n=== テスト完了 ===")
