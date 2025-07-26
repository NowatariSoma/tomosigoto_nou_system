from typing import Dict, Any, Optional
import logging
from .client import SupabaseClient
from .session import SessionManager
from .password_policy import PasswordPolicy


logger = logging.getLogger(__name__)


class AuthService:
    """認証サービスの中核クラス"""
    
    def __init__(
        self,
        supabase_client: SupabaseClient,
        session_manager: SessionManager,
        password_policy: PasswordPolicy,
        email_service: Optional[Any] = None
    ):
        """サービスの初期化"""
        self.client = supabase_client
        self.session_manager = session_manager
        self.password_policy = password_policy
        self.email_service = email_service
        self._logger = logger
    
    async def register_user(
        self,
        email: str,
        password: str,
        user_data: dict = None,
        user_agent: str = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """ユーザー登録処理"""
        try:
            # パスワード検証
            validation_result = self.password_policy.validate_password(password)
            if not validation_result.is_valid:
                return {
                    "success": False,
                    "errors": validation_result.errors,
                    "message": "パスワードがポリシーに適合していません"
                }
            
            # Supabaseでユーザー登録
            auth_response = await self.client.sign_up(email, password, user_data)
            
            # セッション作成
            session = await self.session_manager.create_session(
                user_id=auth_response["user"]["id"],
                jwt=auth_response["access_token"],
                user_agent=user_agent,
                ip_address=ip_address
            )
            
            self._logger.info(f"User registered successfully: {email}")
            
            return {
                "success": True,
                "user": auth_response["user"],
                "access_token": auth_response["access_token"],
                "refresh_token": auth_response["refresh_token"],
                "session_id": session.session_id,
                "expires_in": auth_response.get("expires_in", 3600)
            }
            
        except Exception as e:
            self._logger.error(f"User registration failed for {email}: {str(e)}")
            return {
                "success": False,
                "message": "ユーザー登録に失敗しました",
                "error": str(e)
            }
    
    async def authenticate_user(
        self,
        email: str,
        password: str,
        user_agent: str = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """ユーザー認証"""
        try:
            # Supabaseでユーザー認証
            auth_response = await self.client.sign_in(email, password)
            
            # セッション作成
            session = await self.session_manager.create_session(
                user_id=auth_response["user"]["id"],
                jwt=auth_response["access_token"],
                user_agent=user_agent,
                ip_address=ip_address
            )
            
            self._logger.info(f"User authenticated successfully: {email}")
            
            return {
                "success": True,
                "user": auth_response["user"],
                "access_token": auth_response["access_token"],
                "refresh_token": auth_response["refresh_token"],
                "session_id": session.session_id,
                "expires_in": auth_response.get("expires_in", 3600)
            }
            
        except Exception as e:
            self._logger.error(f"User authentication failed for {email}: {str(e)}")
            return {
                "success": False,
                "message": "認証に失敗しました",
                "error": str(e)
            }
    
    async def logout_user(self, jwt: str) -> bool:
        """ログアウト処理"""
        try:
            # JWTからユーザーIDを取得
            user_info = self.client.get_user_from_jwt(jwt)
            user_id = user_info["id"]
            
            # Supabaseでサインアウト
            await self.client.sign_out(jwt)
            
            # 全セッション終了
            await self.session_manager.terminate_all_sessions(user_id)
            
            self._logger.info(f"User logged out successfully: {user_id}")
            return True
            
        except Exception as e:
            self._logger.error(f"User logout failed: {str(e)}")
            return False
    
    async def request_password_reset(self, email: str) -> bool:
        """パスワードリセット要求処理"""
        try:
            # Supabaseでパスワードリセット要求
            result = await self.client.reset_password(email)
            
            # メール送信（実装されている場合）
            if result and self.email_service:
                await self.email_service.send_password_reset_email(email)
            
            self._logger.info(f"Password reset requested for: {email}")
            return result
            
        except Exception as e:
            self._logger.error(f"Password reset request failed for {email}: {str(e)}")
            return False
    
    async def confirm_password_reset(self, token: str, new_password: str) -> bool:
        """パスワードリセット確認処理"""
        try:
            # パスワード検証
            validation_result = self.password_policy.validate_password(new_password)
            if not validation_result.is_valid:
                return False
            
            # Supabaseでパスワードリセット確認
            result = await self.client.confirm_reset(token, new_password)
            
            self._logger.info("Password reset confirmed successfully")
            return result
            
        except Exception as e:
            self._logger.error(f"Password reset confirmation failed: {str(e)}")
            return False
    
    async def verify_jwt(self, jwt: str) -> Dict[str, Any]:
        """JWTトークン検証"""
        try:
            # JWTトークン検証
            payload = self.client.verify_jwt(jwt)
            
            # セッション検証（オプション）
            # session_valid = await self.session_manager.validate_session(session_id, jwt)
            
            return {
                "valid": True,
                "payload": payload
            }
            
        except Exception as e:
            self._logger.error(f"JWT verification failed: {str(e)}")
            return {
                "valid": False,
                "error": str(e)
            }
    
    async def refresh_auth_token(self, refresh_token: str) -> Dict[str, Any]:
        """認証トークン更新"""
        try:
            # Supabaseでトークン更新
            auth_response = await self.client.refresh_token(refresh_token)
            
            # セッション更新（セッションIDがある場合）
            # session = await self.session_manager.refresh_session(session_id, auth_response["access_token"])
            
            self._logger.info("Auth token refreshed successfully")
            
            return {
                "success": True,
                "access_token": auth_response["access_token"],
                "refresh_token": auth_response["refresh_token"],
                "expires_in": auth_response.get("expires_in", 3600)
            }
            
        except Exception as e:
            self._logger.error(f"Token refresh failed: {str(e)}")
            return {
                "success": False,
                "message": "トークン更新に失敗しました",
                "error": str(e)
            }
    
    async def get_user_sessions(self, user_id: str) -> Dict[str, Any]:
        """ユーザーのアクティブセッション取得"""
        try:
            sessions = await self.session_manager.get_active_sessions(user_id)
            
            return {
                "success": True,
                "sessions": [session.to_dict() for session in sessions]
            }
            
        except Exception as e:
            self._logger.error(f"Get user sessions failed for {user_id}: {str(e)}")
            return {
                "success": False,
                "message": "セッション取得に失敗しました",
                "error": str(e)
            }
    
    async def terminate_session(self, session_id: str) -> bool:
        """特定のセッション終了"""
        try:
            result = await self.session_manager.terminate_session(session_id)
            
            if result:
                self._logger.info(f"Session terminated successfully: {session_id}")
            
            return result
            
        except Exception as e:
            self._logger.error(f"Session termination failed for {session_id}: {str(e)}")
            return False