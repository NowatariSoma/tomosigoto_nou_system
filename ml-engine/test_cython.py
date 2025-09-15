#!/usr/bin/env python3
"""
Cythonモジュールのテストスクリプト
"""

import numpy as np
from src.utils.simple_cython import (
    fast_matrix_sum_3d,
    fast_matrix_sum_2d,
    fast_array_sum,
    fast_completion_rate,
    fast_action_decomposition,
    fast_action_validation,
    fast_schedule_update,
    fast_reward_calculation,
    fast_observation_concat
)

def test_matrix_operations():
    """行列演算のテスト"""
    print("=== 行列演算のテスト ===")
    
    # 3次元行列のテスト
    matrix_3d = np.random.random((3, 4, 5))
    result_3d = fast_matrix_sum_3d(matrix_3d)
    expected_3d = np.sum(matrix_3d)
    print(f"3D Matrix sum: {result_3d} (expected: {expected_3d})")
    print(f"3D Matrix test: {'PASS' if abs(result_3d - expected_3d) < 1e-10 else 'FAIL'}")
    
    # 2次元行列のテスト
    matrix_2d = np.random.random((4, 5))
    result_2d = fast_matrix_sum_2d(matrix_2d)
    expected_2d = np.sum(matrix_2d)
    print(f"2D Matrix sum: {result_2d} (expected: {expected_2d})")
    print(f"2D Matrix test: {'PASS' if abs(result_2d - expected_2d) < 1e-10 else 'FAIL'}")
    
    # 1次元配列のテスト
    array_1d = np.random.random(10)
    result_1d = fast_array_sum(array_1d)
    expected_1d = np.sum(array_1d)
    print(f"1D Array sum: {result_1d} (expected: {expected_1d})")
    print(f"1D Array test: {'PASS' if abs(result_1d - expected_1d) < 1e-10 else 'FAIL'}")

def test_completion_rate():
    """完了率計算のテスト"""
    print("\n=== 完了率計算のテスト ===")
    
    completed = np.array([1, 0, 1, 1, 0, 1, 0, 1, 1, 0])
    rate = fast_completion_rate(completed, 10)
    expected_rate = 6.0 / 10.0
    print(f"Completion rate: {rate} (expected: {expected_rate})")
    print(f"Completion rate test: {'PASS' if abs(rate - expected_rate) < 1e-10 else 'FAIL'}")

def test_action_operations():
    """行動操作のテスト"""
    print("\n=== 行動操作のテスト ===")
    
    # 行動分解のテスト
    action = 42
    max_scenes = 5
    max_rooms = 3
    timeslot, scene, room = fast_action_decomposition(action, max_scenes, max_rooms)
    print(f"Action {action} -> Timeslot: {timeslot}, Scene: {scene}, Room: {room}")
    
    # 行動有効性チェックのテスト
    is_valid = fast_action_validation(action, 4, 5, 3, 4, 5, 3)
    print(f"Action {action} validity: {is_valid}")
    
    # スケジュール更新のテスト
    schedule = np.zeros((4, 5, 3))
    updated_schedule = fast_schedule_update(schedule, action, max_scenes, max_rooms)
    print(f"Schedule updated at [{timeslot}, {scene}, {room}]: {updated_schedule[timeslot, scene, room]}")

def test_reward_calculation():
    """報酬計算のテスト"""
    print("\n=== 報酬計算のテスト ===")
    
    reward = fast_reward_calculation(0.8, 10, 100)
    print(f"Reward for completion_rate=0.8, step=10, max_steps=100: {reward}")
    
    reward2 = fast_reward_calculation(0.5, 60, 100)
    print(f"Reward for completion_rate=0.5, step=60, max_steps=100: {reward2}")

def test_observation_concat():
    """観測連結のテスト"""
    print("\n=== 観測連結のテスト ===")
    
    schedule = np.random.random((2, 3, 2))
    people = np.random.random((5, 4))
    completed_scenes = np.array([1, 0, 1])
    completed_rooms = np.array([1, 0])
    
    obs = fast_observation_concat(
        schedule, people, completed_scenes, completed_rooms,
        0.5, 0.6, 0.4, 0.8
    )
    
    print(f"Observation shape: {obs.shape}")
    print(f"Observation size: {len(obs)}")
    expected_size = 2*3*2 + 5*4 + 3 + 2 + 4
    print(f"Expected size: {expected_size}")
    print(f"Observation concat test: {'PASS' if len(obs) == expected_size else 'FAIL'}")

def performance_test():
    """性能テスト"""
    print("\n=== 性能テスト ===")
    
    import time
    
    # 大きな行列での性能テスト
    large_matrix = np.random.random((100, 100, 100))
    
    # Python版
    start_time = time.time()
    python_result = np.sum(large_matrix)
    python_time = time.time() - start_time
    
    # Cython版
    start_time = time.time()
    cython_result = fast_matrix_sum_3d(large_matrix)
    cython_time = time.time() - start_time
    
    print(f"Python time: {python_time:.6f}s")
    print(f"Cython time: {cython_time:.6f}s")
    print(f"Speedup: {python_time / cython_time:.2f}x")
    
    # 結果の比較（浮動小数点の精度を考慮）
    tolerance = 1e-10
    results_match = abs(python_result - cython_result) < tolerance
    print(f"Results match: {'PASS' if results_match else 'FAIL'}")
    print(f"Python result: {python_result}")
    print(f"Cython result: {cython_result}")
    print(f"Difference: {abs(python_result - cython_result)}")

def benchmark_test():
    """ベンチマークテスト"""
    print("\n=== ベンチマークテスト ===")
    
    import time
    
    # より大きな行列でテスト
    sizes = [50, 100, 200]
    
    for size in sizes:
        print(f"\nMatrix size: {size}x{size}x{size}")
        matrix = np.random.random((size, size, size))
        
        # Python版
        start_time = time.time()
        python_result = np.sum(matrix)
        python_time = time.time() - start_time
        
        # Cython版
        start_time = time.time()
        cython_result = fast_matrix_sum_3d(matrix)
        cython_time = time.time() - start_time
        
        speedup = python_time / cython_time
        print(f"  Python: {python_time:.6f}s")
        print(f"  Cython: {cython_time:.6f}s")
        print(f"  Speedup: {speedup:.2f}x")
        
        # 結果の検証
        tolerance = 1e-10
        if abs(python_result - cython_result) < tolerance:
            print(f"  Result: PASS")
        else:
            print(f"  Result: FAIL (diff: {abs(python_result - cython_result)})")

if __name__ == "__main__":
    print("Cythonモジュールのテストを開始します...")
    
    try:
        test_matrix_operations()
        test_completion_rate()
        test_action_operations()
        test_reward_calculation()
        test_observation_concat()
        performance_test()
        benchmark_test()
        
        print("\n🎉 すべてのテストが完了しました！")
        
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
