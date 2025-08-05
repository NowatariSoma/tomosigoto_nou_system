import pytest
from unittest.mock import Mock, MagicMock, AsyncMock
from typing import Dict, Any, List

from app.services.venue_service import VenueService
from app.repositories.venue_repository import VenueRepository
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage


class TestVenueService:
    """VenueServiceの単体テストケース"""
    
    @pytest.fixture
    def mock_venue_repository(self):
        """モックのVenueRepositoryを作成"""
        repository = Mock(spec=VenueRepository)
        # デフォルトでasyncメソッドを設定
        repository.find_all = AsyncMock()
        repository.find_by_id = AsyncMock()
        repository.find_by_name = AsyncMock()
        repository.create = AsyncMock()
        repository.update = AsyncMock()
        repository.delete = AsyncMock()
        return repository
    
    @pytest.fixture
    def venue_service(self, mock_venue_repository):
        """VenueServiceインスタンスを作成"""
        return VenueService(mock_venue_repository)
    
    @pytest.mark.asyncio
    async def test_get_all_venues_success(self, venue_service, mock_venue_repository):
        """すべての会場取得のテスト"""
        # モックデータ
        mock_venues = [
            {"id": "1", "name": "会場1"},
            {"id": "2", "name": "会場2"}
        ]
        mock_venue_repository.find_all.return_value = mock_venues
        
        # 実行
        result = await venue_service.get_all_venues()
        
        # アサーション
        assert result == mock_venues
        mock_venue_repository.find_all.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_all_venues_empty(self, venue_service, mock_venue_repository):
        """会場が存在しない場合のテスト"""
        mock_venue_repository.find_all.return_value = []
        
        # 実行
        result = await venue_service.get_all_venues()
        
        # アサーション
        assert result == []
        mock_venue_repository.find_all.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_venue_by_id_found(self, venue_service, mock_venue_repository):
        """IDで会場を取得（見つかった場合）"""
        # モックデータ
        venue_id = "test-venue-id"
        mock_venue = {"id": venue_id, "name": "テスト会場"}
        mock_venue_repository.find_by_id.return_value = mock_venue
        
        # 実行
        result = await venue_service.get_venue_by_id(venue_id)
        
        # アサーション
        assert result == mock_venue
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
    
    @pytest.mark.asyncio
    async def test_get_venue_by_id_not_found(self, venue_service, mock_venue_repository):
        """IDで会場を取得（見つからない場合）"""
        venue_id = "non-existent-id"
        mock_venue_repository.find_by_id.return_value = None
        
        # 実行とアサーション
        with pytest.raises(APIException) as exc_info:
            await venue_service.get_venue_by_id(venue_id)
        
        assert exc_info.value.detail["error_code"] == "VENUE_NOT_FOUND"
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
    
    @pytest.mark.asyncio
    async def test_create_venue_success(self, venue_service, mock_venue_repository):
        """会場作成のテスト（成功）"""
        # テストデータ
        venue_data = {"name": "新しい会場"}
        created_venue = {"id": "new-venue-id", "name": "新しい会場"}
        
        # モックの設定
        mock_venue_repository.find_by_name.return_value = None  # 既存会場なし
        mock_venue_repository.create.return_value = created_venue
        
        # 実行
        result = await venue_service.create_venue(venue_data)
        
        # アサーション
        assert result == created_venue
        mock_venue_repository.find_by_name.assert_called_once_with("新しい会場")
        mock_venue_repository.create.assert_called_once_with(venue_data)
    
    @pytest.mark.asyncio
    async def test_create_venue_already_exists(self, venue_service, mock_venue_repository):
        """会場作成のテスト（既存会場名）"""
        # テストデータ
        venue_data = {"name": "既存の会場"}
        existing_venue = {"id": "existing-id", "name": "既存の会場"}
        
        # モックの設定
        mock_venue_repository.find_by_name.return_value = existing_venue
        
        # 実行とアサーション
        with pytest.raises(APIException) as exc_info:
            await venue_service.create_venue(venue_data)
        
        assert exc_info.value.detail["error_code"] == "VENUE_ALREADY_EXISTS"
        mock_venue_repository.find_by_name.assert_called_once_with("既存の会場")
        mock_venue_repository.create.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_update_venue_success(self, venue_service, mock_venue_repository):
        """会場更新のテスト（成功）"""
        # テストデータ
        venue_id = "venue-to-update"
        venue_data = {"name": "更新された会場"}
        existing_venue = {"id": venue_id, "name": "元の会場"}
        updated_venue = {"id": venue_id, "name": "更新された会場"}
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = existing_venue
        mock_venue_repository.update.return_value = updated_venue
        
        # 実行
        result = await venue_service.update_venue(venue_id, venue_data)
        
        # アサーション
        assert result == updated_venue
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.update.assert_called_once_with(venue_id, venue_data)
    
    @pytest.mark.asyncio
    async def test_update_venue_not_found(self, venue_service, mock_venue_repository):
        """会場更新のテスト（会場が存在しない）"""
        venue_id = "non-existent-id"
        venue_data = {"name": "更新された会場"}
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = None
        
        # 実行とアサーション
        with pytest.raises(APIException) as exc_info:
            await venue_service.update_venue(venue_id, venue_data)
        
        assert exc_info.value.detail["error_code"] == "VENUE_NOT_FOUND"
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.update.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_update_venue_no_changes(self, venue_service, mock_venue_repository):
        """会場更新のテスト（変更データなし）"""
        venue_id = "venue-id"
        venue_data = {}  # 空のデータ
        existing_venue = {"id": venue_id, "name": "元の会場"}
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = existing_venue
        
        # 実行
        result = await venue_service.update_venue(venue_id, venue_data)
        
        # アサーション
        assert result == existing_venue
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.update.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_delete_venue_success(self, venue_service, mock_venue_repository):
        """会場削除のテスト（成功）"""
        venue_id = "venue-to-delete"
        existing_venue = {"id": venue_id, "name": "削除する会場"}
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = existing_venue
        mock_venue_repository.delete.return_value = True
        
        # 実行
        result = await venue_service.delete_venue(venue_id)
        
        # アサーション
        assert result is True
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.delete.assert_called_once_with(venue_id)
    
    @pytest.mark.asyncio
    async def test_delete_venue_not_found(self, venue_service, mock_venue_repository):
        """会場削除のテスト（会場が存在しない）"""
        venue_id = "non-existent-id"
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = None
        
        # 実行とアサーション
        with pytest.raises(APIException) as exc_info:
            await venue_service.delete_venue(venue_id)
        
        assert exc_info.value.detail["error_code"] == "VENUE_NOT_FOUND"
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.delete.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_delete_venue_failed(self, venue_service, mock_venue_repository):
        """会場削除のテスト（削除失敗）"""
        venue_id = "venue-to-delete"
        existing_venue = {"id": venue_id, "name": "削除する会場"}
        
        # モックの設定
        mock_venue_repository.find_by_id.return_value = existing_venue
        mock_venue_repository.delete.return_value = False  # 削除失敗
        
        # 実行
        result = await venue_service.delete_venue(venue_id)
        
        # アサーション
        assert result is False
        mock_venue_repository.find_by_id.assert_called_once_with(venue_id)
        mock_venue_repository.delete.assert_called_once_with(venue_id)