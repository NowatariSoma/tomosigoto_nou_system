import pytest
from unittest.mock import patch, Mock, MagicMock
from supabase import Client
from app.core.supabase import get_supabase


class TestGetSupabase:
    """get_supabase関数のテストケース"""

    @patch('app.core.supabase.settings')
    @patch('app.core.supabase.create_client')
    def test_get_supabase_with_service_role_key(self, mock_create_client, mock_settings):
        """サービスロールキーが設定されている場合のテスト"""
        # settingsをモック
        mock_settings.SUPABASE_URL = "https://test.supabase.co"
        mock_settings.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key"
        mock_settings.SUPABASE_ANON_KEY = "test-anon-key"
        
        # モックのクライアントを返すように設定
        mock_client = Mock(spec=Client)
        mock_create_client.return_value = mock_client
        
        # 関数を実行
        result = get_supabase()
        
        # アサーション
        assert result == mock_client
        mock_create_client.assert_called_once_with(
            "https://test.supabase.co",
            "test-service-role-key"  # サービスロールキーが優先される
        )
    
    @patch('app.core.supabase.settings')
    @patch('app.core.supabase.create_client')
    def test_get_supabase_with_anon_key_only(self, mock_create_client, mock_settings):
        """アノンキーのみが設定されている場合のテスト"""
        # settingsをモック
        mock_settings.SUPABASE_URL = "https://test.supabase.co"
        mock_settings.SUPABASE_SERVICE_ROLE_KEY = None
        mock_settings.SUPABASE_ANON_KEY = "test-anon-key"
        
        # モックのクライアントを返すように設定
        mock_client = Mock(spec=Client)
        mock_create_client.return_value = mock_client
        
        # 関数を実行
        result = get_supabase()
        
        # アサーション
        assert result == mock_client
        mock_create_client.assert_called_once_with(
            "https://test.supabase.co",
            "test-anon-key"
        )
    
    @patch('app.core.supabase.settings')
    def test_get_supabase_missing_url(self, mock_settings):
        """SUPABASE_URLが設定されていない場合のテスト"""
        # settingsをモック
        mock_settings.SUPABASE_URL = ""
        mock_settings.SUPABASE_SERVICE_ROLE_KEY = "test-key"
        
        with pytest.raises(ValueError, match="SUPABASE_URL must be set"):
            get_supabase()
    
    @patch('app.core.supabase.settings')
    def test_get_supabase_missing_api_key(self, mock_settings):
        """APIキーが設定されていない場合のテスト"""
        # settingsをモック
        mock_settings.SUPABASE_URL = "https://test.supabase.co"
        mock_settings.SUPABASE_SERVICE_ROLE_KEY = None
        mock_settings.SUPABASE_ANON_KEY = None
        
        with pytest.raises(ValueError, match="SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set"):
            get_supabase()