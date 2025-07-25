"""
HistoryManagerクラスのテスト

TDD方針に従い、マイグレーション履歴管理の期待される動作を定義するテストを作成します。
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from typing import List, Dict, Any

import pytest

from migrations.config import MigrationConfig
from migrations.history import HistoryManager, MigrationRecord
from migrations.manager import MigrationFile


class TestHistoryManager(unittest.TestCase):
    """HistoryManagerクラスのテスト"""

    def setUp(self) -> None:
        """テスト準備"""
        self.config = MigrationConfig(environment="test")
        self.mock_connection = Mock()
        self.history_manager = HistoryManager(self.config)
        self.history_manager.connection = self.mock_connection

    def tearDown(self) -> None:
        """テスト後処理"""
        pass

    def test_initialize_history_table(self) -> None:
        """履歴テーブル初期化のテスト"""
        # Arrange: モックの設定
        self.mock_connection.execute.return_value = True
        
        # Act: 履歴テーブルを初期化
        result = self.history_manager.initialize_history_table()
        
        # Assert: 期待される結果を検証
        self.assertTrue(result)
        self.mock_connection.execute.assert_called()
        # テーブル作成SQLが実行されることを確認
        call_args = self.mock_connection.execute.call_args[0][0]
        self.assertIn("CREATE TABLE", call_args.upper())
        self.assertIn("migration_history".upper(), call_args.upper())

    def test_record_migration_success(self) -> None:
        """マイグレーション記録成功のテスト"""
        # Arrange: テスト用のマイグレーションファイルを準備
        migration_file = MigrationFile("20250101000000_create_users.sql")
        migration_file.content = "CREATE TABLE users (id SERIAL PRIMARY KEY);"
        migration_file.version = "20250101000000"
        migration_file.name = "create_users"
        
        self.mock_connection.execute.return_value = True
        
        # Act: マイグレーションの成功を記録
        result = self.history_manager.record_migration(migration_file, success=True)
        
        # Assert: 期待される結果を検証
        self.assertTrue(result)
        self.mock_connection.execute.assert_called()
        # INSERT文が実行されることを確認
        call_args = self.mock_connection.execute.call_args[0][0]
        self.assertIn("INSERT", call_args.upper())
        self.assertIn("migration_history".upper(), call_args.upper())

    def test_record_migration_failure(self) -> None:
        """マイグレーション記録失敗のテスト"""
        # Arrange: テスト用のマイグレーションファイルを準備
        migration_file = MigrationFile("20250101000000_create_users.sql")
        migration_file.content = "INVALID SQL SYNTAX"
        migration_file.version = "20250101000000"
        migration_file.name = "create_users"
        
        self.mock_connection.execute.return_value = True
        
        # Act: マイグレーションの失敗を記録
        result = self.history_manager.record_migration(migration_file, success=False)
        
        # Assert: 期待される結果を検証
        self.assertTrue(result)
        self.mock_connection.execute.assert_called()
        # 失敗レコードが記録されることを確認
        call_args = self.mock_connection.execute.call_args[0]
        self.assertIn("INSERT", call_args[0].upper())

    def test_get_migration_history(self) -> None:
        """マイグレーション履歴取得のテスト"""
        # Arrange: テスト用の履歴データを準備
        mock_records = [
            {
                "migration_id": "20250101000000",
                "version": "20250101000000",
                "name": "create_users",
                "success": True,
                "applied_at": datetime(2025, 1, 1, 10, 0, 0),
                "checksum": "abc123",
                "applied_by": "test_user",
                "duration_ms": 100
            },
            {
                "migration_id": "20250102000000",
                "version": "20250102000000",
                "name": "add_user_roles",
                "success": True,
                "applied_at": datetime(2025, 1, 2, 11, 0, 0),
                "checksum": "def456",
                "applied_by": "test_user",
                "duration_ms": 150
            }
        ]
        
        # モックカーソルの設定
        mock_cursor = Mock()
        mock_cursor.fetchall.return_value = mock_records
        self.mock_connection.execute.return_value = mock_cursor
        
        # Act: マイグレーション履歴を取得
        history = self.history_manager.get_migration_history()
        
        # Assert: 期待される結果を検証
        self.assertEqual(len(history), 2)
        self.assertIsInstance(history[0], MigrationRecord)
        self.assertIsInstance(history[1], MigrationRecord)
        self.assertEqual(history[0].migration_id, "20250101000000")
        self.assertEqual(history[1].migration_id, "20250102000000")
        self.assertTrue(history[0].success)
        self.assertTrue(history[1].success)

    def test_get_last_applied_migration(self) -> None:
        """最新適用マイグレーション取得のテスト"""
        # Arrange: テスト用の最新マイグレーションデータを準備
        mock_record = {
            "migration_id": "20250103000000",
            "version": "20250103000000",
            "name": "create_departments",
            "success": True,
            "applied_at": datetime(2025, 1, 3, 12, 0, 0),
            "checksum": "ghi789",
            "applied_by": "test_user",
            "duration_ms": 200
        }
        
        # モックカーソルの設定
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = mock_record
        self.mock_connection.execute.return_value = mock_cursor
        
        # Act: 最新の適用済みマイグレーションを取得
        last_migration = self.history_manager.get_last_applied_migration()
        
        # Assert: 期待される結果を検証
        self.assertIsInstance(last_migration, MigrationRecord)
        self.assertEqual(last_migration.migration_id, "20250103000000")
        self.assertEqual(last_migration.name, "create_departments")
        self.assertTrue(last_migration.success)
        
        # ORDER BY applied_at DESC LIMIT 1 が使用されることを確認
        call_args = self.mock_connection.execute.call_args[0][0]
        self.assertIn("ORDER BY", call_args.upper())
        self.assertIn("DESC", call_args.upper())
        self.assertIn("LIMIT 1", call_args.upper())

    def test_get_last_applied_migration_no_records(self) -> None:
        """履歴が存在しない場合の最新マイグレーション取得テスト"""
        # Arrange: 空の結果を返すモックを設定
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = None
        self.mock_connection.execute.return_value = mock_cursor
        
        # Act: 最新の適用済みマイグレーションを取得
        last_migration = self.history_manager.get_last_applied_migration()
        
        # Assert: Noneが返されることを検証
        self.assertIsNone(last_migration)

    def test_is_applied(self) -> None:
        """マイグレーション適用済み確認のテスト"""
        # Arrange: 適用済みマイグレーションIDを準備
        migration_id = "20250101000000"
        
        # モックカーソルの設定（適用済み）
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = {"count": 1}
        self.mock_connection.execute.return_value = mock_cursor
        
        # Act: マイグレーションが適用済みかチェック
        is_applied = self.history_manager.is_applied(migration_id)
        
        # Assert: 適用済みであることを検証
        self.assertTrue(is_applied)
        
        # 正しいSQLが実行されることを確認
        call_args = self.mock_connection.execute.call_args[0][0]
        self.assertIn("SELECT COUNT", call_args.upper())
        self.assertIn("WHERE", call_args.upper())
        self.assertIn("migration_id", call_args)

    def test_is_applied_not_applied(self) -> None:
        """未適用マイグレーション確認のテスト"""
        # Arrange: 未適用マイグレーションIDを準備
        migration_id = "20250199000000"
        
        # モックカーソルの設定（未適用）
        mock_cursor = Mock()
        mock_cursor.fetchone.return_value = {"count": 0}
        self.mock_connection.execute.return_value = mock_cursor
        
        # Act: マイグレーションが適用済みかチェック
        is_applied = self.history_manager.is_applied(migration_id)
        
        # Assert: 未適用であることを検証
        self.assertFalse(is_applied)

    def test_clear_history(self) -> None:
        """履歴クリアのテスト"""
        # Arrange: モックの設定
        self.mock_connection.execute.return_value = True
        
        # Act: 履歴をクリア
        result = self.history_manager.clear_history()
        
        # Assert: 期待される結果を検証
        self.assertTrue(result)
        self.mock_connection.execute.assert_called()
        
        # DELETE文が実行されることを確認
        call_args = self.mock_connection.execute.call_args[0][0]
        self.assertIn("DELETE", call_args.upper())
        self.assertIn("migration_history".upper(), call_args.upper())

    def test_format_record(self) -> None:
        """レコード整形のテスト"""
        # Arrange: テスト用の生データを準備
        raw_record = {
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": True,
            "applied_at": datetime(2025, 1, 1, 10, 0, 0),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        }
        
        # Act: レコードを整形
        formatted_record = self.history_manager._format_record(raw_record)
        
        # Assert: 期待される結果を検証
        self.assertIsInstance(formatted_record, MigrationRecord)
        self.assertEqual(formatted_record.migration_id, "20250101000000")
        self.assertEqual(formatted_record.name, "create_users")
        self.assertTrue(formatted_record.success)
        self.assertEqual(formatted_record.duration_ms, 100)


class TestMigrationRecord(unittest.TestCase):
    """MigrationRecordクラスのテスト"""

    def test_migration_record_creation(self) -> None:
        """マイグレーションレコード作成のテスト"""
        # Arrange: テスト用のデータを準備
        data = {
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": True,
            "applied_at": datetime(2025, 1, 1, 10, 0, 0),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        }
        
        # Act: マイグレーションレコードを作成
        record = MigrationRecord(data)
        
        # Assert: 期待される属性が設定されることを検証
        self.assertEqual(record.migration_id, "20250101000000")
        self.assertEqual(record.version, "20250101000000")
        self.assertEqual(record.name, "create_users")
        self.assertTrue(record.success)
        self.assertEqual(record.applied_at, datetime(2025, 1, 1, 10, 0, 0))
        self.assertEqual(record.checksum, "abc123")
        self.assertEqual(record.applied_by, "test_user")
        self.assertEqual(record.duration_ms, 100)

    def test_to_dict(self) -> None:
        """辞書変換のテスト"""
        # Arrange: テスト用のレコードを準備
        data = {
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": True,
            "applied_at": datetime(2025, 1, 1, 10, 0, 0),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        }
        record = MigrationRecord(data)
        
        # Act: 辞書に変換
        result_dict = record.to_dict()
        
        # Assert: 期待される辞書が返されることを検証
        self.assertIsInstance(result_dict, dict)
        self.assertEqual(result_dict["migration_id"], "20250101000000")
        self.assertEqual(result_dict["name"], "create_users")
        self.assertTrue(result_dict["success"])
        self.assertEqual(result_dict["duration_ms"], 100)

    def test_str_representation(self) -> None:
        """文字列表現のテスト"""
        # Arrange: テスト用のレコードを準備
        data = {
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": True,
            "applied_at": datetime(2025, 1, 1, 10, 0, 0),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 100
        }
        record = MigrationRecord(data)
        
        # Act: 文字列表現を取得
        str_repr = str(record)
        
        # Assert: 期待される文字列が含まれることを検証
        self.assertIn("20250101000000", str_repr)
        self.assertIn("create_users", str_repr)
        self.assertIn("SUCCESS" if record.success else "FAILED", str_repr.upper())

    def test_migration_record_failure(self) -> None:
        """失敗マイグレーションレコードのテスト"""
        # Arrange: 失敗したマイグレーションデータを準備
        data = {
            "migration_id": "20250101000000",
            "version": "20250101000000",
            "name": "create_users",
            "success": False,
            "applied_at": datetime(2025, 1, 1, 10, 0, 0),
            "checksum": "abc123",
            "applied_by": "test_user",
            "duration_ms": 50  # 短時間で失敗
        }
        
        # Act: 失敗レコードを作成
        record = MigrationRecord(data)
        
        # Assert: 失敗状態が正しく設定されることを検証
        self.assertFalse(record.success)
        self.assertEqual(record.duration_ms, 50)
        
        # 文字列表現に失敗情報が含まれることを確認
        str_repr = str(record)
        self.assertIn("FAILED", str_repr.upper())


if __name__ == "__main__":
    unittest.main()