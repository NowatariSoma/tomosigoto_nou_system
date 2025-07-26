from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
import logging

from .schemas import (
    UserCreate, UserLogin, EmailRequest, PasswordResetConfirm,
    RefreshRequest, AuthResponse, ErrorResponse, SuccessResponse,
    TokenVerificationResponse, SessionListResponse, Examples
)
from app.auth.service import AuthService
from app.auth.client import SupabaseClient
from app.auth.session import SessionManager
from app.auth.password_policy import PasswordPolicy


logger = logging.getLogger(__name__)

# セキュリティスキーム
security = HTTPBearer()

# ルーター作成
router = APIRouter(prefix="/auth", tags=["認証"])


# 依存関数
async def get_auth_service() -> AuthService:
    """AuthServiceのインスタンスを取得"""
    # 実際の実装では依存性注入やファクトリーパターンを使用
    # ここでは簡易的にインスタンスを作成
    from app.core.config import settings
    
    supabase_client = SupabaseClient(
        api_url=settings.SUPABASE_URL,
        api_key=settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Redis接続（仮実装）
    import asyncio
    redis_client = None  # 実際のRedisクライアントに置き換える
    
    session_manager = SessionManager(redis_client)
    password_policy = PasswordPolicy()
    
    return AuthService(
        supabase_client=supabase_client,
        session_manager=session_manager,
        password_policy=password_policy
    )


def get_client_info(request: Request) -> Dict[str, str]:
    """クライアント情報を取得"""
    return {
        "user_agent": request.headers.get("user-agent"),
        "ip_address": request.client.host if request.client else None
    }


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="ユーザー登録",
    description="新しいユーザーアカウントを作成します。",
    responses={
        201: {"description": "ユーザー登録成功", "model": AuthResponse},
        400: {"description": "バリデーションエラー", "model": ErrorResponse},
        409: {"description": "ユーザーが既に存在", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def register_user(
    user_data: UserCreate,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """ユーザー登録エンドポイント"""
    try:
        client_info = get_client_info(request)
        
        result = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            user_data=user_data.user_data,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        if result["success"]:
            return AuthResponse(**result)
        else:
            if "errors" in result:
                # バリデーションエラー
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": result.get("message", "入力値が無効です"),
                        "errors": result["errors"]
                    }
                )
            else:
                # その他のエラー
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": result.get("message", "ユーザー登録に失敗しました")}
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in register_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="ユーザーログイン",
    description="メールアドレスとパスワードでログインします。",
    responses={
        200: {"description": "ログイン成功", "model": AuthResponse},
        401: {"description": "認証失敗", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def login_user(
    credentials: UserLogin,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """ログインエンドポイント"""
    try:
        client_info = get_client_info(request)
        
        result = await auth_service.authenticate_user(
            email=credentials.email,
            password=credentials.password,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        if result["success"]:
            return AuthResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": result.get("message", "認証に失敗しました")}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in login_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/logout",
    response_model=SuccessResponse,
    summary="ユーザーログアウト",
    description="現在のセッションからログアウトします。",
    responses={
        200: {"description": "ログアウト成功", "model": SuccessResponse},
        401: {"description": "認証が必要", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> SuccessResponse:
    """ログアウトエンドポイント"""
    try:
        jwt_token = credentials.credentials
        
        result = await auth_service.logout_user(jwt_token)
        
        if result:
            return SuccessResponse(message="ログアウトしました")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "ログアウトに失敗しました"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in logout_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/password-reset/request",
    response_model=SuccessResponse,
    summary="パスワードリセット要求",
    description="パスワードリセット用のメールを送信します。",
    responses={
        200: {"description": "リセットメール送信成功", "model": SuccessResponse},
        400: {"description": "リクエストが無効", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def request_password_reset(
    email_data: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> SuccessResponse:
    """パスワードリセット要求エンドポイント"""
    try:
        result = await auth_service.request_password_reset(email_data.email)
        
        if result:
            return SuccessResponse(message="パスワードリセット用のメールを送信しました")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "パスワードリセット要求に失敗しました"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in request_password_reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/password-reset/confirm",
    response_model=SuccessResponse,
    summary="パスワードリセット確認",
    description="リセットトークンを使用してパスワードを変更します。",
    responses={
        200: {"description": "パスワード変更成功", "model": SuccessResponse},
        400: {"description": "トークンが無効またはパスワードが要件を満たしていない", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service)
) -> SuccessResponse:
    """パスワードリセット確認エンドポイント"""
    try:
        result = await auth_service.confirm_password_reset(
            reset_data.token,
            reset_data.new_password
        )
        
        if result:
            return SuccessResponse(message="パスワードが正常に変更されました")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "パスワードリセットに失敗しました"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in confirm_password_reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/token/refresh",
    response_model=AuthResponse,
    summary="トークン更新",
    description="リフレッシュトークンを使用してアクセストークンを更新します。",
    responses={
        200: {"description": "トークン更新成功", "model": AuthResponse},
        401: {"description": "リフレッシュトークンが無効", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def refresh_token(
    refresh_data: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """トークン更新エンドポイント"""
    try:
        result = await auth_service.refresh_auth_token(refresh_data.refresh_token)
        
        if result["success"]:
            return AuthResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": result.get("message", "トークン更新に失敗しました")}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in refresh_token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.post(
    "/token/verify",
    response_model=TokenVerificationResponse,
    summary="トークン検証",
    description="JWTトークンの有効性を検証します。",
    responses={
        200: {"description": "トークン検証結果", "model": TokenVerificationResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenVerificationResponse:
    """トークン検証エンドポイント"""
    try:
        jwt_token = credentials.credentials
        
        result = await auth_service.verify_jwt(jwt_token)
        
        return TokenVerificationResponse(**result)
        
    except Exception as e:
        logger.error(f"Unexpected error in verify_token: {e}")
        return TokenVerificationResponse(
            valid=False,
            error="トークン検証中にエラーが発生しました"
        )


@router.get(
    "/sessions",
    response_model=SessionListResponse,
    summary="セッション一覧取得",
    description="現在のユーザーのアクティブなセッション一覧を取得します。",
    responses={
        200: {"description": "セッション一覧取得成功", "model": SessionListResponse},
        401: {"description": "認証が必要", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def get_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> SessionListResponse:
    """セッション一覧取得エンドポイント"""
    try:
        jwt_token = credentials.credentials
        
        # JWTからユーザーIDを取得
        verification_result = await auth_service.verify_jwt(jwt_token)
        if not verification_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "認証が必要です"}
            )
        
        user_id = verification_result["payload"]["user_id"]
        result = await auth_service.get_user_sessions(user_id)
        
        if result["success"]:
            return SessionListResponse(**result)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": result.get("message", "セッション取得に失敗しました")}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )


@router.delete(
    "/sessions/{session_id}",
    response_model=SuccessResponse,
    summary="セッション終了",
    description="指定されたセッションを終了します。",
    responses={
        200: {"description": "セッション終了成功", "model": SuccessResponse},
        401: {"description": "認証が必要", "model": ErrorResponse},
        404: {"description": "セッションが見つからない", "model": ErrorResponse},
        500: {"description": "サーバーエラー", "model": ErrorResponse}
    }
)
async def terminate_session(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> SuccessResponse:
    """セッション終了エンドポイント"""
    try:
        jwt_token = credentials.credentials
        
        # JWTトークン検証
        verification_result = await auth_service.verify_jwt(jwt_token)
        if not verification_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "認証が必要です"}
            )
        
        result = await auth_service.terminate_session(session_id)
        
        if result:
            return SuccessResponse(message="セッションを終了しました")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "セッションが見つからないか、終了に失敗しました"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in terminate_session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "内部サーバーエラーが発生しました"}
        )