"""
AuthService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock, PropertyMock

from app.services.auth_service import AuthService
from app.core.exceptions import APIException
from tests.helpers.factories import make_user


class TestAuthService:
    """AuthService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.mock_auth_client = Mock()
        self.service = AuthService(
            user_repository=self.mock_repo,
            auth_client=self.mock_auth_client,
        )

    # ===== signin =====

    @pytest.mark.asyncio
    async def test_signin_success(self):
        """正常なサインイン"""
        mock_user = Mock()
        mock_user.id = "user-id-1"
        mock_user.email = "test@example.com"
        mock_user.created_at = "2024-01-01T00:00:00Z"
        mock_user.updated_at = "2024-01-01T00:00:00Z"
        mock_user.email_confirmed_at = "2024-01-01T00:00:00Z"
        mock_user.last_sign_in_at = "2024-01-01T00:00:00Z"

        mock_session = Mock()
        mock_session.access_token = "access-token-123"
        mock_session.expires_in = 3600
        mock_session.refresh_token = "refresh-token-123"

        mock_response = Mock()
        mock_response.session = mock_session
        mock_response.user = mock_user

        self.mock_auth_client.sign_in_with_password.return_value = mock_response
        self.mock_repo.get_user_by_email.return_value = make_user(name="Test User")

        result = await self.service.signin("test@example.com", "password123")

        assert result["access_token"] == "access-token-123"
        assert result["token_type"] == "bearer"
        assert result["refresh_token"] == "refresh-token-123"
        assert result["user"]["id"] == "user-id-1"
        assert result["user"]["name"] == "Test User"
        self.mock_auth_client.sign_in_with_password.assert_called_once_with(
            {"email": "test@example.com", "password": "password123"}
        )

    @pytest.mark.asyncio
    async def test_signin_no_session_raises(self):
        """セッションが返らない場合はAPIException"""
        mock_response = Mock()
        mock_response.session = None
        mock_response.user = Mock()
        self.mock_auth_client.sign_in_with_password.return_value = mock_response

        with pytest.raises(APIException):
            await self.service.signin("test@example.com", "password123")

    @pytest.mark.asyncio
    async def test_signin_invalid_credentials(self):
        """認証情報が無効な場合"""
        self.mock_auth_client.sign_in_with_password.side_effect = Exception(
            "Invalid login credentials"
        )

        with pytest.raises(APIException):
            await self.service.signin("bad@example.com", "wrong")

    @pytest.mark.asyncio
    async def test_signin_generic_error(self):
        """一般的なエラーの場合はINTERNAL_SERVER_ERROR"""
        self.mock_auth_client.sign_in_with_password.side_effect = Exception(
            "Some unknown error"
        )

        with pytest.raises(APIException):
            await self.service.signin("test@example.com", "password")

    # ===== signout =====

    @pytest.mark.asyncio
    async def test_signout_success(self):
        """正常なサインアウト"""
        self.mock_auth_client.sign_out.return_value = None

        result = await self.service.signout("access-token")

        assert result["message"] == "Successfully signed out"

    @pytest.mark.asyncio
    async def test_signout_error_returns_warning(self):
        """サインアウト失敗しても警告付きメッセージを返す"""
        self.mock_auth_client.sign_out.side_effect = Exception("Signout failed")

        result = await self.service.signout("access-token")

        assert result["message"] == "Signed out (with warnings)"

    # ===== refresh_token =====

    @pytest.mark.asyncio
    async def test_refresh_token_success(self):
        """正常なトークンリフレッシュ"""
        mock_session = Mock()
        mock_session.access_token = "new-access-token"
        mock_session.expires_in = 3600
        mock_session.refresh_token = "new-refresh-token"

        mock_response = Mock()
        mock_response.session = mock_session

        self.mock_auth_client.refresh_session.return_value = mock_response

        result = await self.service.refresh_token("old-refresh-token")

        assert result["access_token"] == "new-access-token"
        assert result["refresh_token"] == "new-refresh-token"
        assert result["token_type"] == "bearer"
        self.mock_auth_client.refresh_session.assert_called_once_with(
            "old-refresh-token"
        )

    @pytest.mark.asyncio
    async def test_refresh_token_no_session(self):
        """セッションが返らない場合"""
        mock_response = Mock()
        mock_response.session = None
        self.mock_auth_client.refresh_session.return_value = mock_response

        with pytest.raises(APIException):
            await self.service.refresh_token("bad-token")

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self):
        """無効なリフレッシュトークン"""
        self.mock_auth_client.refresh_session.side_effect = Exception(
            "Invalid refresh token"
        )

        with pytest.raises(APIException):
            await self.service.refresh_token("invalid-token")

    # ===== verify_token =====

    @pytest.mark.asyncio
    async def test_verify_token_success(self):
        """正常なトークン検証"""
        mock_user = Mock()
        mock_user.id = "user-id-1"
        mock_user.email = "test@example.com"
        mock_user.created_at = "2024-01-01T00:00:00Z"
        mock_user.updated_at = "2024-01-01T00:00:00Z"
        mock_user.email_confirmed_at = "2024-01-01T00:00:00Z"
        mock_user.last_sign_in_at = "2024-01-01T00:00:00Z"

        mock_response = Mock()
        mock_response.user = mock_user

        self.mock_auth_client.get_user.return_value = mock_response
        self.mock_repo.get_user_by_email.return_value = make_user(name="Test User")

        result = await self.service.verify_token("valid-token")

        assert result is not None
        assert result["id"] == "user-id-1"
        assert result["name"] == "Test User"

    @pytest.mark.asyncio
    async def test_verify_token_no_user(self):
        """ユーザーが見つからない場合はNone"""
        mock_response = Mock()
        mock_response.user = None

        self.mock_auth_client.get_user.return_value = mock_response

        result = await self.service.verify_token("invalid-token")

        assert result is None

    @pytest.mark.asyncio
    async def test_verify_token_exception(self):
        """検証でエラーが発生した場合はNone"""
        self.mock_auth_client.get_user.side_effect = Exception("Token error")

        result = await self.service.verify_token("error-token")

        assert result is None

    # ===== reset_password =====

    @pytest.mark.asyncio
    async def test_reset_password_success(self):
        """正常なパスワードリセット"""
        self.mock_auth_client.reset_password_email.return_value = None

        result = await self.service.reset_password("test@example.com")

        assert result["message"] == "Password reset email sent"

    @pytest.mark.asyncio
    async def test_reset_password_nonexistent_email(self):
        """存在しないメールでもセキュリティのため成功を返す"""
        self.mock_auth_client.reset_password_email.side_effect = Exception(
            "User not found"
        )

        result = await self.service.reset_password("nonexistent@example.com")

        assert result["message"] == "Password reset email sent"

    # ===== update_password =====

    @pytest.mark.asyncio
    async def test_update_password_success(self):
        """正常なパスワード更新"""
        mock_user = Mock()
        mock_user.id = "user-id-1"

        mock_response = Mock()
        mock_response.user = mock_user

        self.mock_auth_client.update_user.return_value = mock_response

        result = await self.service.update_password("token", "newPassword123")

        assert result["message"] == "Password updated successfully"

    @pytest.mark.asyncio
    async def test_update_password_invalid_token(self):
        """無効なトークンでパスワード更新"""
        self.mock_auth_client.update_user.side_effect = Exception("Invalid token")

        with pytest.raises(APIException):
            await self.service.update_password("bad-token", "newPassword")
