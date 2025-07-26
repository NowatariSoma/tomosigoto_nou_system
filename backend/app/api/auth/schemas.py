from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserCreate(BaseModel):
    """ユーザー作成リクエストスキーマ"""
    email: EmailStr = Field(..., description="メールアドレス")
    password: str = Field(..., min_length=8, description="パスワード（8文字以上）")
    user_data: Optional[Dict[str, Any]] = Field(None, description="追加のユーザーデータ")


class UserLogin(BaseModel):
    """ユーザーログインリクエストスキーマ"""
    email: EmailStr = Field(..., description="メールアドレス")
    password: str = Field(..., description="パスワード")


class EmailRequest(BaseModel):
    """メール送信リクエストスキーマ"""
    email: EmailStr = Field(..., description="メールアドレス")


class PasswordResetConfirm(BaseModel):
    """パスワードリセット確認リクエストスキーマ"""
    token: str = Field(..., description="リセットトークン")
    new_password: str = Field(..., min_length=8, description="新しいパスワード（8文字以上）")


class RefreshRequest(BaseModel):
    """トークン更新リクエストスキーマ"""
    refresh_token: str = Field(..., description="リフレッシュトークン")


class UserResponse(BaseModel):
    """ユーザー情報レスポンススキーマ"""
    id: str = Field(..., description="ユーザーID")
    email: str = Field(..., description="メールアドレス")
    email_confirmed_at: Optional[datetime] = Field(None, description="メール確認日時")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")
    user_metadata: Dict[str, Any] = Field(default_factory=dict, description="ユーザーメタデータ")


class AuthResponse(BaseModel):
    """認証レスポンススキーマ"""
    success: bool = Field(..., description="処理成功フラグ")
    user: Optional[UserResponse] = Field(None, description="ユーザー情報")
    access_token: Optional[str] = Field(None, description="アクセストークン")
    refresh_token: Optional[str] = Field(None, description="リフレッシュトークン")
    session_id: Optional[str] = Field(None, description="セッションID")
    expires_in: Optional[int] = Field(None, description="トークン有効期限（秒）")
    token_type: str = Field(default="bearer", description="トークンタイプ")


class ErrorResponse(BaseModel):
    """エラーレスポンススキーマ"""
    success: bool = Field(default=False, description="処理成功フラグ")
    message: str = Field(..., description="エラーメッセージ")
    errors: Optional[List[str]] = Field(None, description="詳細エラーリスト")
    error_code: Optional[str] = Field(None, description="エラーコード")


class ValidationErrorResponse(BaseModel):
    """バリデーションエラーレスポンススキーマ"""
    success: bool = Field(default=False, description="処理成功フラグ")
    message: str = Field(default="入力値が無効です", description="エラーメッセージ")
    errors: List[str] = Field(..., description="バリデーションエラーリスト")


class SuccessResponse(BaseModel):
    """成功レスポンススキーマ"""
    success: bool = Field(default=True, description="処理成功フラグ")
    message: str = Field(..., description="成功メッセージ")


class TokenPayload(BaseModel):
    """JWTトークンペイロードスキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    email: str = Field(..., description="メールアドレス")
    exp: int = Field(..., description="有効期限（Unix timestamp）")


class TokenVerificationResponse(BaseModel):
    """トークン検証レスポンススキーマ"""
    valid: bool = Field(..., description="トークン有効フラグ")
    payload: Optional[TokenPayload] = Field(None, description="トークンペイロード")
    error: Optional[str] = Field(None, description="エラーメッセージ")


class SessionInfo(BaseModel):
    """セッション情報スキーマ"""
    session_id: str = Field(..., description="セッションID")
    user_id: str = Field(..., description="ユーザーID")
    user_agent: Optional[str] = Field(None, description="ユーザーエージェント")
    ip_address: Optional[str] = Field(None, description="IPアドレス")
    created_at: datetime = Field(..., description="作成日時")
    expires_at: datetime = Field(..., description="有効期限")


class SessionListResponse(BaseModel):
    """セッション一覧レスポンススキーマ"""
    success: bool = Field(..., description="処理成功フラグ")
    sessions: List[SessionInfo] = Field(..., description="セッション一覧")


class PasswordPolicyInfo(BaseModel):
    """パスワードポリシー情報スキーマ"""
    min_length: int = Field(..., description="最小文字数")
    require_uppercase: bool = Field(..., description="大文字必須フラグ")
    require_lowercase: bool = Field(..., description="小文字必須フラグ")
    require_digit: bool = Field(..., description="数字必須フラグ")
    require_special: bool = Field(..., description="特殊文字必須フラグ")
    password_expiry_days: int = Field(..., description="パスワード有効期限（日）")


class PasswordValidationResponse(BaseModel):
    """パスワード検証レスポンススキーマ"""
    is_valid: bool = Field(..., description="検証結果")
    errors: List[str] = Field(default_factory=list, description="エラーリスト")
    message: str = Field(default="", description="メッセージ")


# API レスポンスの例
class Examples:
    """APIレスポンスの例"""
    
    AUTH_SUCCESS = {
        "success": True,
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "email_confirmed_at": "2024-01-01T12:00:00Z",
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z",
            "user_metadata": {}
        },
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "session_id": "session_550e8400-e29b-41d4-a716-446655440000",
        "expires_in": 3600,
        "token_type": "bearer"
    }
    
    AUTH_ERROR = {
        "success": False,
        "message": "認証に失敗しました",
        "error_code": "INVALID_CREDENTIALS"
    }
    
    VALIDATION_ERROR = {
        "success": False,
        "message": "入力値が無効です",
        "errors": [
            "パスワードは8文字以上である必要があります",
            "パスワードには大文字を含める必要があります"
        ]
    }
    
    SUCCESS_MESSAGE = {
        "success": True,
        "message": "処理が正常に完了しました"
    }