import pytest
from unittest.mock import Mock, AsyncMock
from uuid import uuid4
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from app.services.venue_service import VenueService
from app.repositories.venue_repository import VenueRepository
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage


class TestVenuesEndpoints:
    """Venuesエンドポイントの単体テストケース"""
    
    @pytest.fixture
    def client(self):
        """FastAPIテストクライアントを作成"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_venue_service(self):
        """モックのVenueServiceを作成"""
        service = Mock(spec=VenueService)
        service.get_all_venues = AsyncMock()
        service.get_venue_by_id = AsyncMock()
        service.create_venue = AsyncMock()
        service.update_venue = AsyncMock()
        service.delete_venue = AsyncMock()
        return service
    
    def test_get_venues_success(self, client, mock_venue_service, monkeypatch):
        """全会場取得のテスト（成功）"""
        # モックデータ
        mock_venues = [
            {"id": str(uuid4()), "name": "会場1"},
            {"id": str(uuid4()), "name": "会場2"}
        ]
        mock_venue_service.get_all_venues.return_value = mock_venues
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.get("/api/v1/venues/")
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "会場1"
        assert data[1]["name"] == "会場2"
    
    def test_get_venues_empty(self, client, mock_venue_service, monkeypatch):
        """全会場取得のテスト（空の場合）"""
        mock_venue_service.get_all_venues.return_value = []
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.get("/api/v1/venues/")
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    
    def test_get_venue_success(self, client, mock_venue_service, monkeypatch):
        """個別会場取得のテスト（成功）"""
        # モックデータ
        venue_id = str(uuid4())
        mock_venue = {"id": venue_id, "name": "テスト会場"}
        mock_venue_service.get_venue_by_id.return_value = mock_venue
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.get(f"/api/v1/venues/{venue_id}")
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == venue_id
        assert data["name"] == "テスト会場"
    
    def test_get_venue_not_found(self, client, mock_venue_service, monkeypatch):
        """個別会場取得のテスト（見つからない場合）"""
        venue_id = str(uuid4())
        mock_venue_service.get_venue_by_id.side_effect = APIException(ErrorMessage.VENUE_NOT_FOUND)
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.get(f"/api/v1/venues/{venue_id}")
        
        # アサーション
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_create_venue_success(self, client, mock_venue_service, monkeypatch):
        """会場作成のテスト（成功）"""
        # テストデータ
        venue_data = {"name": "新しい会場"}
        created_venue = {"id": str(uuid4()), "name": "新しい会場"}
        mock_venue_service.create_venue.return_value = created_venue
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.post("/api/v1/venues/", json=venue_data)
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "新しい会場"
        assert "id" in data
    
    def test_create_venue_already_exists(self, client, mock_venue_service, monkeypatch):
        """会場作成のテスト（既存会場名）"""
        venue_data = {"name": "既存の会場"}
        mock_venue_service.create_venue.side_effect = APIException(ErrorMessage.VENUE_ALREADY_EXISTS)
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.post("/api/v1/venues/", json=venue_data)
        
        # アサーション
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_venue_invalid_data(self, client):
        """会場作成のテスト（無効なデータ）"""
        # 名前が空のデータ
        venue_data = {"name": ""}
        
        # 実行
        response = client.post("/api/v1/venues/", json=venue_data)
        
        # アサーション（バリデーションエラー）
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_update_venue_success(self, client, mock_venue_service, monkeypatch):
        """会場更新のテスト（成功）"""
        # テストデータ
        venue_id = str(uuid4())
        venue_data = {"name": "更新された会場"}
        updated_venue = {"id": venue_id, "name": "更新された会場"}
        mock_venue_service.update_venue.return_value = updated_venue
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.put(f"/api/v1/venues/{venue_id}", json=venue_data)
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == venue_id
        assert data["name"] == "更新された会場"
    
    def test_update_venue_not_found(self, client, mock_venue_service, monkeypatch):
        """会場更新のテスト（会場が存在しない）"""
        venue_id = str(uuid4())
        venue_data = {"name": "更新された会場"}
        mock_venue_service.update_venue.side_effect = APIException(ErrorMessage.VENUE_NOT_FOUND)
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.put(f"/api/v1/venues/{venue_id}", json=venue_data)
        
        # アサーション
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_venue_success(self, client, mock_venue_service, monkeypatch):
        """会場削除のテスト（成功）"""
        venue_id = str(uuid4())
        mock_venue_service.delete_venue.return_value = True
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.delete(f"/api/v1/venues/{venue_id}")
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted successfully" in data["message"]
    
    def test_delete_venue_not_found(self, client, mock_venue_service, monkeypatch):
        """会場削除のテスト（会場が存在しない）"""
        venue_id = str(uuid4())
        mock_venue_service.delete_venue.side_effect = APIException(ErrorMessage.VENUE_NOT_FOUND)
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.delete(f"/api/v1/venues/{venue_id}")
        
        # アサーション
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_venue_failed(self, client, mock_venue_service, monkeypatch):
        """会場削除のテスト（削除失敗）"""
        venue_id = str(uuid4())
        mock_venue_service.delete_venue.return_value = False
        
        # VenueServiceをモックに置き換え
        def mock_get_venue_service():
            return mock_venue_service
        
        monkeypatch.setattr("app.api.endpoints.venues.Depends", lambda x: mock_get_venue_service)
        
        # 実行
        response = client.delete(f"/api/v1/venues/{venue_id}")
        
        # アサーション
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted failed" in data["message"]