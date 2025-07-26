import httpx
import json
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging
from datetime import datetime


logger = logging.getLogger(__name__)


class AuthResponse(BaseModel):
    """認証レスポンスモデル"""
    user: Dict[str, Any]
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"


class User(BaseModel):
    """ユーザーモデル"""
    id: str
    email: str
    email_confirmed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_metadata: Dict[str, Any] = {}


class SupabaseClient:
    """Supabase認証APIのPythonラッパー"""
    
    def __init__(self, api_url: str, api_key: str, timeout: int = 10):
        """クライアントの初期化"""
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        
        # HTTP クライアントの設定
        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            headers={
                "apikey": self.api_key,
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        
        # Supabase Auth API のベースURL
        self._base_url = f"{self.api_url}/auth/v1"
        self._auth_path = "/auth/v1"
    
    async def __aenter__(self):
        """非同期コンテキストマネージャー"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """非同期コンテキストマネージャー終了"""
        await self._http_client.aclose()
    
    async def sign_up(self, email: str, password: str, user_data: dict = None) -> Dict[str, Any]:
        """ユーザー登録"""
        try:
            payload = {
                "email": email,
                "password": password
            }
            
            if user_data:
                payload["data"] = user_data
            
            response = await self._http_client.post(
                f"{self._base_url}/signup",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Supabase signup failed: {response.status_code} - {response.text}")
                raise Exception(f"Signup failed: {response.text}")
                
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during signup: {e}")
            raise Exception(f"Network error during signup: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during signup: {e}")
            raise
    
    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """ログイン処理"""
        try:
            payload = {
                "email": email,
                "password": password
            }
            
            response = await self._http_client.post(
                f"{self._base_url}/token?grant_type=password",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Supabase signin failed: {response.status_code} - {response.text}")
                raise Exception(f"Invalid credentials")
                
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during signin: {e}")
            raise Exception(f"Network error during signin: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during signin: {e}")
            raise
    
    async def sign_out(self, jwt: str) -> bool:
        """ログアウト処理"""
        try:
            headers = {
                "Authorization": f"Bearer {jwt}",
                "apikey": self.api_key
            }
            
            response = await self._http_client.post(
                f"{self._base_url}/logout",
                headers=headers
            )
            
            return response.status_code == 204
            
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during signout: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during signout: {e}")
            return False
    
    async def reset_password(self, email: str) -> bool:
        """パスワードリセット要求"""
        try:
            payload = {
                "email": email
            }
            
            response = await self._http_client.post(
                f"{self._base_url}/recover",
                json=payload
            )
            
            return response.status_code == 200
            
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during password reset: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during password reset: {e}")
            return False
    
    async def confirm_reset(self, token: str, new_password: str) -> bool:
        """パスワードリセット確認"""
        try:
            payload = {
                "token": token,
                "password": new_password,
                "type": "recovery"
            }
            
            response = await self._http_client.post(
                f"{self._base_url}/verify",
                json=payload
            )
            
            return response.status_code == 200
            
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during password reset confirmation: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during password reset confirmation: {e}")
            return False
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """トークン更新"""
        try:
            payload = {
                "refresh_token": refresh_token
            }
            
            response = await self._http_client.post(
                f"{self._base_url}/token?grant_type=refresh_token",
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Supabase token refresh failed: {response.status_code} - {response.text}")
                raise Exception(f"Token refresh failed: {response.text}")
                
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during token refresh: {e}")
            raise Exception(f"Network error during token refresh: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}")
            raise
    
    async def get_user(self, user_id: str, jwt: str) -> Dict[str, Any]:
        """ユーザー情報取得"""
        try:
            headers = {
                "Authorization": f"Bearer {jwt}",
                "apikey": self.api_key
            }
            
            response = await self._http_client.get(
                f"{self._base_url}/user",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Supabase get user failed: {response.status_code} - {response.text}")
                raise Exception(f"Get user failed: {response.text}")
                
        except httpx.RequestError as e:
            logger.error(f"HTTP request error during get user: {e}")
            raise Exception(f"Network error during get user: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during get user: {e}")
            raise
    
    def get_user_from_jwt(self, jwt: str) -> Dict[str, Any]:
        """JWTからユーザー情報を取得（デコードのみ、検証なし）"""
        try:
            import base64
            import json
            
            # JWTのペイロード部分をデコード（検証なし）
            parts = jwt.split('.')
            if len(parts) != 3:
                raise Exception("Invalid JWT format")
            
            # base64urlデコード
            payload = parts[1]
            # パディングを追加
            payload += '=' * (4 - len(payload) % 4)
            decoded_bytes = base64.urlsafe_b64decode(payload)
            payload_data = json.loads(decoded_bytes)
            
            return {
                "id": payload_data.get("sub"),
                "email": payload_data.get("email"),
                "exp": payload_data.get("exp")
            }
            
        except Exception as e:
            logger.error(f"Error decoding JWT: {e}")
            raise Exception(f"Invalid JWT token: {str(e)}")
    
    def verify_jwt(self, jwt: str) -> Dict[str, Any]:
        """JWTトークン検証（簡易版）"""
        try:
            # 実際の実装では、Supabaseの公開鍵でJWTを検証する必要がある
            # ここでは簡易的にデコードのみ実行
            user_info = self.get_user_from_jwt(jwt)
            
            # 有効期限チェック
            import time
            current_time = int(time.time())
            if user_info.get("exp", 0) < current_time:
                raise Exception("Token has expired")
            
            return {
                "user_id": user_info["id"],
                "email": user_info["email"],
                "exp": user_info["exp"]
            }
            
        except Exception as e:
            logger.error(f"JWT verification failed: {e}")
            raise