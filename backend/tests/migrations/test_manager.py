"""
MigrationManagerクラスのテスト

TDD方針に従い、期待される動作を定義するテストを作成します。
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import os
import tempfile
from typing import List, Dict, Any

import pytest

from migrations.config import MigrationConfig
from migrations.manager import MigrationManager, MigrationFile, MigrationResult
from migrations.history import HistoryManager, MigrationRecord


class TestMigrationManager(unittest.TestCase):
    """MigrationManagerクラスのテスト"""

    def setUp(self) -> None:
        """テスト準備"""
        self.config = MigrationConfig(environment="test")
        self.mock_history = Mock(spec=HistoryManager)
        self.manager = MigrationManager(self.config)
        self.manager.history = self.mock_history

    def tearDown(self) -> None:
        """テスト後処理"""
        pass

    def test_discover_migrations(self) -> None:
        """マイグレーションファイル検出のテスト"""
        # Arrange: テスト用のマイグレーションファイルを模擬
        expected_files = [
            "20250101000000_create_users.sql",
            "20250102000000_add_user_roles.sql",
            "20250103000000_create_departments.sql"
        ]
        
        with patch('os.listdir') as mock_listdir:
            mock_listdir.return_value = expected_files + ["not_migration.txt", "__pycache__"]
            
            # Act: マイグレーションファイルを検出
            migrations = self.manager.discover_migrations()
            
            # Assert: 期待される結果を検証
            self.assertEqual(len(migrations), 3)
            self.assertIsInstance(migrations[0], MigrationFile)
            self.assertEqual(migrations[0].filename, expected_files[0])
            self.assertEqual(migrations[1].filename, expected_files[1])
            self.assertEqual(migrations[2].filename, expected_files[2])

    def test_run_migrations_success(self) -> None:
        """マイグレーション実行成功時のテスト"""
        # Arrange: テスト用のマイグレーションファイルを準備
        migration_file = MigrationFile("20250101000000_create_users.sql")
        migration_file.content = "CREATE TABLE users (id SERIAL PRIMARY KEY);"
        
        with patch.object(self.manager, 'discover_migrations') as mock_discover:
            mock_discover.return_value = [migration_file]
            self.mock_history.is_applied.return_value = False
            
            with patch.object(self.manager, '_execute_migration') as mock_execute:
                mock_execute.return_value = True
                
                # Act: マイグレーションを実行
                result = self.manager.run_migrations()
                
                # Assert: 期待される結果を検証
                self.assertIsInstance(result, MigrationResult)
                self.assertTrue(result.success)
                self.assertEqual(result.applied_count, 1)
                self.mock_history.record_migration.assert_called_once()

    def test_run_migrations_with_target_version(self) -> None:
        """特定バージョンまでのマイグレーション実行テスト"""
        # Arrange: 複数のマイグレーションファイルを準備
        migrations = [
            MigrationFile("20250101000000_create_users.sql"),
            MigrationFile("20250102000000_add_user_roles.sql"),
            MigrationFile("20250103000000_create_departments.sql")
        ]
        target_version = "20250102000000"
        
        with patch.object(self.manager, 'discover_migrations') as mock_discover:
            mock_discover.return_value = migrations
            self.mock_history.is_applied.return_value = False
            
            with patch.object(self.manager, '_execute_migration') as mock_execute:
                mock_execute.return_value = True
                
                # Act: 特定バージョンまでマイグレーションを実行
                result = self.manager.run_migrations(target_version=target_version)
                
                # Assert: 期待される結果を検証
                self.assertTrue(result.success)
                self.assertEqual(result.applied_count, 2)  # 最初の2つのみ実行

    def test_verify_migrations(self) -> None:
        """マイグレーション検証のテスト"""
        # Arrange: 問題のあるマイグレーションファイルを準備
        migration_with_issue = MigrationFile("20250101000000_invalid.sql")
        migration_with_issue.content = "INVALID SQL SYNTAX"
        
        with patch.object(self.manager, 'discover_migrations') as mock_discover:
            mock_discover.return_value = [migration_with_issue]
            
            # Act: マイグレーションを検証
            issues = self.manager.verify_migrations()
            
            # Assert: 問題が検出されることを検証
            self.assertGreater(len(issues), 0)
            self.assertIn("syntax", issues[0].message.lower())

    def test_rollback(self) -> None:
        """ロールバック実行のテスト"""
        # Arrange: 適用済みマイグレーションの履歴を準備
        last_migration = MigrationRecord({
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": True,
            "applied_at": datetime.now(),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        })
        self.mock_history.get_last_applied_migration.return_value = last_migration
        
        with patch.object(self.manager, '_execute_rollback') as mock_rollback:
            mock_rollback.return_value = True
            
            # Act: ロールバックを実行
            result = self.manager.rollback(steps=1)
            
            # Assert: 期待される結果を検証
            self.assertTrue(result.success)
            self.assertEqual(result.rolled_back_count, 1)

    def test_rollback_to_version(self) -> None:
        """特定バージョンまでのロールバックテスト"""
        # Arrange: 複数の適用済みマイグレーション履歴を準備
        migrations_history = [
            MigrationRecord({
                "migration_id": "20250103000000",
                "version": "20250103000000", 
                "name": "create_departments",
                "success": True,
                "applied_at": datetime.now(),
                "checksum": "def456",
                "applied_by": "test_user",
                "duration_ms": 150
            }),
            MigrationRecord({
                "migration_id": "20250102000000",
                "version": "20250102000000",
                "name": "add_user_roles", 
                "success": True,
                "applied_at": datetime.now(),
                "checksum": "ghi789",
                "applied_by": "test_user",
                "duration_ms": 120
            })
        ]
        self.mock_history.get_migration_history.return_value = migrations_history
        target_version = "20250102000000"
        
        with patch.object(self.manager, '_execute_rollback') as mock_rollback:
            mock_rollback.return_value = True
            
            # Act: 特定バージョンまでロールバック
            result = self.manager.rollback_to(target_version)
            
            # Assert: 期待される結果を検証
            self.assertTrue(result.success)
            self.assertEqual(result.rolled_back_count, 1)  # 1つだけロールバック

    def test_get_current_version(self) -> None:
        """現在バージョン取得のテスト"""
        # Arrange: 最新の適用済みマイグレーションを準備
        last_migration = MigrationRecord({
            "migration_id": "20250103000000",
            "version": "20250103000000",
            "name": "create_departments",
            "success": True,
            "applied_at": datetime.now(),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        })
        self.mock_history.get_last_applied_migration.return_value = last_migration
        
        # Act: 現在のバージョンを取得
        current_version = self.manager.get_current_version()
        
        # Assert: 期待される結果を検証
        self.assertEqual(current_version, "20250103000000")

    def test_create_migration(self) -> None:
        """マイグレーションファイル作成のテスト"""
        # Arrange: 作成するマイグレーション名を準備
        migration_name = "add_user_profiles"
        
        with patch('builtins.open', unittest.mock.mock_open()) as mock_file:
            with patch('os.path.exists') as mock_exists:
                mock_exists.return_value = False
                
                # Act: マイグレーションファイルを作成
                migration_file = self.manager.create_migration(migration_name)
                
                # Assert: 期待される結果を検証
                self.assertIsInstance(migration_file, MigrationFile)
                self.assertIn(migration_name, migration_file.filename)
                self.assertTrue(migration_file.filename.endswith('.sql'))
                mock_file.assert_called_once()

    def test_error_handling(self) -> None:
        """エラー処理のテスト"""
        # Arrange: エラーが発生するマイグレーションを準備
        migration_file = MigrationFile("20250101000000_error_test.sql")
        migration_file.content = "INVALID SQL;"
        
        with patch.object(self.manager, 'discover_migrations') as mock_discover:
            mock_discover.return_value = [migration_file]
            self.mock_history.is_applied.return_value = False
            
            with patch.object(self.manager, '_execute_migration') as mock_execute:
                mock_execute.side_effect = Exception("SQL execution error")
                
                with patch.object(self.manager, '_handle_migration_error') as mock_error_handler:
                    # Act: エラーが発生するマイグレーションを実行
                    result = self.manager.run_migrations()
                    
                    # Assert: エラー処理が呼ばれることを検証
                    mock_error_handler.assert_called_once()
                    self.assertFalse(result.success)
                    self.assertIn("error", result.error_message.lower())


class TestMigrationFile(unittest.TestCase):
    """MigrationFileクラスのテスト"""

    def test_migration_file_creation(self) -> None:
        """マイグレーションファイル作成のテスト"""
        # Arrange & Act: マイグレーションファイルを作成
        filename = "20250101000000_create_users.sql"
        migration_file = MigrationFile(filename)
        
        # Assert: 期待される属性が設定されることを検証
        self.assertEqual(migration_file.filename, filename)
        self.assertEqual(migration_file.version, "20250101000000")
        self.assertEqual(migration_file.name, "create_users")
        self.assertIsInstance(migration_file.created_at, datetime)

    def test_load_content(self) -> None:
        """ファイル内容読み込みのテスト"""
        # Arrange: テスト用のSQLファイル内容を準備
        test_content = "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));"
        
        with patch('builtins.open', unittest.mock.mock_open(read_data=test_content)):
            # Act: ファイル内容を読み込み
            migration_file = MigrationFile("20250101000000_create_users.sql")
            content = migration_file.load_content()
            
            # Assert: 期待される内容が読み込まれることを検証
            self.assertEqual(content, test_content)
            self.assertEqual(migration_file.content, test_content)

    def test_get_checksum(self) -> None:
        """チェックサム計算のテスト"""
        # Arrange: テスト用のファイル内容を準備
        migration_file = MigrationFile("20250101000000_create_users.sql")
        migration_file.content = "CREATE TABLE users (id SERIAL PRIMARY KEY);"
        
        # Act: チェックサムを計算
        checksum1 = migration_file.get_checksum()
        checksum2 = migration_file.get_checksum()
        
        # Assert: 同じ内容には同じチェックサムが生成されることを検証
        self.assertEqual(checksum1, checksum2)
        self.assertIsInstance(checksum1, str)
        self.assertGreater(len(checksum1), 0)


class TestMigrationResult(unittest.TestCase):
    """MigrationResultクラスのテスト"""

    def test_migration_result_success(self) -> None:
        """成功時のマイグレーション結果テスト"""
        # Arrange & Act: 成功結果を作成
        result = MigrationResult(
            success=True,
            applied_count=3,
            rolled_back_count=0,
            error_message=None
        )
        
        # Assert: 期待される属性が設定されることを検証
        self.assertTrue(result.success)
        self.assertEqual(result.applied_count, 3)
        self.assertEqual(result.rolled_back_count, 0)
        self.assertIsNone(result.error_message)

    def test_migration_result_failure(self) -> None:
        """失敗時のマイグレーション結果テスト"""
        # Arrange & Act: 失敗結果を作成
        error_msg = "SQL syntax error in migration file"
        result = MigrationResult(
            success=False,
            applied_count=1,
            rolled_back_count=0,
            error_message=error_msg
        )
        
        # Assert: 期待される属性が設定されることを検証
        self.assertFalse(result.success)
        self.assertEqual(result.applied_count, 1)
        self.assertEqual(result.error_message, error_msg)


if __name__ == "__main__":
    unittest.main()