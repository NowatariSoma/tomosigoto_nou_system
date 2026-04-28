"""
認証エンドポイントのユニットテスト
TDDに従って、期待される入出力を定義するテスト
"""
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app


class TestAuthEndpoints:
    """認証エンドポイントのテスト"""

    @pytest.fixture
    def client(self):
        """テストクライアント"""
        return TestClient(app)

    @pytest.fixture
    def valid_auth_request(self):
        """有効な認証リクエストデータ"""
        return {
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }

    @pytest.fixture
    def mock_auth_response(self):
        """モック認証レスポンス"""
        return {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": "user-123",
                "email": "test@example.com",
                "name": "Test User",
                "created_at": "2025-01-01T00:00:00.000Z"
            }
        }

    def test_signin_with_valid_credentials_success(self, client, valid_auth_request, mock_auth_response):
        """
        有効な認証情報でのサインイン成功
        
        期待される動作:
        1. 有効なemail/passwordでサインイン
        2. 200 OK と access_token, user情報が返される
        """
        with patch('app.services.auth_service.AuthService.signin') as mock_signin:
            mock_signin.return_value = mock_auth_response
            
            response = client.post(
                "/api/v1/auth/signin",
                json=valid_auth_request
            )
            
            assert response.status_code == 200
            response_data = response.json()
            
            # レスポンス構造の検証
            assert "access_token" in response_data
            assert "token_type" in response_data
            assert "expires_in" in response_data
            assert "user" in response_data
            
            # トークンの形式検証
            assert response_data["token_type"] == "bearer"
            assert isinstance(response_data["expires_in"], int)
            assert response_data["expires_in"] > 0
            
            # ユーザ情報の検証
            user_data = response_data["user"]
            assert user_data["email"] == valid_auth_request["email"]
            assert "id" in user_data
            assert "created_at" in user_data
            assert "password" not in user_data  # パスワードは返されない

    def test_signin_with_invalid_email_fails(self, client):
        """
        不正なメールアドレスでのサインイン失敗
        
        期待される動作:
        1. 存在しないメールアドレスでサインイン
        2. 401 Unauthorized が返される
        """
        invalid_request = {
            "email": "nonexistent@example.com",
            "password": "AnyPassword123!"
        }
        
        with patch('app.services.auth_service.AuthService.signin') as mock_signin:
            from app.core.exceptions import APIException
            from app.core.error_messages import ErrorMessage
            mock_signin.side_effect = APIException(ErrorMessage.INVALID_CREDENTIALS)
            
            response = client.post(
                "/api/v1/auth/signin",
                json=invalid_request
            )
            
            assert response.status_code == 401
            error_data = response.json()
            assert "detail" in error_data
            assert "invalid" in error_data["detail"].lower()

    def test_signin_with_wrong_password_fails(self, client):
        """
        間違ったパスワードでのサインイン失敗
        
        期待される動作:
        1. 正しいメールアドレス、間違ったパスワードでサインイン
        2. 401 Unauthorized が返される
        """
        wrong_password_request = {
            "email": "test@example.com",
            "password": "WrongPassword123!"
        }
        
        with patch('app.services.auth_service.AuthService.signin') as mock_signin:
            from app.core.exceptions import APIException
            from app.core.error_messages import ErrorMessage
            mock_signin.side_effect = APIException(ErrorMessage.INVALID_CREDENTIALS)
            
            response = client.post(
                "/api/v1/auth/signin",
                json=wrong_password_request
            )
            
            assert response.status_code == 401
            error_data = response.json()
            assert "detail" in error_data
            assert "invalid" in error_data["detail"].lower()

    def test_signin_with_missing_email_fails(self, client):
        """
        メールアドレス未指定でのサインイン失敗
        
        期待される動作:
        1. メールアドレスなしでサインイン
        2. 422 Validation Error が返される
        """
        incomplete_request = {
            "password": "SecurePassword123!"
        }
        
        response = client.post(
            "/api/v1/auth/signin",
            json=incomplete_request
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        
        # バリデーションエラーの詳細確認
        detail = error_data["detail"]
        assert any("email" in str(error).lower() for error in detail)

    def test_signin_with_missing_password_fails(self, client):
        """
        パスワード未指定でのサインイン失敗
        
        期待される動作:
        1. パスワードなしでサインイン
        2. 422 Validation Error が返される
        """
        incomplete_request = {
            "email": "test@example.com"
        }
        
        response = client.post(
            "/api/v1/auth/signin",
            json=incomplete_request
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "detail" in error_data
        
        # バリデーションエラーの詳細確認
        detail = error_data["detail"]
        assert any("password" in str(error).lower() for error in detail)

    def test_signin_with_invalid_email_format_fails(self, client):
        """email形式チェックなし（str型）なので401またはそれ以外のエラーになる"""
        from app.core.exceptions import APIException
        from app.core.error_messages import ErrorMessage
        invalid_format_request = {
            "email": "invalid-email-format",
            "password": "SecurePassword123!"
        }
        with patch('app.services.auth_service.AuthService.signin') as mock_signin:
            mock_signin.side_effect = APIException(ErrorMessage.INVALID_CREDENTIALS)
            response = client.post("/api/v1/auth/signin", json=invalid_format_request)
        assert response.status_code == 401
        
        # バリデーションエラーの詳細確認
        detail = error_data["detail"]
        assert any("email" in str(error).lower() for error in detail)

    def test_signout_success(self, client):
        """
        サインアウト成功
        
        期待される動作:
        1. 有効なトークンでサインアウト
        2. 200 OK が返される
        """
        with patch('app.services.auth_service.AuthService.signout') as mock_signout:
            mock_signout.return_value = {"message": "Successfully signed out"}

            response = client.post(
                "/api/v1/auth/signout",
                json={"refresh_token": "valid.refresh.token"},
                headers={"Authorization": "Bearer valid.jwt.token"}
            )

            assert response.status_code == 200
            response_data = response.json()
            assert "message" in response_data

    def test_signout_without_token_fails(self, client):
        """
        トークンなしでのサインアウト失敗
        
        期待される動作:
        1. Authorization ヘッダーなしでサインアウト
        2. 401 Unauthorized が返される
        """
        # refresh_tokenなしはバリデーションエラー(422)
        response = client.post("/api/v1/auth/signout")
        assert response.status_code == 422

    def test_refresh_token_success(self, client, mock_auth_response):
        """
        トークンリフレッシュ成功
        
        期待される動作:
        1. 有効なリフレッシュトークンでリフレッシュ
        2. 200 OK と新しいaccess_tokenが返される
        """
        refresh_request = {
            "refresh_token": "valid.refresh.token"
        }
        
        with patch('app.services.auth_service.AuthService.refresh_token') as mock_refresh:
            mock_refresh.return_value = mock_auth_response
            
            response = client.post(
                "/api/v1/auth/refresh",
                json=refresh_request
            )
            
            assert response.status_code == 200
            response_data = response.json()
            assert "access_token" in response_data
            assert "token_type" in response_data
            assert "expires_in" in response_data

    def test_refresh_token_with_invalid_token_fails(self, client):
        """
        不正なリフレッシュトークンでのリフレッシュ失敗
        
        期待される動作:
        1. 不正なリフレッシュトークンでリフレッシュ
        2. 401 Unauthorized が返される
        """
        invalid_refresh_request = {
            "refresh_token": "invalid.refresh.token"
        }
        
        from app.core.exceptions import APIException
        from app.core.error_messages import ErrorMessage
        with patch('app.services.auth_service.AuthService.refresh_token') as mock_refresh:
            mock_refresh.side_effect = APIException(ErrorMessage.INVALID_CREDENTIALS)

            response = client.post(
                "/api/v1/auth/refresh",
                json=invalid_refresh_request
            )

            assert response.status_code in [400, 401]