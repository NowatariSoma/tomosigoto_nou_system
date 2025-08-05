import pytest
from unittest.mock import Mock, MagicMock, AsyncMock
from typing import Dict, Any, List

from app.services.user_service import UserService


class TestUserService:
    """UserServiceの新しいテストケース（依存性注入版）"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """モックのSupabaseクライアントを作成"""
        client = Mock()
        client.table = Mock(return_value=Mock())
        client.auth = Mock()
        client.auth.admin = Mock()
        return client
    
    @pytest.fixture
    def user_service(self, mock_supabase_client):
        """UserServiceインスタンスを作成"""
        return UserService(mock_supabase_client)
    
    @pytest.mark.asyncio
    async def test_get_all_users_success(self, user_service, mock_supabase_client):
        """すべてのユーザー取得のテスト"""
        # モックデータ
        mock_users = [
            {"id": "1", "email": "user1@example.com"},
            {"id": "2", "email": "user2@example.com"}
        ]
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = mock_users
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await user_service.get_all_users()
        
        # アサーション
        assert result == mock_users
        mock_supabase_client.table.assert_called_with('users')
        mock_supabase_client.table.return_value.select.assert_called_with('*')
    
    @pytest.mark.asyncio
    async def test_get_all_users_empty(self, user_service, mock_supabase_client):
        """ユーザーが存在しない場合のテスト"""
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = None
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # 実行
        result = await user_service.get_all_users()
        
        # アサーション
        assert result == []
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_found(self, user_service, mock_supabase_client):
        """IDでユーザーを取得（見つかった場合）"""
        # モックデータ
        user_id = "test-user-id"
        mock_user = {"id": user_id, "email": "test@example.com"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [mock_user]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await user_service.get_user_by_id(user_id)
        
        # アサーション
        assert result == mock_user
        mock_supabase_client.table.assert_called_with('users')
        mock_supabase_client.table.return_value.select.assert_called_with('*')
        mock_supabase_client.table.return_value.select.return_value.eq.assert_called_with('id', user_id)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, user_service, mock_supabase_client):
        """IDでユーザーを取得（見つからない場合）"""
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = []
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await user_service.get_user_by_id("non-existent-id")
        
        # アサーション
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_user_success(self, user_service, mock_supabase_client):
        """ユーザー作成のテスト"""
        # テストデータ
        user_data = {
            "email": "newuser@example.com",
            "password": "password123"
        }
        
        # モックの認証レスポンス
        mock_auth_user = Mock()
        mock_auth_user.id = "new-user-id"
        mock_auth_user.created_at = None
        mock_auth_user.updated_at = None
        
        mock_auth_response = Mock()
        mock_auth_response.user = mock_auth_user
        mock_supabase_client.auth.admin.create_user.return_value = mock_auth_response
        
        # モックのDBレスポンス
        mock_db_response = Mock()
        mock_db_response.data = [{
            "id": "new-user-id",
            "email": "newuser@example.com",
            "created_at": None,
            "updated_at": None
        }]
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_db_response
        
        # 実行
        result = await user_service.create_user(user_data)
        
        # アサーション
        assert result["id"] == "new-user-id"
        assert result["email"] == "newuser@example.com"
        mock_supabase_client.auth.admin.create_user.assert_called_once()
        mock_supabase_client.table.assert_called_with('users')
    
    @pytest.mark.asyncio
    async def test_delete_user_success(self, user_service, mock_supabase_client):
        """ユーザー削除のテスト"""
        user_id = "user-to-delete"
        
        # モックのレスポンスを設定
        mock_db_response = Mock()
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_db_response
        
        mock_auth_response = Mock()
        mock_supabase_client.auth.admin.delete_user.return_value = mock_auth_response
        
        # 実行
        result = await user_service.delete_user(user_id)
        
        # アサーション
        assert result is True
        mock_supabase_client.table.assert_called_with('users')
        mock_supabase_client.table.return_value.delete.return_value.eq.assert_called_with('id', user_id)
        mock_supabase_client.auth.admin.delete_user.assert_called_with(user_id)
    
    @pytest.mark.asyncio
    async def test_update_user_with_data(self, user_service, mock_supabase_client):
        """ユーザー更新のテスト（データあり）"""
        user_id = "user-to-update"
        update_data = {"email": "updated@example.com", "name": "Updated Name"}
        
        # モックのレスポンスを設定
        mock_response = Mock()
        mock_response.data = [{
            "id": user_id,
            "email": "updated@example.com",
            "name": "Updated Name"
        }]
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        # 実行
        result = await user_service.update_user(user_id, update_data)
        
        # アサーション
        assert result["email"] == "updated@example.com"
        assert result["name"] == "Updated Name"
        mock_supabase_client.table.assert_called_with('users')
        mock_supabase_client.table.return_value.update.assert_called_with(update_data)