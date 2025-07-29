"""
テスト共通設定
"""
import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, AsyncMock, MagicMock


@pytest.fixture
def temp_dir():
    """一時ディレクトリ"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def mock_current_user():
    """モックユーザー"""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User"
    }


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    mock_client = Mock()
    mock_client.table = Mock()
    mock_client.auth = Mock()
    mock_client.auth.admin = Mock()
    mock_client.auth.get_user = Mock()
    return mock_client


@pytest.fixture
def sample_user():
    """Sample user data for testing"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
    }


@pytest.fixture
def sample_schedule_data():
    """サンプルスケジュールデータ"""
    return [
        {
            "date": "2024-01-15",
            "start_time": "09:00",
            "end_time": "17:00",
            "part_id": "part-1",
            "part_name": "営業部",
            "worker_id": "worker-1",
            "worker_name": "田中太郎",
            "position": "チーフ",
            "details": "新規開拓担当"
        },
        {
            "date": "2024-01-15",
            "start_time": "09:00",
            "end_time": "17:00",
            "part_id": "part-2",
            "part_name": "開発部",
            "worker_id": "worker-2",
            "worker_name": "佐藤花子",
            "position": "エンジニア",
            "details": "フロントエンド開発"
        }
    ]


@pytest.fixture
def sample_users():
    """Sample users list for testing"""
    return [
        {
            "id": "user1",
            "email": "user1@example.com",
            "created_at": "2025-01-01T00:00:00.000Z",
            "updated_at": "2025-01-01T00:00:00.000Z"
        },
        {
            "id": "user2", 
            "email": "user2@example.com",
            "created_at": "2025-01-01T00:00:00.000Z",
            "updated_at": "2025-01-01T00:00:00.000Z"
        }
    ]


# PDF関連のfixtureは必要に応じて後で追加


# PDF export関連のfixtureは必要に応じて後で追加


@pytest.fixture(autouse=True)
def setup_test_environment():
    """テスト環境セットアップ"""
    # テスト用の環境変数設定
    os.environ["TESTING"] = "1"
    os.environ["CACHE_EXPIRY_HOURS"] = "1"
    
    yield
    
    # クリーンアップ
    if "TESTING" in os.environ:
        del os.environ["TESTING"]
    if "CACHE_EXPIRY_HOURS" in os.environ:
        del os.environ["CACHE_EXPIRY_HOURS"]

@pytest.fixture
def mock_jwt_token():
    """Mock JWT token for testing"""
    return "mock.jwt.token"


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """Setup test environment variables"""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")
