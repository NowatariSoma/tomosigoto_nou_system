from typing import Any, Dict, Optional

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.supabase import get_supabase
from app.repositories.user_repository import UserRepository
from app.repositories.venue_repository import VenueRepository
from app.services.user_service import UserService
from app.services.venue_service import VenueService
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from supabase import Client

security = HTTPBearer()


def get_user_repository(
    supabase_client: Client = Depends(get_supabase),
) -> UserRepository:
    """UserRepositoryのインスタンスを取得"""
    return UserRepository(supabase_client)


def get_user_service(
    supabase_client: Client = Depends(get_supabase),
    user_repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    """UserServiceのインスタンスを依存性注入で取得"""
    return UserService(user_repository, supabase_client.auth)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service: UserService = Depends(get_user_service),
) -> Dict[str, Any]:
    """JWTトークンから現在のユーザー情報を取得"""
    token = credentials.credentials
    user = await user_service.verify_jwt_token(token)

    if not user:
        raise APIException(
            ErrorMessage.INVALID_CREDENTIALS, headers={"WWW-Authenticate": "Bearer"}
        )

    return user


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """現在のアクティブなユーザーを取得"""
    # ユーザーのアクティブ状態をチェック（必要に応じて有効化）
    # if not current_user.get("active", True):
    #     raise APIException(ErrorMessage.INACTIVE_USER)
    return current_user


def get_venue_repository(
    supabase_client: Client = Depends(get_supabase),
) -> VenueRepository:
    return VenueRepository(supabase_client)


def get_venue_service(
    supabase_client: Client = Depends(get_supabase),
    venue_repository: VenueRepository = Depends(get_venue_repository),
) -> VenueService:
    return VenueService(venue_repository, supabase_client.auth)
