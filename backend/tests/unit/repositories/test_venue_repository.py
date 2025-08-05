import pytest
from unittest.mock import Mock, MagicMock
from typing import Dict, Any, List

from app.repositories.venue_repository import VenueRepository


class TestVenueRepository:
    """VenueRepositoryの単体テストケース"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """モックのSupabaseクライアントを作成"""
        client = Mock()
        # テーブルオブジェクトをモック
        table_mock = Mock()
        client.table.return_value = table_mock
        
        # メソッドチェーンをモック
        table_mock.select.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.insert.return_value = table_mock
        table_mock.update.return_value = table_mock
        table_mock.delete.return_value = table_mock
        table_mock.execute.return_value = Mock()
        
        return client
    
    @pytest.fixture
    def venue_repository(self, mock_supabase_client):
        """VenueRepositoryインスタンスを作成"""
        return VenueRepository(mock_supabase_client)
    
    @pytest.mark.asyncio
    async def test_find_all_success(self, venue_repository, mock_supabase_client):
        """すべての会場取得のテスト"""
        # モックデータ
        mock_venues = [
            {"id": "1", "name": "会場1"},
            {"id": "2", "name": "会場2"}
        ]
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = mock_venues
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_all()
        
        # アサーション
        assert result == mock_venues
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.select.assert_called_with('*')
    
    @pytest.mark.asyncio
    async def test_find_all_empty(self, venue_repository, mock_supabase_client):
        """会場が存在しない場合のテスト"""
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = None
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_all()
        
        # アサーション
        assert result == []
    
    @pytest.mark.asyncio
    async def test_find_by_id_found(self, venue_repository, mock_supabase_client):
        """IDで会場を取得（見つかった場合）"""
        # モックデータ
        venue_id = "test-venue-id"
        mock_venue = {"id": venue_id, "name": "テスト会場"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [mock_venue]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_by_id(venue_id)
        
        # アサーション
        assert result == mock_venue
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.select.assert_called_with('*')
        mock_supabase_client.table.return_value.select.return_value.eq.assert_called_with('id', venue_id)
    
    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self, venue_repository, mock_supabase_client):
        """IDで会場を取得（見つからない場合）"""
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_by_id("non-existent-id")
        
        # アサーション
        assert result is None
    
    @pytest.mark.asyncio
    async def test_find_by_name_found(self, venue_repository, mock_supabase_client):
        """名前で会場を取得（見つかった場合）"""
        # モックデータ
        venue_name = "テスト会場"
        mock_venue = {"id": "test-id", "name": venue_name}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [mock_venue]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_by_name(venue_name)
        
        # アサーション
        assert result == mock_venue
        mock_supabase_client.table.return_value.select.return_value.eq.assert_called_with('name', venue_name)
    
    @pytest.mark.asyncio
    async def test_find_by_name_not_found(self, venue_repository, mock_supabase_client):
        """名前で会場を取得（見つからない場合）"""
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.find_by_name("non-existent-venue")
        
        # アサーション
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_success(self, venue_repository, mock_supabase_client):
        """会場作成のテスト"""
        # テストデータ
        venue_data = {"name": "新しい会場"}
        created_venue = {"id": "new-venue-id", "name": "新しい会場"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [created_venue]
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.create(venue_data)
        
        # アサーション
        assert result == created_venue
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.insert.assert_called_with(venue_data)
    
    @pytest.mark.asyncio
    async def test_create_failed(self, venue_repository, mock_supabase_client):
        """会場作成失敗のテスト"""
        # テストデータ
        venue_data = {"name": "新しい会場"}
        
        # モックのレスポンスを設定（空のデータ）
        mock_response = Mock()
        mock_response.data = None
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.create(venue_data)
        
        # アサーション
        assert result == {}
    
    @pytest.mark.asyncio
    async def test_update_success(self, venue_repository, mock_supabase_client):
        """会場更新のテスト（成功）"""
        # テストデータ
        venue_id = "venue-to-update"
        update_data = {"name": "更新された会場"}
        updated_venue = {"id": venue_id, "name": "更新された会場"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [updated_venue]
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.update(venue_id, update_data)
        
        # アサーション
        assert result == updated_venue
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.update.assert_called_with(update_data)
        mock_supabase_client.table.return_value.update.return_value.eq.assert_called_with('id', venue_id)
    
    @pytest.mark.asyncio
    async def test_update_not_found(self, venue_repository, mock_supabase_client):
        """会場更新のテスト（会場が存在しない）"""
        # テストデータ
        venue_id = "non-existent-id"
        update_data = {"name": "更新された会場"}
        
        # モックのレスポンスを設定（空のデータ）
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.update(venue_id, update_data)
        
        # アサーション
        assert result is None
    
    @pytest.mark.asyncio
    async def test_delete_success(self, venue_repository, mock_supabase_client):
        """会場削除のテスト（成功）"""
        venue_id = "venue-to-delete"
        deleted_venue = {"id": venue_id, "name": "削除された会場"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [deleted_venue]
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.delete(venue_id)
        
        # アサーション
        assert result is True
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.delete.return_value.eq.assert_called_with('id', venue_id)
    
    @pytest.mark.asyncio
    async def test_delete_not_found(self, venue_repository, mock_supabase_client):
        """会場削除のテスト（会場が存在しない）"""
        venue_id = "non-existent-id"
        
        # モックのレスポンスを設定（空のデータ）
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.delete(venue_id)
        
        # アサーション
        assert result is False
    
    @pytest.mark.asyncio
    async def test_count_success(self, venue_repository, mock_supabase_client):
        """会場数取得のテスト"""
        expected_count = 5
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.count = expected_count
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.count()
        
        # アサーション
        assert result == expected_count
        mock_supabase_client.table.assert_called_with('venues')
        mock_supabase_client.table.return_value.select.assert_called_with('id', count='exact')
    
    @pytest.mark.asyncio
    async def test_count_no_count_attribute(self, venue_repository, mock_supabase_client):
        """会場数取得のテスト（count属性なし）"""
        # モックのレスポンスを設定（count属性なし）
        mock_response = Mock(spec=[])  # count属性を持たないモック
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await venue_repository.count()
        
        # アサーション
        assert result == 0