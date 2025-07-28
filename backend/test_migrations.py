#!/usr/bin/env python3
"""
マイグレーションシステム簡易テストランナー

TDD方針に従い、作成したテストを実行します。
"""
import sys
import unittest
from pathlib import Path

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, str(Path(__file__).parent))

# テストモジュールをインポート
try:
    from tests.migrations.test_manager import TestMigrationManager, TestMigrationFile, TestMigrationResult
    from tests.migrations.test_history import TestHistoryManager, TestMigrationRecord
    from tests.migrations.test_version import TestVersionUtil
    print("✓ すべてのテストモジュールのインポートが成功しました")
except ImportError as e:
    print(f"✗ テストモジュールのインポートに失敗しました: {e}")
    sys.exit(1)

def run_tests():
    """テストを実行"""
    # テストスイートを作成
    test_suite = unittest.TestSuite()
    
    # 各テストクラスを追加
    test_classes = [
        TestMigrationManager,
        TestMigrationFile, 
        TestMigrationResult,
        TestHistoryManager,
        TestMigrationRecord,
        TestVersionUtil
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # テストを実行
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # 結果を表示
    print(f"\n=== テスト実行結果 ===")
    print(f"実行テスト数: {result.testsRun}")
    print(f"失敗: {len(result.failures)}")
    print(f"エラー: {len(result.errors)}")
    
    if result.failures:
        print("\n失敗したテスト:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")
    
    if result.errors:
        print("\nエラーが発生したテスト:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")
    
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    print("マイグレーションシステムテスト実行中...")
    sys.exit(run_tests())