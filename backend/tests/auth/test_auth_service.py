import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.auth.service import AuthService
from app.auth.client import SupabaseClient
from app.auth.session import SessionManager
from app.auth.password_policy import PasswordPolicy


class TestAuthService:
    """AuthServiceクラスのテストクラス"""
    
    def setup_method(self):
        """各テストの前処理"""
        # モックオブジェクトを作成
        self.mock_supabase_client = Mock(spec=SupabaseClient)
        self.mock_session_manager = Mock(spec=SessionManager)
        self.mock_password_policy = Mock(spec=PasswordPolicy)
        self.mock_email_service = Mock()
        
        # AuthServiceのインスタンスを作成
        self.auth_service = AuthService(
            supabase_client=self.mock_supabase_client,
            session_manager=self.mock_session_manager,
            password_policy=self.mock_password_policy,
            email_service=self.mock_email_service
        )
    
    @pytest.mark.asyncio
    async def test_register_user_success(self):
        """ユーザー登録成功テスト"""
        # モックの設定
        email = "test@example.com"
        password = "MyStr0ng@Password123"
        user_data = {"name": "テストユーザー"}
        
        # パスワード検証成功をモック
        from app.auth.password_policy import ValidationResult
        self.mock_password_policy.validate_password.return_value = ValidationResult(is_valid=True)
        
        # Supabaseサインアップ成功をモック
        mock_auth_response = {
            "user": {
                "id": "user123",
                "email": email,
                "user_metadata": user_data
            },
            "access_token": "access_token_here",
            "refresh_token": "refresh_token_here"
        }
        self.mock_supabase_client.sign_up = AsyncMock(return_value=mock_auth_response)
        
        # セッション作成成功をモック
        from app.auth.session import Session
        mock_session = Session(user_id="user123", jwt="access_token_here")
        self.mock_session_manager.create_session = AsyncMock(return_value=mock_session)
        
        # テスト実行
        result = await self.auth_service.register_user(email, password, user_data)
        
        # アサーション
        assert result["success"] == True
        assert result["user"]["id"] == "user123"
        assert result["user"]["email"] == email
        assert "access_token" in result
        assert "refresh_token" in result
        
        # モックが正しく呼ばれたかチェック
        self.mock_password_policy.validate_password.assert_called_once_with(password)
        self.mock_supabase_client.sign_up.assert_called_once_with(email, password, user_data)
        self.mock_session_manager.create_session.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_register_user_weak_password(self):
        """弱いパスワードでのユーザー登録失敗テスト"""
        email = "test@example.com"
        weak_password = "weak"
        
        # パスワード検証失敗をモック
        from app.auth.password_policy import ValidationResult
        validation_result = ValidationResult(
            is_valid=False, 
            errors=["パスワードは8文字以上である必要があります"]
        )
        self.mock_password_policy.validate_password.return_value = validation_result
        
        # テスト実行
        result = await self.auth_service.register_user(email, weak_password)
        
        # アサーション
        assert result["success"] == False
        assert "パスワードは8文字以上である必要があります" in result["errors"]
        
        # Supabaseが呼ばれていないことを確認
        self.mock_supabase_client.sign_up.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self):
        """ユーザー認証成功テスト"""
        email = "test@example.com"
        password = "MyStr0ng@Password123"
        
        # Supabaseサインイン成功をモック
        mock_auth_response = {
            "user": {
                "id": "user123",
                "email": email
            },
            "access_token": "access_token_here",
            "refresh_token": "refresh_token_here"
        }
        self.mock_supabase_client.sign_in = AsyncMock(return_value=mock_auth_response)
        
        # セッション作成成功をモック
        from app.auth.session import Session
        mock_session = Session(user_id="user123", jwt="access_token_here")
        self.mock_session_manager.create_session = AsyncMock(return_value=mock_session)
        
        # テスト実行
        result = await self.auth_service.authenticate_user(email, password)
        
        # アサーション
        assert result["success"] == True
        assert result["user"]["id"] == "user123"
        assert result["user"]["email"] == email
        assert "access_token" in result
        assert "refresh_token" in result
        
        # モックが正しく呼ばれたかチェック
        self.mock_supabase_client.sign_in.assert_called_once_with(email, password)
        self.mock_session_manager.create_session.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_credentials(self):
        """無効な認証情報でのログイン失敗テスト"""
        email = "test@example.com"
        wrong_password = "wrong_password"
        
        # Supabaseサインイン失敗をモック
        self.mock_supabase_client.sign_in = AsyncMock(side_effect=Exception("Invalid credentials"))
        
        # テスト実行
        result = await self.auth_service.authenticate_user(email, wrong_password)
        
        # アサーション
        assert result["success"] == False
        assert "認証に失敗しました" in result["message"]
        
        # セッションが作成されていないことを確認
        self.mock_session_manager.create_session.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_logout_user_success(self):
        """ログアウト成功テスト"""
        jwt = "valid_jwt_token"
        
        # JWTからユーザーIDを取得するモック
        self.mock_supabase_client.get_user_from_jwt = Mock(return_value={"id": "user123"})
        
        # Supabaseサインアウト成功をモック
        self.mock_supabase_client.sign_out = AsyncMock(return_value=True)
        
        # セッション終了成功をモック
        self.mock_session_manager.terminate_all_sessions = AsyncMock(return_value=True)
        
        # テスト実行
        result = await self.auth_service.logout_user(jwt)
        
        # アサーション
        assert result == True
        
        # モックが正しく呼ばれたかチェック
        self.mock_supabase_client.sign_out.assert_called_once_with(jwt)
        self.mock_session_manager.terminate_all_sessions.assert_called_once_with("user123")
    
    @pytest.mark.asyncio
    async def test_request_password_reset_success(self):
        """パスワードリセット要求成功テスト"""
        email = "test@example.com"
        
        # Supabaseパスワードリセット成功をモック
        self.mock_supabase_client.reset_password = AsyncMock(return_value=True)
        
        # メール送信成功をモック
        self.mock_email_service.send_password_reset_email = AsyncMock(return_value=True)
        
        # テスト実行
        result = await self.auth_service.request_password_reset(email)
        
        # アサーション
        assert result == True
        
        # モックが正しく呼ばれたかチェック
        self.mock_supabase_client.reset_password.assert_called_once_with(email)
    
    @pytest.mark.asyncio
    async def test_verify_jwt_valid_token(self):
        """有効なJWTトークンの検証テスト"""
        jwt = "valid_jwt_token"
        
        # JWT検証成功をモック
        mock_payload = {
            "user_id": "user123",
            "email": "test@example.com",
            "exp": 1234567890
        }
        self.mock_supabase_client.verify_jwt = Mock(return_value=mock_payload)
        
        # セッション検証成功をモック
        self.mock_session_manager.validate_session = AsyncMock(return_value=True)
        
        # テスト実行
        result = await self.auth_service.verify_jwt(jwt)
        
        # アサーション
        assert result["valid"] == True
        assert result["payload"]["user_id"] == "user123"
        assert result["payload"]["email"] == "test@example.com"
        
        # モックが正しく呼ばれたかチェック
        self.mock_supabase_client.verify_jwt.assert_called_once_with(jwt)
    
    @pytest.mark.asyncio
    async def test_verify_jwt_invalid_token(self):
        """無効なJWTトークンの検証テスト"""
        jwt = "invalid_jwt_token"
        
        # JWT検証失敗をモック
        self.mock_supabase_client.verify_jwt = Mock(side_effect=Exception("Invalid token"))
        
        # テスト実行
        result = await self.auth_service.verify_jwt(jwt)
        
        # アサーション
        assert result["valid"] == False
        assert "Invalid token" in result["error"]
    
    @pytest.mark.asyncio
    async def test_refresh_auth_token_success(self):
        """認証トークン更新成功テスト"""
        refresh_token = "valid_refresh_token"
        
        # Supabaseトークン更新成功をモック
        mock_auth_response = {
            "user": {
                "id": "user123",
                "email": "test@example.com"
            },
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token"
        }
        self.mock_supabase_client.refresh_token = AsyncMock(return_value=mock_auth_response)
        
        # セッション更新成功をモック
        from app.auth.session import Session
        mock_session = Session(user_id="user123", jwt="new_access_token")
        self.mock_session_manager.refresh_session = AsyncMock(return_value=mock_session)
        
        # テスト実行
        result = await self.auth_service.refresh_auth_token(refresh_token)
        
        # アサーション
        assert result["success"] == True
        assert result["access_token"] == "new_access_token"
        assert result["refresh_token"] == "new_refresh_token"
        
        # モックが正しく呼ばれたかチェック
        self.mock_supabase_client.refresh_token.assert_called_once_with(refresh_token)