"""
認証関連のAPIエンドポイント
"""
from typing import Any, Dict

from app.api.deps import get_current_user
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.supabase import get_supabase
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AuthRequest,
    AuthResponse,
    RefreshTokenRequest,
    TokenResponse,
    SignoutResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordUpdateRequest,
    PasswordUpdateResponse
)
from app.services.auth_service import AuthService
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

router = APIRouter()
security = HTTPBearer()


def get_auth_service(
    supabase_client: Client = Depends(get_supabase),
) -> AuthService:
    """AuthServiceのインスタンスを依存性注入で取得"""
    user_repository = UserRepository(supabase_client)
    return AuthService(user_repository, supabase_client.auth)


@router.post("/signin", response_model=AuthResponse)
async def signin(
    auth_data: AuthRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ユーザーサインイン
    
    Args:
        auth_data: 認証情報（email, password）
        
    Returns:
        認証レスポンス（access_token, user情報）
        
    Raises:
        HTTPException: 認証失敗時
    """
    try:
        result = await auth_service.signin(auth_data.email, auth_data.password)
        return result
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/signout", response_model=SignoutResponse)
async def signout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ユーザーサインアウト
    
    Args:
        credentials: Bearerトークン
        
    Returns:
        サインアウト結果
    """
    try:
        result = await auth_service.signout(credentials.credentials)
        return result
    except Exception as e:
        # サインアウトは失敗しても成功扱い
        return {"message": "Signed out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    トークンリフレッシュ
    
    Args:
        refresh_data: リフレッシュトークン情報
        
    Returns:
        新しいトークン情報
        
    Raises:
        HTTPException: リフレッシュ失敗時
    """
    try:
        result = await auth_service.refresh_token(refresh_data.refresh_token)
        return result
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    reset_data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    パスワードリセット
    
    Args:
        reset_data: パスワードリセット情報（email）
        
    Returns:
        リセット結果
    """
    try:
        result = await auth_service.reset_password(reset_data.email)
        return result
    except Exception as e:
        # セキュリティのため、常に成功として返す
        return {"message": "Password reset email sent"}


@router.post("/update-password", response_model=PasswordUpdateResponse)
async def update_password(
    password_data: PasswordUpdateRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    パスワード更新
    
    Args:
        password_data: 新しいパスワード情報
        
    Returns:
        更新結果
        
    Raises:
        HTTPException: 更新失敗時
    """
    try:
        result = await auth_service.update_password(
            password_data.access_token,
            password_data.password
        )
        return result
    except APIException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    現在のユーザー情報を取得
    
    Args:
        current_user: 認証済みユーザー情報
        
    Returns:
        ユーザー情報
    """
    return current_user


@router.get("/verify")
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    トークン検証
    
    Args:
        credentials: Bearerトークン
        
    Returns:
        検証結果
        
    Raises:
        HTTPException: トークンが無効時
    """
    try:
        user = await auth_service.verify_token(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"valid": True, "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )