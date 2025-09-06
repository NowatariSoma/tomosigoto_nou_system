"""
認証関連のスキーマ定義
"""
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse


class AuthRequest(BaseModel):
    """認証リクエスト用スキーマ"""
    email: str
    password: str


class TokenResponse(BaseModel):
    """トークンレスポンス用スキーマ"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None


class AuthResponse(BaseModel):
    """認証レスポンス用スキーマ"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


class RefreshTokenRequest(BaseModel):
    """リフレッシュトークンリクエスト用スキーマ"""
    refresh_token: str


class SignoutResponse(BaseModel):
    """サインアウトレスポンス用スキーマ"""
    message: str = "Successfully signed out"


class PasswordResetRequest(BaseModel):
    """パスワードリセットリクエスト用スキーマ"""
    email: str


class PasswordResetResponse(BaseModel):
    """パスワードリセットレスポンス用スキーマ"""
    message: str


class PasswordUpdateRequest(BaseModel):
    """パスワード更新リクエスト用スキーマ"""
    password: str
    access_token: str


class PasswordUpdateResponse(BaseModel):
    """パスワード更新レスポンス用スキーマ"""
    message: str