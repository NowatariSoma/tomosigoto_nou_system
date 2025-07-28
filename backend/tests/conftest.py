"""
テスト共通設定
"""
import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, AsyncMock


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
    monkeypatch.setenv("TESTING", "1")