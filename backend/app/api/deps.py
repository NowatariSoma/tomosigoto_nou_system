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

from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_role_repository import UserRoleRepository
from app.repositories.account_setting_history_repository import AccountSettingHistoryRepository

from app.services.user_service import UserService
from app.services.venue_service import VenueService
from app.services.attendance_service import AttendanceService
from app.services.account_setting_service import AccountSettingService
from app.services.session_instructor_service import SessionInstructorService
from app.repositories.practice_schedule_repository import (
    PracticeScheduleRepository,
    SessionRepository,
)
from app.repositories.session_repository import SessionRepository as SessionRepositoryNew
from app.repositories.session_instructor_repository import SessionInstructorRepository
from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from app.services.practice_schedule_service import PracticeScheduleService
from app.services.schedule_available_venue_service import ScheduleAvailableVenueService
from app.services.scheduling_optimization_service import SchedulingOptimizationService
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from supabase import Client

security = HTTPBearer(auto_error=False)


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
    if not credentials:
        raise APIException(
            ErrorMessage.INVALID_CREDENTIALS, headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    user = await user_service.verify_jwt_token(token)

    if not user:
        raise APIException(
            ErrorMessage.INVALID_CREDENTIALS, headers={"WWW-Authenticate": "Bearer"}
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    user_service: UserService = Depends(get_user_service),
) -> Optional[Dict[str, Any]]:
    """JWTトークンから現在のユーザー情報を取得（オプショナル）"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user = await user_service.verify_jwt_token(token)
        return user
    except Exception:
        return None


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
    return MemberAssignmentService(member_assignment_repository, part_repository, user_repository, supabase_client.auth)

def get_attendance_repository(
    supabase_client: Client = Depends(get_supabase),
) -> "AttendanceRepository":
    """AttendanceRepositoryのインスタンスを取得"""
    return AttendanceRepository(supabase_client)


def get_attendance_service(
    supabase_client: Client = Depends(get_supabase),
    attendance_repository: "AttendanceRepository" = Depends(get_attendance_repository),
) -> "AttendanceService":
    """AttendanceServiceのインスタンスを依存性注入で取得"""
    return AttendanceService(attendance_repository)


def get_user_profile_repository(
    supabase_client: Client = Depends(get_supabase),
) -> UserProfileRepository:
    """UserProfileRepositoryのインスタンスを取得"""
    return UserProfileRepository(supabase_client)


def get_department_repository(
    supabase_client: Client = Depends(get_supabase),
) -> DepartmentRepository:
    """DepartmentRepositoryのインスタンスを取得"""
    return DepartmentRepository(supabase_client)


def get_user_role_repository(
    supabase_client: Client = Depends(get_supabase),
) -> UserRoleRepository:
    """UserRoleRepositoryのインスタンスを取得"""
    return UserRoleRepository(supabase_client)


def get_account_setting_history_repository(
    supabase_client: Client = Depends(get_supabase),
) -> AccountSettingHistoryRepository:
    """AccountSettingHistoryRepositoryのインスタンスを取得"""
    return AccountSettingHistoryRepository(supabase_client)


def get_account_setting_service(
    user_profile_repository: UserProfileRepository = Depends(get_user_profile_repository),
    department_repository: DepartmentRepository = Depends(get_department_repository),
    history_repository: AccountSettingHistoryRepository = Depends(get_account_setting_history_repository),
) -> AccountSettingService:
    """AccountSettingServiceのインスタンスを依存性注入で取得"""
    return AccountSettingService(user_profile_repository, department_repository, history_repository)

def get_practice_schedule_repository(
    supabase_client: Client = Depends(get_supabase),
) -> PracticeScheduleRepository:
    """PracticeScheduleRepositoryのインスタンスを取得"""
    return PracticeScheduleRepository(supabase_client)


def get_schedule_available_venue_repository(
    supabase_client: Client = Depends(get_supabase),
) -> ScheduleAvailableVenueRepository:
    """ScheduleAvailableVenueRepositoryのインスタンスを取得"""
    return ScheduleAvailableVenueRepository(supabase_client)


def get_session_repository(
    supabase_client: Client = Depends(get_supabase),
) -> SessionRepository:
    """SessionRepositoryのインスタンスを取得"""
    return SessionRepository(supabase_client)


def get_session_repository_new(
    supabase_client: Client = Depends(get_supabase),
) -> SessionRepositoryNew:
    """SessionRepositoryNew（拡張版）のインスタンスを取得"""
    return SessionRepositoryNew(supabase_client)


def get_session_instructor_repository(
    supabase_client: Client = Depends(get_supabase),
) -> SessionInstructorRepository:
    """SessionInstructorRepositoryのインスタンスを取得"""
    return SessionInstructorRepository(supabase_client)


def get_practice_schedule_service(
    supabase_client: Client = Depends(get_supabase),
    practice_schedule_repository: PracticeScheduleRepository = Depends(get_practice_schedule_repository),
    schedule_available_venue_repository: ScheduleAvailableVenueRepository = Depends(get_schedule_available_venue_repository),
    session_repository: SessionRepository = Depends(get_session_repository),
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    venue_repository: VenueRepository = Depends(get_venue_repository),
) -> PracticeScheduleService:
    """PracticeScheduleServiceのインスタンスを依存性注入で取得"""
    return PracticeScheduleService(
        practice_schedule_repository,
        schedule_available_venue_repository,
        session_repository,
        session_instructor_repository,
        venue_repository,
        supabase_client.auth,
    )


async def require_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_role_repository: UserRoleRepository = Depends(get_user_role_repository),
) -> Dict[str, Any]:
    """管理者権限チェック"""
    user_id = current_user.get("id")
    role = await user_role_repository.get_role_by_user_id(user_id)

    if not role or role.get("role_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です"
        )

    return current_user


def get_session_instructor_service(
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
) -> SessionInstructorService:
    """SessionInstructorServiceのインスタンスを依存性注入で取得"""
    return SessionInstructorService(session_instructor_repository)


def get_schedule_available_venue_repository(
    supabase_client: Client = Depends(get_supabase),
) -> ScheduleAvailableVenueRepository:
    """ScheduleAvailableVenueRepositoryのインスタンスを取得"""
    return ScheduleAvailableVenueRepository(supabase_client)


def get_schedule_available_venue_service(
    schedule_available_venue_repository: ScheduleAvailableVenueRepository = Depends(get_schedule_available_venue_repository),
) -> ScheduleAvailableVenueService:
    """ScheduleAvailableVenueServiceのインスタンスを依存性注入で取得"""
    return ScheduleAvailableVenueService(schedule_available_venue_repository)


def get_scheduling_optimization_service(
    supabase_client: Client = Depends(get_supabase),
    practice_schedule_repository: PracticeScheduleRepository = Depends(get_practice_schedule_repository),
    schedule_available_venue_repository: ScheduleAvailableVenueRepository = Depends(get_schedule_available_venue_repository),
    session_repository: SessionRepository = Depends(get_session_repository),
    part_repository: PartRepository = Depends(get_part_repository),
    member_assignment_repository: MemberAssignmentRepository = Depends(get_member_assignment_repository),
    user_repository: UserRepository = Depends(get_user_repository),
    attendance_repository: AttendanceRepository = Depends(get_attendance_repository),
) -> SchedulingOptimizationService:
    """SchedulingOptimizationServiceのインスタンスを依存性注入で取得"""
    return SchedulingOptimizationService(
        practice_schedule_repository,
        schedule_available_venue_repository,
        session_repository,
        part_repository,
        member_assignment_repository,
        user_repository,
        attendance_repository
    )
