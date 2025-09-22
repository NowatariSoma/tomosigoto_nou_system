from typing import Any, Dict, Optional

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.supabase import get_supabase
from app.repositories.member_assignment_repository import MemberAssignmentRepository
from app.repositories.part_repository import PartRepository
from app.repositories.stage_repository import StageRepository
from app.repositories.user_repository import UserRepository
from app.repositories.venue_repository import VenueRepository
from app.services.member_assignment_service import MemberAssignmentService
from app.services.part_service import PartService
from app.services.stage_service import StageService
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


def get_part_repository(
    supabase_client: Client = Depends(get_supabase),
) -> PartRepository:
    """PartRepositoryのインスタンスを取得"""
    return PartRepository(supabase_client)


def get_stage_repository(
    supabase_client: Client = Depends(get_supabase),
) -> StageRepository:
    """StageRepositoryのインスタンスを取得"""
    return StageRepository(supabase_client)


def get_part_service(
    supabase_client: Client = Depends(get_supabase),
    part_repository: PartRepository = Depends(get_part_repository),
    stage_repository: StageRepository = Depends(get_stage_repository),
) -> PartService:
    """PartServiceのインスタンスを依存性注入で取得"""
    return PartService(part_repository, stage_repository, supabase_client.auth)


def get_member_assignment_repository(
    supabase_client: Client = Depends(get_supabase),
) -> MemberAssignmentRepository:
    """MemberAssignmentRepositoryのインスタンスを取得"""
    return MemberAssignmentRepository(supabase_client)


def get_stage_service(
    supabase_client: Client = Depends(get_supabase),
) -> StageService:
    """StageServiceのインスタンスを依存性注入で取得"""
    return StageService(supabase_client)


def get_member_assignment_service(
    supabase_client: Client = Depends(get_supabase),
    member_assignment_repository: MemberAssignmentRepository = Depends(get_member_assignment_repository),
    part_repository: PartRepository = Depends(get_part_repository),
    user_repository: UserRepository = Depends(get_user_repository),
) -> MemberAssignmentService:
    """MemberAssignmentServiceのインスタンスを依存性注入で取得"""
    return MemberAssignmentService(
        member_assignment_repository, part_repository, user_repository, supabase_client.auth
    )
