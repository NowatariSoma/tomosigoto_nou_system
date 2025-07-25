"""
VersionUtilクラスのテスト

TDD方針に従い、バージョン管理ユーティリティの期待される動作を定義するテストを作成します。
"""
import unittest
from unittest.mock import patch
from datetime import datetime
import re

import pytest

from migrations.version import VersionUtil


class TestVersionUtil(unittest.TestCase):
    """VersionUtilクラスのテスト"""

    def test_parse_version_valid_filename(self) -> None:
        """有効なファイル名からのバージョン解析テスト"""
        # Arrange: 有効なマイグレーションファイル名を準備
        test_cases = [
            ("20250101000000_create_users.sql", "20250101000000"),
            ("20250102120000_add_user_roles.sql", "20250102120000"),
            ("20250103235959_create_departments.sql", "20250103235959"),
            ("001_initial_schema.sql", "001"),
            ("v1.0.0_baseline.sql", "1.0.0")
        ]
        
        for filename, expected_version in test_cases:
            with self.subTest(filename=filename):
                # Act: バージョンを解析
                version = VersionUtil.parse_version(filename)
                
                # Assert: 期待されるバージョンが抽出されることを検証
                self.assertEqual(version, expected_version)

    def test_parse_version_invalid_filename(self) -> None:
        """無効なファイル名のバージョン解析テスト"""
        # Arrange: 無効なファイル名を準備
        invalid_filenames = [
            "invalid_migration.sql",
            "migration_without_version.sql",
            "README.md",
            "__pycache__",
            ".gitignore"
        ]
        
        for filename in invalid_filenames:
            with self.subTest(filename=filename):
                # Act & Assert: 無効なファイル名に対してはNoneまたは例外が発生することを検証
                result = VersionUtil.parse_version(filename)
                self.assertIsNone(result)

    def test_compare_versions_timestamp_format(self) -> None:
        """タイムスタンプ形式バージョンの比較テスト"""
        # Arrange: タイムスタンプ形式のバージョンを準備
        test_cases = [
            ("20250101000000", "20250102000000", -1),  # 前が古い
            ("20250102000000", "20250101000000", 1),   # 前が新しい
            ("20250101000000", "20250101000000", 0),   # 同じ
            ("20250101120000", "20250101110000", 1),   # 同日で前が新しい
            ("20250101110000", "20250101120000", -1),  # 同日で前が古い
        ]
        
        for ver1, ver2, expected in test_cases:
            with self.subTest(ver1=ver1, ver2=ver2):
                # Act: バージョンを比較
                result = VersionUtil.compare_versions(ver1, ver2)
                
                # Assert: 期待される比較結果を検証
                self.assertEqual(result, expected)

    def test_compare_versions_semantic_format(self) -> None:
        """セマンティックバージョン形式の比較テスト"""
        # Arrange: セマンティックバージョンを準備
        test_cases = [
            ("1.0.0", "1.0.1", -1),  # パッチバージョンの比較
            ("1.0.1", "1.0.0", 1),   # パッチバージョンの比較
            ("1.0.0", "1.1.0", -1),  # マイナーバージョンの比較
            ("1.1.0", "1.0.0", 1),   # マイナーバージョンの比較
            ("1.0.0", "2.0.0", -1),  # メジャーバージョンの比較
            ("2.0.0", "1.0.0", 1),   # メジャーバージョンの比較
            ("1.0.0", "1.0.0", 0),   # 同じバージョン
        ]
        
        for ver1, ver2, expected in test_cases:
            with self.subTest(ver1=ver1, ver2=ver2):
                # Act: バージョンを比較
                result = VersionUtil.compare_versions(ver1, ver2)
                
                # Assert: 期待される比較結果を検証
                self.assertEqual(result, expected)

    def test_compare_versions_sequential_format(self) -> None:
        """連番形式バージョンの比較テスト"""
        # Arrange: 連番形式のバージョンを準備
        test_cases = [
            ("001", "002", -1),
            ("002", "001", 1),
            ("001", "001", 0),
            ("010", "009", 1),
            ("100", "099", 1),
        ]
        
        for ver1, ver2, expected in test_cases:
            with self.subTest(ver1=ver1, ver2=ver2):
                # Act: バージョンを比較
                result = VersionUtil.compare_versions(ver1, ver2)
                
                # Assert: 期待される比較結果を検証
                self.assertEqual(result, expected)

    def test_generate_version_timestamp_format(self) -> None:
        """タイムスタンプ形式バージョン生成テスト"""
        # Arrange: 現在時刻をモック
        mock_datetime = datetime(2025, 1, 15, 14, 30, 45)
        
        with patch('datetime.datetime') as mock_dt:
            mock_dt.now.return_value = mock_datetime
            
            # Act: バージョンを生成
            version = VersionUtil.generate_version()
            
            # Assert: 期待される形式のバージョンが生成されることを検証
            self.assertIsInstance(version, str)
            self.assertEqual(len(version), 14)  # YYYYMMDDHHmmss形式
            self.assertTrue(version.isdigit())
            self.assertEqual(version, "20250115143045")

    def test_generate_version_unique(self) -> None:
        """バージョン生成の一意性テスト"""
        # Act: 複数回バージョンを生成
        versions = []
        for _ in range(10):
            version = VersionUtil.generate_version()
            versions.append(version)
            # 短時間で複数生成する場合の差を確保
            import time
            time.sleep(0.001)
        
        # Assert: 各バージョンが一意であることを検証
        unique_versions = set(versions)
        self.assertEqual(len(unique_versions), len(versions))

    def test_extract_timestamp_valid_version(self) -> None:
        """有効なバージョンからのタイムスタンプ抽出テスト"""
        # Arrange: タイムスタンプ形式のバージョンを準備
        test_cases = [
            ("20250101000000", datetime(2025, 1, 1, 0, 0, 0)),
            ("20250115143045", datetime(2025, 1, 15, 14, 30, 45)),
            ("20251231235959", datetime(2025, 12, 31, 23, 59, 59)),
        ]
        
        for version, expected_datetime in test_cases:
            with self.subTest(version=version):
                # Act: タイムスタンプを抽出
                extracted_datetime = VersionUtil.extract_timestamp(version)
                
                # Assert: 期待される日時が抽出されることを検証
                self.assertEqual(extracted_datetime, expected_datetime)

    def test_extract_timestamp_invalid_version(self) -> None:
        """無効なバージョンからのタイムスタンプ抽出テスト"""
        # Arrange: 非タイムスタンプ形式のバージョンを準備
        invalid_versions = [
            "1.0.0",
            "001",
            "invalid",
            "2025013100000",  # 無効な月
            "20250231000000",  # 無効な日
        ]
        
        for version in invalid_versions:
            with self.subTest(version=version):
                # Act & Assert: 無効なバージョンに対してはNoneまたは例外が発生することを検証
                result = VersionUtil.extract_timestamp(version)
                self.assertIsNone(result)

    def test_is_valid_version_timestamp_format(self) -> None:
        """タイムスタンプ形式バージョンの有効性検証テスト"""
        # Arrange: テストケースを準備
        test_cases = [
            ("20250101000000", True),   # 有効なタイムスタンプ
            ("20250115143045", True),   # 有効なタイムスタンプ
            ("20251231235959", True),   # 有効なタイムスタンプ
            ("2025010100000", False),   # 桁数不足
            ("202501010000000", False), # 桁数過多
            ("20250001000000", False),  # 無効な月
            ("20250100000000", False),  # 無効な日
            ("20250101250000", False),  # 無効な時
            ("20250101006000", False),  # 無効な分
            ("20250101000060", False),  # 無効な秒
            ("abcd0101000000", False),  # 非数字
        ]
        
        for version, expected_valid in test_cases:
            with self.subTest(version=version):
                # Act: バージョンの有効性を検証
                is_valid = VersionUtil.is_valid_version(version)
                
                # Assert: 期待される検証結果を検証
                self.assertEqual(is_valid, expected_valid)

    def test_is_valid_version_semantic_format(self) -> None:
        """セマンティックバージョンの有効性検証テスト"""
        # Arrange: テストケースを準備
        test_cases = [
            ("1.0.0", True),      # 有効なセマンティックバージョン
            ("1.2.3", True),      # 有効なセマンティックバージョン
            ("10.20.30", True),   # 有効なセマンティックバージョン
            ("1.0", False),       # パッチバージョンなし
            ("1", False),         # マイナー・パッチバージョンなし
            ("1.0.0.0", False),   # 過多なバージョン
            ("a.b.c", False),     # 非数字
            ("1.a.0", False),     # 部分的に非数字
        ]
        
        for version, expected_valid in test_cases:
            with self.subTest(version=version):
                # Act: バージョンの有効性を検証
                is_valid = VersionUtil.is_valid_version(version)
                
                # Assert: 期待される検証結果を検証
                self.assertEqual(is_valid, expected_valid)

    def test_is_valid_version_sequential_format(self) -> None:
        """連番形式バージョンの有効性検証テスト"""
        # Arrange: テストケースを準備
        test_cases = [
            ("001", True),      # 有効な連番
            ("010", True),      # 有効な連番
            ("999", True),      # 有効な連番
            ("1", True),        # 有効な連番（ゼロ埋めなし）
            ("123", True),      # 有効な連番
            ("0", True),        # 有効な連番
            ("abc", False),     # 非数字
            ("12a", False),     # 部分的に非数字
        ]
        
        for version, expected_valid in test_cases:
            with self.subTest(version=version):
                # Act: バージョンの有効性を検証
                is_valid = VersionUtil.is_valid_version(version)
                
                # Assert: 期待される検証結果を検証
                self.assertEqual(is_valid, expected_valid)

    def test_format_version_semantic(self) -> None:
        """セマンティックバージョン書式設定テスト"""
        # Arrange: メジャー、マイナー、パッチバージョンを準備
        test_cases = [
            (1, 0, 0, "1.0.0"),
            (2, 5, 3, "2.5.3"),
            (10, 20, 30, "10.20.30"),
            (0, 0, 1, "0.0.1"),
        ]
        
        for major, minor, patch, expected in test_cases:
            with self.subTest(major=major, minor=minor, patch=patch):
                # Act: バージョンを書式設定
                formatted_version = VersionUtil.format_version(major, minor, patch)
                
                # Assert: 期待される書式のバージョンが生成されることを検証
                self.assertEqual(formatted_version, expected)

    def test_format_version_validation(self) -> None:
        """バージョン書式設定の入力検証テスト"""
        # Arrange: 無効な入力値を準備
        invalid_inputs = [
            (-1, 0, 0),   # 負のメジャーバージョン
            (1, -1, 0),   # 負のマイナーバージョン
            (1, 0, -1),   # 負のパッチバージョン
        ]
        
        for major, minor, patch in invalid_inputs:
            with self.subTest(major=major, minor=minor, patch=patch):
                # Act & Assert: 無効な入力に対して例外が発生することを検証
                with self.assertRaises(ValueError):
                    VersionUtil.format_version(major, minor, patch)


if __name__ == "__main__":
    unittest.main()