"""
テスト共通設定
"""
import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, AsyncMock
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.pdf_service import PDFService
from backend.app.core.pdf_generator import PDFGenerator
from backend.app.core.pdf_templates import PDFTemplateEngine
from backend.app.utils.cache_manager import CacheManager


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
    """モックユーザー"""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User"
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
def pdf_service(temp_dir):
    """PDFサービスインスタンス"""
    cache_manager = CacheManager(cache_dir=temp_dir / "cache")
    return PDFService(cache_manager=cache_manager)


@pytest.fixture
def pdf_generator():
    """PDF生成エンジンインスタンス"""
    return PDFGenerator()


@pytest.fixture
def pdf_template_engine(temp_dir):
    """PDFテンプレートエンジンインスタンス"""
    return PDFTemplateEngine(template_dir=temp_dir / "templates")


@pytest.fixture
def cache_manager(temp_dir):
    """キャッシュマネージャーインスタンス"""
    return CacheManager(cache_dir=temp_dir / "cache")


@pytest.fixture
def sample_pdf_export_options():
    """サンプルPDFエクスポートオプション"""
    return {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "part_id": "part-1",
        "format": "detailed",
        "paper_size": "A4",
        "orientation": "portrait",
        "font_size": 10,
        "include_details": True
    }


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