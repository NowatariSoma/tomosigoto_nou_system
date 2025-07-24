import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from fastapi import HTTPException, status
from supabase import PostgrestAPIError, AuthError

from app.services.supabase_service import SupabaseService


class TestSupabaseService:
    """Test cases for SupabaseService"""

    def test_init_missing_url(self, monkeypatch):
        """Test initialization fails without SUPABASE_URL"""
        monkeypatch.delenv("SUPABASE_URL", raising=False)
        
        with pytest.raises(ValueError, match="SUPABASE_URL must be set"):
            SupabaseService()

    def test_init_missing_api_key(self, monkeypatch):
        """Test initialization fails without API key"""
        monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
        monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
        monkeypatch.delenv("SUPABASE_ANON_KEY", raising=False)
        
        with pytest.raises(ValueError, match="SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set"):
            SupabaseService()

    @patch('app.services.supabase_service.create_client')
    def test_init_success(self, mock_create_client, setup_test_env):
        """Test successful initialization"""
        mock_client = Mock()
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        
        assert service.supabase == mock_client
        mock_create_client.assert_called_once_with(
            "https://test.supabase.co", 
            "test-service-role-key"
        )

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_all_users_success(self, mock_create_client, sample_users, setup_test_env):
        """Test successful get_all_users"""
        mock_client = Mock()
        mock_table = Mock()
        mock_response = Mock()
        mock_response.data = sample_users
        
        mock_table.select.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_all_users()
        
        assert result == sample_users
        mock_client.table.assert_called_with('users')
        mock_table.select.assert_called_with('*')

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_all_users_empty(self, mock_create_client, setup_test_env):
        """Test get_all_users with no users"""
        mock_client = Mock()
        mock_table = Mock()
        mock_response = Mock()
        mock_response.data = []
        
        mock_table.select.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_all_users()
        
        assert result == []

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_all_users_database_error(self, mock_create_client, setup_test_env):
        """Test get_all_users with database error"""
        mock_client = Mock()
        mock_table = Mock()
        
        mock_table.select.return_value.execute.side_effect = PostgrestAPIError("Database error")
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        
        with pytest.raises(HTTPException) as exc_info:
            await service.get_all_users()
        
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Database connection error" in str(exc_info.value.detail)

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, mock_create_client, sample_user, setup_test_env):
        """Test successful get_user_by_id"""
        mock_client = Mock()
        mock_table = Mock()
        mock_response = Mock()
        mock_response.data = [sample_user]
        
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_user_by_id("test-user-id")
        
        assert result == sample_user
        mock_client.table.assert_called_with('users')
        mock_table.select.assert_called_with('*')

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, mock_create_client, setup_test_env):
        """Test get_user_by_id with user not found"""
        mock_client = Mock()
        mock_table = Mock()
        mock_response = Mock()
        mock_response.data = []
        
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_user_by_id("nonexistent-id")
        
        assert result is None

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_verify_jwt_token_success(self, mock_create_client, setup_test_env):
        """Test successful JWT token verification"""
        mock_client = Mock()
        mock_auth = Mock()
        mock_user = Mock()
        mock_user.dict.return_value = {"id": "user123", "email": "test@example.com"}
        mock_response = Mock()
        mock_response.user = mock_user
        
        mock_auth.get_user.return_value = mock_response
        mock_client.auth = mock_auth
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.verify_jwt_token("valid-token")
        
        assert result == {"id": "user123", "email": "test@example.com"}
        mock_auth.get_user.assert_called_with("valid-token")

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_verify_jwt_token_invalid(self, mock_create_client, setup_test_env):
        """Test JWT token verification with invalid token"""
        mock_client = Mock()
        mock_auth = Mock()
        mock_auth.get_user.side_effect = Exception("Invalid token")
        mock_client.auth = mock_auth
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.verify_jwt_token("invalid-token")
        
        assert result is None

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_create_user_success(self, mock_create_client, setup_test_env):
        """Test successful user creation"""
        mock_client = Mock()
        mock_auth = Mock()
        mock_admin = Mock()
        mock_table = Mock()
        
        # Mock auth user creation
        mock_user = Mock()
        mock_user.id = "new-user-id"
        mock_user.created_at = None
        mock_user.updated_at = None
        mock_auth_response = Mock()
        mock_auth_response.user = mock_user
        
        mock_admin.create_user.return_value = mock_auth_response
        mock_auth.admin = mock_admin
        mock_client.auth = mock_auth
        
        # Mock database insertion
        mock_db_response = Mock()
        mock_db_response.data = [{
            "id": "new-user-id",
            "email": "new@example.com",
            "created_at": None,
            "updated_at": None
        }]
        mock_table.insert.return_value.execute.return_value = mock_db_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        user_data = {"email": "new@example.com", "password": "password123"}
        service = SupabaseService()
        result = await service.create_user(user_data)
        
        assert result["id"] == "new-user-id"
        assert result["email"] == "new@example.com"
        mock_admin.create_user.assert_called_once()
        mock_table.insert.assert_called_once()

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_create_user_auth_failure(self, mock_create_client, setup_test_env):
        """Test user creation with auth failure"""
        mock_client = Mock()
        mock_auth = Mock()
        mock_admin = Mock()
        
        mock_auth_response = Mock()
        mock_auth_response.user = None
        mock_admin.create_user.return_value = mock_auth_response
        mock_auth.admin = mock_admin
        mock_client.auth = mock_auth
        mock_create_client.return_value = mock_client
        
        user_data = {"email": "new@example.com", "password": "password123"}
        service = SupabaseService()
        
        with pytest.raises(HTTPException) as exc_info:
            await service.create_user(user_data)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert "Failed to create user" in str(exc_info.value.detail)

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_delete_user_success(self, mock_create_client, setup_test_env):
        """Test successful user deletion"""
        mock_client = Mock()
        mock_table = Mock()
        mock_auth = Mock()
        mock_admin = Mock()
        
        # Mock database deletion
        mock_db_response = Mock()
        mock_table.delete.return_value.eq.return_value.execute.return_value = mock_db_response
        mock_client.table.return_value = mock_table
        
        # Mock auth deletion
        mock_admin.delete_user.return_value = Mock()
        mock_auth.admin = mock_admin
        mock_client.auth = mock_auth
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.delete_user("user-to-delete")
        
        assert result is True
        mock_table.delete.assert_called_once()
        mock_admin.delete_user.assert_called_with("user-to-delete")

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_update_user_success(self, mock_create_client, setup_test_env):
        """Test successful user update"""
        mock_client = Mock()
        mock_table = Mock()
        
        updated_user = {
            "id": "user-to-update",
            "email": "updated@example.com",
            "name": "Updated Name"
        }
        mock_response = Mock()
        mock_response.data = [updated_user]
        
        mock_table.update.return_value.eq.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        update_data = {"email": "updated@example.com", "name": "Updated Name"}
        result = await service.update_user("user-to-update", update_data)
        
        assert result == updated_user
        mock_table.update.assert_called_once()

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_update_user_no_data(self, mock_create_client, setup_test_env):
        """Test user update with no update data"""
        mock_client = Mock()
        mock_table = Mock()
        mock_create_client.return_value = mock_client
        
        # Mock get_user_by_id call
        existing_user = {"id": "user-to-update", "email": "existing@example.com"}
        mock_response = Mock()
        mock_response.data = [existing_user]
        mock_table.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        
        service = SupabaseService()
        result = await service.update_user("user-to-update", {})
        
        assert result == existing_user

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_table_list_success(self, mock_create_client, setup_test_env):
        """Test successful table list retrieval"""
        mock_client = Mock()
        mock_table = Mock()
        mock_response = Mock()
        mock_response.data = [{"id": "1"}]
        
        mock_table.select.return_value.limit.return_value.execute.return_value = mock_response
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_table_list()
        
        assert result == ['users']

    @patch('app.services.supabase_service.create_client')
    @pytest.mark.asyncio
    async def test_get_table_list_error(self, mock_create_client, setup_test_env):
        """Test table list retrieval with error"""
        mock_client = Mock()
        mock_table = Mock()
        
        mock_table.select.return_value.limit.return_value.execute.side_effect = Exception("Error")
        mock_client.table.return_value = mock_table
        mock_create_client.return_value = mock_client
        
        service = SupabaseService()
        result = await service.get_table_list()
        
        assert result == []