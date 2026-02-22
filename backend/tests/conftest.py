"""
テスト共通設定
"""
import os
import tempfile
from pathlib import Path
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.helpers.factories import make_current_user


@pytest.fixture
def client():
    """FastAPIテストクライアント"""
    return TestClient(app)


@pytest.fixture
def temp_dir():
    """一時ディレクトリ"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def mock_current_user():
    """モックユーザー（CurrentUser TypedDict 準拠）"""
    return make_current_user()


@pytest.fixture
def mock_admin_user():
    """管理者モックユーザー（CurrentUser TypedDict 準拠）"""
    return make_current_user(
        email="admin@example.com",
        app_metadata={"provider": "email", "providers": ["email"]},
    )


@pytest.fixture
def mock_instructor_user():
    """指導者モックユーザー（CurrentUser TypedDict 準拠）"""
    return make_current_user(
        email="instructor@example.com",
        app_metadata={"provider": "email", "providers": ["email"]},
    )


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


def mock_jwt_token():
    """Mock JWT token for testing"""
    return "mock.jwt.token"


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """Setup test environment variables"""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")


@pytest.fixture
def sample_practice_schedule():
    """Sample practice schedule data for testing"""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "schedule_date": "2024-02-15",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "description": "練習セッション",
        "schedule_type": "regular",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "created_by": "550e8400-e29b-41d4-a716-446655440002",
        "updated_by": "550e8400-e29b-41d4-a716-446655440002"
    }


@pytest.fixture
def sample_practice_schedules():
    """Sample practice schedules list for testing"""
    return [
        {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "description": "練習セッション1",
            "schedule_type": "regular",
            "status": "active",
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z",
            "created_by": "550e8400-e29b-41d4-a716-446655440003",
            "updated_by": "550e8400-e29b-41d4-a716-446655440003"
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "schedule_date": "2024-02-16",
            "start_time": "10:00:00",
            "end_time": "18:00:00",
            "description": "練習セッション2",
            "schedule_type": "special",
            "status": "active",
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z",
            "created_by": "550e8400-e29b-41d4-a716-446655440003",
            "updated_by": "550e8400-e29b-41d4-a716-446655440003"
        }
    ]


@pytest.fixture
def sample_practice_schedule_with_details():
    """Sample practice schedule with detailed information for testing"""
    return {
        "id": "schedule-1",
        "schedule_date": "2024-02-15",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "description": "練習セッション",
        "schedule_type": "regular",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "created_by": "user-1",
        "updated_by": "user-1",
        "available_venues": [
            {
                "id": "venue-schedule-1",
                "schedule_id": "schedule-1",
                "venue_id": "venue-1",
                "is_preferred": True,
                "priority": 1,
                "notes": "メイン会場",
                "created_at": "2024-01-01T00:00:00.000Z",
                "updated_at": "2024-01-01T00:00:00.000Z"
            }
        ],
        "sessions": [
            {
                "id": "session-1",
                "schedule_id": "schedule-1",
                "part_id": "part-1",
                "title": "セッション1",
                "start_time": "09:00:00",
                "end_time": "12:00:00",
                "schedule_available_venues": "venue-schedule-1",
                "priority": 1,
                "created_at": "2024-01-01T00:00:00.000Z",
                "updated_at": "2024-01-01T00:00:00.000Z",
                "instructors": [
                    {
                        "id": "instructor-1",
                        "session_id": "session-1",
                        "user_id": "user-1",
                        "created_at": "2024-01-01T00:00:00.000Z",
                        "updated_at": "2024-01-01T00:00:00.000Z"
                    }
                ]
            }
        ]
    }


@pytest.fixture
def sample_session():
    """Sample session data for testing"""
    return {
        "id": "session-1",
        "schedule_id": "schedule-1",
        "part_id": "part-1",
        "title": "セッション1",
        "start_time": "09:00:00",
        "end_time": "12:00:00",
        "schedule_available_venues": "venue-schedule-1",
        "priority": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
    }


@pytest.fixture
def sample_sessions():
    """Sample sessions list for testing"""
    return [
        {
            "id": "session-1",
            "schedule_id": "schedule-1",
            "part_id": "part-1",
            "title": "セッション1",
            "start_time": "09:00:00",
            "end_time": "12:00:00",
            "schedule_available_venues": "venue-schedule-1",
            "priority": 1,
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z",
            "instructors": []
        },
        {
            "id": "session-2",
            "schedule_id": "schedule-1",
            "part_id": "part-2",
            "title": "セッション2",
            "start_time": "13:00:00",
            "end_time": "17:00:00",
            "schedule_available_venues": "venue-schedule-1",
            "priority": 2,
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z",
            "instructors": []
        }
    ]


@pytest.fixture
def sample_ideal_schedule_data():
    """Sample ideal format schedule data for testing"""
    return {
        "schedule_info": {
            "id": "schedule-1",
            "schedule_date": "2024-02-15",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "title": "練習セッション",
            "description": "2月15日の練習"
        },
        "venues": [
            {
                "id": "venue-1",
                "name": "第1会場",
                "priority": 1,
                "color": "#FF6B6B"
            },
            {
                "id": "venue-2",
                "name": "第2会場",
                "priority": 2,
                "color": "#4ECDC4"
            }
        ],
        "time_schedule": {
            "09:00": {
                "venue-1": [
                    {
                        "part_id": "part-1",
                        "part_name": "セッション1",
                        "part_color": "#FFD93D",
                        "session_title": "セッション1",
                        "instructors": ["田中先生", "佐藤先生"],
                        "participants": 8,
                        "status": "confirmed",
                        "slot_order": 1,
                        "schedule_available_venue_id": "venue-1"
                    }
                ],
                "venue-2": []
            },
            "11:00": {
                "venue-1": [],
                "venue-2": [
                    {
                        "part_id": "part-2",
                        "part_name": "セッション2",
                        "part_color": "#6BCF7F",
                        "session_title": "セッション2",
                        "instructors": ["山田先生"],
                        "participants": 5,
                        "status": "confirmed",
                        "slot_order": 2,
                        "schedule_available_venue_id": "venue-2"
                    }
                ]
            }
        },
        "debug_info": {
            "sessions_count": 2,
            "sessions_data": [],
            "venues_count": 2,
            "division_count": 6,
            "session_processing_details": []
        }
    }
