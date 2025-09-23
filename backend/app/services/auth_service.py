"""
認証関連のビジネスロジックを処理するサービスクラス
"""
import logging
from typing import Any, Dict, Optional
from datetime import datetime

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, SignoutResponse, TokenResponse
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class AuthService:
    """
    認証関連のビジネスロジックを処理するサービスクラス
    """

    def __init__(self, user_repository: UserRepository, auth_client):
        """
        Args:
            user_repository: UserRepositoryインスタンス
            auth_client: Supabase認証クライアント
        """
        self.repository = user_repository
        self.auth_client = auth_client

    async def signin(self, email: str, password: str) -> Dict[str, Any]:
        """
        ユーザーサインイン
        
        Args:
            email: メールアドレス
            password: パスワード
            
        Returns:
            認証レスポンス（トークン、ユーザー情報）
            
        Raises:
            APIException: 認証失敗時
        """
        try:
            # Supabase Authでサインイン
            response = self.auth_client.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not response.session or not response.user:
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            
            # DBからユーザー情報を取得（追加情報がある場合）
            db_user = await self.repository.find_by_email(email)
            
            # レスポンス用のユーザー情報を構築
            user_info = {
                "id": response.user.id,
                "email": response.user.email,
                "name": db_user.get("name") if db_user else None,
                "created_at": response.user.created_at,
                "updated_at": response.user.updated_at,
                "email_confirmed_at": response.user.email_confirmed_at,
                "last_sign_in_at": response.user.last_sign_in_at
            }
            
            auth_response = {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in or 3600,
                "refresh_token": response.session.refresh_token,
                "user": user_info
            }
            
            logger.info(f"User signed in successfully: {email}")
            return auth_response
            
        except Exception as e:
            logger.error(f"Sign in failed for {email}: {str(e)}")
            if "Invalid login credentials" in str(e):
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def signout(self, access_token: str) -> Dict[str, str]:
        """
        ユーザーサインアウト
        
        Args:
            access_token: アクセストークン
            
        Returns:
            サインアウト結果
        """
        try:
            # Supabase Authでサインアウト
            self.auth_client.sign_out()
            
            logger.info("User signed out successfully")
            return {"message": "Successfully signed out"}
            
        except Exception as e:
            logger.error(f"Sign out failed: {str(e)}")
            # サインアウトの失敗は致命的ではない
            return {"message": "Signed out (with warnings)"}

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        トークンリフレッシュ
        
        Args:
            refresh_token: リフレッシュトークン
            
        Returns:
            新しいトークン情報
            
        Raises:
            APIException: リフレッシュ失敗時
        """
        try:
            # Supabase Authでトークンリフレッシュ
            response = self.auth_client.refresh_session(refresh_token)
            
            if not response.session:
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            
            token_response = {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in or 3600,
                "refresh_token": response.session.refresh_token
            }
            
            logger.info("Token refreshed successfully")
            return token_response
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            if "Invalid refresh token" in str(e):
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def reset_password(self, email: str) -> Dict[str, str]:
        """
        パスワードリセット
        
        Args:
            email: メールアドレス
            
        Returns:
            リセット結果
        """
        try:
            # Supabase Authでパスワードリセット
            self.auth_client.reset_password_email(email)
            
            logger.info(f"Password reset email sent to: {email}")
            return {"message": "Password reset email sent"}
            
        except Exception as e:
            logger.error(f"Password reset failed for {email}: {str(e)}")
            # セキュリティのため、メールアドレスが存在しない場合も成功として返す
            return {"message": "Password reset email sent"}

    async def update_password(self, access_token: str, new_password: str) -> Dict[str, str]:
        """
        パスワード更新
        
        Args:
            access_token: アクセストークン
            new_password: 新しいパスワード
            
        Returns:
            更新結果
            
        Raises:
            APIException: 更新失敗時
        """
        try:
            # Supabase Authでパスワード更新
            response = self.auth_client.update_user(
                {"password": new_password},
                access_token
            )
            
            if not response.user:
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            
            logger.info(f"Password updated for user: {response.user.id}")
            return {"message": "Password updated successfully"}
            
        except Exception as e:
            logger.error(f"Password update failed: {str(e)}")
            if "Invalid token" in str(e):
                raise APIException(ErrorMessage.INVALID_CREDENTIALS)
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def verify_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        トークン検証
        
        Args:
            access_token: アクセストークン
            
        Returns:
            ユーザー情報、無効な場合はNone
        """
        try:
            response = self.auth_client.get_user(access_token)
            
            if hasattr(response, "user") and response.user:
                # DBからユーザー情報を取得
                db_user = await self.repository.find_by_email(response.user.email)
                
                user_info = {
                    "id": response.user.id,
                    "email": response.user.email,
                    "name": db_user.get("name") if db_user else None,
                    "created_at": response.user.created_at,
                    "updated_at": response.user.updated_at,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "last_sign_in_at": response.user.last_sign_in_at
                }
                
                return user_info
            else:
                return None
                
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            return None