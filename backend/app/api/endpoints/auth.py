"""
認証関連のAPIエンドポイント
"""
from app.api.deps import get_current_user
from app.core.database import Conn, get_db
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.auth import (
    AuthRequest,
    AuthResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordUpdateRequest,
    PasswordUpdateResponse,
    RefreshTokenRequest,
    SignoutResponse,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyEmailResponse,
)
from app.schemas.current_user import CurrentUser
from app.services.auth_service import AuthService
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_auth_service(conn: Conn = Depends(get_db)) -> AuthService:
    return AuthService(conn)


@router.post("/signup", response_model=SignupResponse)
def signup(
    auth_data: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return auth_service.signup(auth_data.email, auth_data.password)


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(
    token: str = Query(...),
    auth_service: AuthService = Depends(get_auth_service),
):
    return auth_service.verify_email(token)


@router.post("/signin", response_model=AuthResponse)
def signin(
    auth_data: AuthRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return auth_service.signin(auth_data.email, auth_data.password)
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/signout", response_model=SignoutResponse)
def signout(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return auth_service.signout(refresh_data.refresh_token)
    except Exception:
        return {"message": "Signed out"}


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return auth_service.refresh_token(refresh_data.refresh_token)
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(
    reset_data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return auth_service.reset_password(reset_data.email)


@router.post("/update-password", response_model=PasswordUpdateResponse)
def update_password(
    password_data: PasswordUpdateRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        return auth_service.update_password(
            password_data.reset_token,
            password_data.password,
        )
    except APIException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me")
def get_current_user_info(
    current_user: CurrentUser = Depends(get_current_user),
):
    return current_user
