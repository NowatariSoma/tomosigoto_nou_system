"""
Cache Manager のテスト
"""
import pytest
import os
import time
from pathlib import Path
from datetime import datetime, timedelta
from backend.app.utils.cache_manager import CacheManager


class TestCacheManager:
    """キャッシュマネージャーテストクラス"""

    def test_cache_manager_init(self, temp_dir):
        """キャッシュマネージャー初期化テスト"""
        cache_dir = temp_dir / "cache"
        cache_manager = CacheManager(cache_dir=cache_dir)
        
        assert cache_manager.cache_dir == cache_dir
        assert cache_dir.exists()

    def test_save_and_get_cache(self, cache_manager):
        """キャッシュ保存・取得テスト"""
        key = "test_key"
        data = b"test data"
        metadata = {"created_at": datetime.now().isoformat(), "size": len(data)}
        
        # キャッシュ保存
        cache_manager.save(key, data, metadata)
        
        # キャッシュ取得
        retrieved_data = cache_manager.get(key)
        
        assert retrieved_data == data

    def test_get_nonexistent_cache(self, cache_manager):
        """存在しないキャッシュの取得テスト"""
        result = cache_manager.get("nonexistent_key")
        
        assert result is None

    def test_cache_exists(self, cache_manager):
        """キャッシュ存在確認テスト"""
        key = "test_key"
        data = b"test data"
        
        # キャッシュが存在しない状態
        assert not cache_manager.exists(key)
        
        # キャッシュを保存
        cache_manager.save(key, data, {})
        
        # キャッシュが存在する状態
        assert cache_manager.exists(key)

    def test_delete_cache(self, cache_manager):
        """キャッシュ削除テスト"""
        key = "test_key"
        data = b"test data"
        
        # キャッシュを保存
        cache_manager.save(key, data, {})
        assert cache_manager.exists(key)
        
        # キャッシュを削除
        cache_manager.delete(key)
        assert not cache_manager.exists(key)

    def test_delete_nonexistent_cache(self, cache_manager):
        """存在しないキャッシュの削除テスト"""
        # エラーが発生しないことを確認
        cache_manager.delete("nonexistent_key")

    def test_get_metadata(self, cache_manager):
        """メタデータ取得テスト"""
        key = "test_key"
        data = b"test data"
        metadata = {
            "created_at": "2024-01-15T10:00:00Z",
            "size": len(data),
            "type": "pdf"
        }
        
        # キャッシュ保存
        cache_manager.save(key, data, metadata)
        
        # メタデータ取得
        retrieved_metadata = cache_manager.get_metadata(key)
        
        assert retrieved_metadata["created_at"] == "2024-01-15T10:00:00Z"
        assert retrieved_metadata["size"] == len(data)
        assert retrieved_metadata["type"] == "pdf"

    def test_get_metadata_nonexistent(self, cache_manager):
        """存在しないキャッシュのメタデータ取得テスト"""
        metadata = cache_manager.get_metadata("nonexistent_key")
        
        assert metadata is None

    def test_cleanup_expired_caches(self, cache_manager):
        """期限切れキャッシュクリーンアップテスト"""
        # 期限切れのキャッシュを作成
        expired_key = "expired_key"
        expired_metadata = {
            "created_at": (datetime.now() - timedelta(hours=25)).isoformat(),
            "expires_at": (datetime.now() - timedelta(hours=1)).isoformat()
        }
        
        # 有効なキャッシュを作成
        valid_key = "valid_key"
        valid_metadata = {
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=1)).isoformat()
        }
        
        cache_manager.save(expired_key, b"expired data", expired_metadata)
        cache_manager.save(valid_key, b"valid data", valid_metadata)
        
        # クリーンアップ実行
        cleaned_count = cache_manager.cleanup_expired()
        
        # 期限切れキャッシュが削除され、有効なキャッシュは残っていることを確認
        assert cleaned_count >= 1
        assert not cache_manager.exists(expired_key)
        assert cache_manager.exists(valid_key)

    def test_cleanup_by_pattern(self, cache_manager):
        """パターンマッチングによるクリーンアップテスト"""
        # 異なるパターンのキャッシュを作成
        cache_manager.save("user_123_data", b"user data", {})
        cache_manager.save("user_456_data", b"user data", {})
        cache_manager.save("system_config", b"system data", {})
        
        # user_*パターンをクリーンアップ
        cleaned_count = cache_manager.cleanup_by_pattern("user_*")
        
        assert cleaned_count == 2
        assert not cache_manager.exists("user_123_data")
        assert not cache_manager.exists("user_456_data")
        assert cache_manager.exists("system_config")

    def test_get_cache_size(self, cache_manager):
        """キャッシュサイズ取得テスト"""
        key = "test_key"
        data = b"x" * 1024  # 1KB
        
        cache_manager.save(key, data, {})
        
        size = cache_manager.get_cache_size(key)
        
        assert size == 1024

    def test_get_cache_size_nonexistent(self, cache_manager):
        """存在しないキャッシュのサイズ取得テスト"""
        size = cache_manager.get_cache_size("nonexistent_key")
        
        assert size == 0

    def test_list_all_caches(self, cache_manager):
        """全キャッシュ一覧取得テスト"""
        # 複数のキャッシュを作成
        cache_manager.save("key1", b"data1", {"type": "pdf"})
        cache_manager.save("key2", b"data2", {"type": "image"})
        cache_manager.save("key3", b"data3", {"type": "pdf"})
        
        all_caches = cache_manager.list_all()
        
        assert len(all_caches) == 3
        cache_keys = [cache["key"] for cache in all_caches]
        assert "key1" in cache_keys
        assert "key2" in cache_keys
        assert "key3" in cache_keys

    def test_get_total_cache_size(self, cache_manager):
        """総キャッシュサイズ取得テスト"""
        cache_manager.save("key1", b"x" * 1024, {})  # 1KB
        cache_manager.save("key2", b"x" * 2048, {})  # 2KB
        
        total_size = cache_manager.get_total_size()
        
        assert total_size >= 3072  # 3KB以上

    def test_cache_with_binary_data(self, cache_manager):
        """バイナリデータキャッシュテスト"""
        key = "binary_key"
        binary_data = bytes(range(256))  # 0-255のバイト
        
        cache_manager.save(key, binary_data, {})
        retrieved_data = cache_manager.get(key)
        
        assert retrieved_data == binary_data

    def test_cache_with_large_data(self, cache_manager):
        """大きなデータのキャッシュテスト"""
        key = "large_key"
        large_data = b"x" * (10 * 1024 * 1024)  # 10MB
        
        cache_manager.save(key, large_data, {})
        retrieved_data = cache_manager.get(key)
        
        assert len(retrieved_data) == 10 * 1024 * 1024
        assert retrieved_data == large_data

    def test_concurrent_cache_access(self, cache_manager):
        """同時キャッシュアクセステスト"""
        import threading
        
        def save_cache(key_suffix):
            key = f"concurrent_key_{key_suffix}"
            data = f"data_{key_suffix}".encode()
            cache_manager.save(key, data, {})
        
        def get_cache(key_suffix):
            key = f"concurrent_key_{key_suffix}"
            return cache_manager.get(key)
        
        # 複数スレッドで同時にキャッシュ操作
        threads = []
        for i in range(5):
            t = threading.Thread(target=save_cache, args=(i,))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        # すべてのキャッシュが正常に保存されていることを確認
        for i in range(5):
            data = get_cache(i)
            assert data == f"data_{i}".encode()

    def test_cache_expiry_check(self, cache_manager):
        """キャッシュ有効期限チェックテスト"""
        key = "expiry_key"
        data = b"test data"
        
        # 1秒後に期限切れになるキャッシュ
        expires_at = datetime.now() + timedelta(seconds=1)
        metadata = {"expires_at": expires_at.isoformat()}
        
        cache_manager.save(key, data, metadata)
        
        # すぐに取得（有効）
        assert cache_manager.get(key) == data
        
        # 2秒待機（期限切れ）
        time.sleep(2)
        
        # 期限切れキャッシュは自動削除されるべき
        cleaned = cache_manager.cleanup_expired()
        assert cleaned >= 1
        assert cache_manager.get(key) is None

    def test_cache_directory_permissions(self, temp_dir):
        """キャッシュディレクトリ権限テスト"""
        cache_dir = temp_dir / "restricted_cache"
        
        # 制限された権限でディレクトリを作成
        cache_dir.mkdir(mode=0o755)
        
        cache_manager = CacheManager(cache_dir=cache_dir)
        
        # 通常の操作が可能であることを確認
        cache_manager.save("test_key", b"test data", {})
        assert cache_manager.get("test_key") == b"test data"

    @pytest.mark.parametrize("key_name", [
        "simple_key",
        "key-with-dashes",
        "key_with_underscores",
        "key123",
        "KeyWithCaps",
    ])
    def test_different_key_formats(self, cache_manager, key_name):
        """異なるキー形式のテスト"""
        data = f"data for {key_name}".encode()
        
        cache_manager.save(key_name, data, {})
        retrieved_data = cache_manager.get(key_name)
        
        assert retrieved_data == data

    def test_cache_corruption_handling(self, cache_manager):
        """キャッシュ破損処理テスト"""
        key = "corrupted_key"
        
        # 正常なキャッシュを保存
        cache_manager.save(key, b"test data", {})
        
        # キャッシュファイルを破損させる
        cache_file = cache_manager.cache_dir / f"{key}.cache"
        cache_file.write_text("corrupted data")
        
        # 破損したキャッシュの取得でエラーが適切に処理されることを確認
        result = cache_manager.get(key)
        assert result is None  # 破損したキャッシュはNoneを返すべき

    def test_metadata_validation(self, cache_manager):
        """メタデータバリデーションテスト"""
        key = "metadata_key"
        data = b"test data"
        
        # 不正なメタデータでもエラーが発生しないことを確認
        invalid_metadata = {"invalid": None, "number": 123, "list": [1, 2, 3]}
        
        cache_manager.save(key, data, invalid_metadata)
        retrieved_data = cache_manager.get(key)
        
        assert retrieved_data == data