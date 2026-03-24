from app.core.database import Conn, get_db
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.core.security import verify_jwt_token
from app.schemas.current_user import CurrentUser

from app.repositories.member_assignment_repository import MemberAssignmentRepository
from app.repositories.part_repository import PartRepository
from app.repositories.stage_repository import StageRepository
from app.repositories.user_repository import UserRepository
from app.repositories.venue_repository import VenueRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.user_profile_repository import UserProfileRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.user_role_repository import UserRoleRepository
from app.repositories.account_setting_history_repository import AccountSettingHistoryRepository
from app.repositories.practice_schedule_repository import (
    PracticeScheduleRepository,
    SessionRepository,
)
from app.repositories.session_repository import SessionRepository as SessionRepositoryNew
from app.repositories.session_instructor_repository import SessionInstructorRepository
from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from app.repositories.schedule_time_slot_repository import ScheduleTimeSlotRepository
from app.repositories.materials_youtube_repository import (
    MaterialsPlaylistRepository,
    MaterialsSubPlaylistRepository,
    MaterialsVideoRepository,
    MaterialsFavoriteRepository,
    YoutubeOauthTokenRepository,
)

from app.services.materials_youtube_service import (
    MaterialsPlaylistService,
    MaterialsSubPlaylistService,
    MaterialsVideoService,
    MaterialsFavoriteService,
)
from app.services.member_admin_service import MemberAdminService
from app.services.member_assignment_service import MemberAssignmentService
from app.services.part_service import PartService
from app.services.stage_service import StageService
from app.services.user_service import UserService
from app.services.venue_service import VenueService
from app.services.contact_service import ContactService
from app.services.attendance_service import AttendanceService
from app.services.account_setting_service import AccountSettingService
from app.services.session_instructor_service import SessionInstructorService
from app.services.practice_schedule_service import PracticeScheduleService
from app.services.schedule_available_venue_service import ScheduleAvailableVenueService
from app.services.schedule_time_slot_service import ScheduleTimeSlotService
from app.services.scheduling_optimization_service import SchedulingOptimizationService

from app.repositories.protocols import (
    UserRepositoryProtocol,
    UserRoleRepositoryProtocol,
    VenueRepositoryProtocol,
    PartRepositoryProtocol,
    StageRepositoryProtocol,
    MemberAssignmentRepositoryProtocol,
    AttendanceRepositoryProtocol,
    UserProfileRepositoryProtocol,
    ContactRepositoryProtocol,
    DepartmentRepositoryProtocol,
    AccountSettingHistoryRepositoryProtocol,
    PracticeScheduleRepositoryProtocol,
    SessionRepositoryProtocol,
    SessionRepositoryNewProtocol,
    SessionInstructorRepositoryProtocol,
    ScheduleAvailableVenueRepositoryProtocol,
    ScheduleTimeSlotRepositoryProtocol,
    MaterialsPlaylistRepositoryProtocol,
    MaterialsSubPlaylistRepositoryProtocol,
    MaterialsVideoRepositoryProtocol,
    MaterialsFavoriteRepositoryProtocol,
    YoutubeOauthTokenRepositoryProtocol,
)
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


# ──────────────────────────────────────────────────────────────────
# 認証
# ──────────────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    conn: Conn = Depends(get_db),
) -> CurrentUser:
    if not credentials:
        raise APIException(
            ErrorMessage.INVALID_CREDENTIALS,
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_jwt_token(credentials.credentials)
    if not payload:
        raise APIException(
            ErrorMessage.INVALID_CREDENTIALS,
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    row = conn.execute(
        "SELECT id, email, raw_user_meta_data, created_at, updated_at FROM users WHERE id = %s",
        (user_id,),
    ).fetchone()
    if not row:
        raise APIException(
            ErrorMessage.USER_NOT_FOUND,
            headers={"WWW-Authenticate": "Bearer"},
        )
    return dict(row)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    conn: Conn = Depends(get_db),
) -> CurrentUser | None:
    if not credentials:
        return None
    try:
        payload = verify_jwt_token(credentials.credentials)
        if not payload:
            return None
        user_id = payload.get("sub")
        row = conn.execute(
            "SELECT id, email, raw_user_meta_data, created_at, updated_at FROM users WHERE id = %s",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None
    except Exception:
        return None


def get_current_active_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    return current_user


# ──────────────────────────────────────────────────────────────────
# リポジトリ
# ──────────────────────────────────────────────────────────────────

def get_user_repository(conn: Conn = Depends(get_db)) -> UserRepositoryProtocol:
    return UserRepository(conn)


def get_venue_repository(conn: Conn = Depends(get_db)) -> VenueRepositoryProtocol:
    return VenueRepository(conn)


def get_contact_repository(conn: Conn = Depends(get_db)) -> ContactRepositoryProtocol:
    return ContactRepository(conn)


def get_part_repository(conn: Conn = Depends(get_db)) -> PartRepositoryProtocol:
    return PartRepository(conn)


def get_stage_repository(conn: Conn = Depends(get_db)) -> StageRepositoryProtocol:
    return StageRepository(conn)


def get_member_assignment_repository(conn: Conn = Depends(get_db)) -> MemberAssignmentRepositoryProtocol:
    return MemberAssignmentRepository(conn)


def get_attendance_repository(conn: Conn = Depends(get_db)) -> AttendanceRepositoryProtocol:
    return AttendanceRepository(conn)


def get_user_profile_repository(conn: Conn = Depends(get_db)) -> UserProfileRepositoryProtocol:
    return UserProfileRepository(conn)


def get_department_repository(conn: Conn = Depends(get_db)) -> DepartmentRepositoryProtocol:
    return DepartmentRepository(conn)


def get_user_role_repository(conn: Conn = Depends(get_db)) -> UserRoleRepositoryProtocol:
    return UserRoleRepository(conn)


def get_account_setting_history_repository(conn: Conn = Depends(get_db)) -> AccountSettingHistoryRepositoryProtocol:
    return AccountSettingHistoryRepository(conn)


def get_practice_schedule_repository(conn: Conn = Depends(get_db)) -> PracticeScheduleRepositoryProtocol:
    return PracticeScheduleRepository(conn)


def get_schedule_available_venue_repository(conn: Conn = Depends(get_db)) -> ScheduleAvailableVenueRepositoryProtocol:
    return ScheduleAvailableVenueRepository(conn)


def get_session_repository(conn: Conn = Depends(get_db)) -> SessionRepositoryProtocol:
    return SessionRepository(conn)


def get_session_repository_new(conn: Conn = Depends(get_db)) -> SessionRepositoryNewProtocol:
    return SessionRepositoryNew(conn)


def get_session_instructor_repository(conn: Conn = Depends(get_db)) -> SessionInstructorRepositoryProtocol:
    return SessionInstructorRepository(conn)


def get_schedule_time_slot_repository(conn: Conn = Depends(get_db)) -> ScheduleTimeSlotRepositoryProtocol:
    return ScheduleTimeSlotRepository(conn)


def get_materials_playlist_repository(conn: Conn = Depends(get_db)) -> MaterialsPlaylistRepositoryProtocol:
    return MaterialsPlaylistRepository(conn)


def get_materials_sub_playlist_repository(conn: Conn = Depends(get_db)) -> MaterialsSubPlaylistRepositoryProtocol:
    return MaterialsSubPlaylistRepository(conn)


def get_materials_video_repository(conn: Conn = Depends(get_db)) -> MaterialsVideoRepositoryProtocol:
    return MaterialsVideoRepository(conn)


def get_materials_favorite_repository(conn: Conn = Depends(get_db)) -> MaterialsFavoriteRepositoryProtocol:
    return MaterialsFavoriteRepository(conn)


def get_youtube_oauth_token_repository(conn: Conn = Depends(get_db)) -> YoutubeOauthTokenRepositoryProtocol:
    return YoutubeOauthTokenRepository(conn)


# ──────────────────────────────────────────────────────────────────
# サービス
# ──────────────────────────────────────────────────────────────────

def get_user_service(
    user_repository: UserRepositoryProtocol = Depends(get_user_repository),
) -> UserService:
    return UserService(user_repository)


def get_venue_service(
    venue_repository: VenueRepositoryProtocol = Depends(get_venue_repository),
) -> VenueService:
    return VenueService(venue_repository)


def get_contact_service(
    contact_repository: ContactRepositoryProtocol = Depends(get_contact_repository),
    user_profile_repository: UserProfileRepositoryProtocol = Depends(get_user_profile_repository),
) -> ContactService:
    return ContactService(contact_repository, user_profile_repository)


def get_part_service(
    part_repository: PartRepositoryProtocol = Depends(get_part_repository),
    stage_repository: StageRepositoryProtocol = Depends(get_stage_repository),
) -> PartService:
    return PartService(part_repository, stage_repository)


def get_stage_service(
    stage_repository: StageRepositoryProtocol = Depends(get_stage_repository),
) -> StageService:
    return StageService(stage_repository)


def get_member_assignment_service(
    member_assignment_repository: MemberAssignmentRepositoryProtocol = Depends(get_member_assignment_repository),
    part_repository: PartRepositoryProtocol = Depends(get_part_repository),
    user_repository: UserRepositoryProtocol = Depends(get_user_repository),
) -> MemberAssignmentService:
    return MemberAssignmentService(member_assignment_repository, part_repository, user_repository)


def get_attendance_service(
    attendance_repository: AttendanceRepositoryProtocol = Depends(get_attendance_repository),
    user_repository: UserRepositoryProtocol = Depends(get_user_repository),
    user_profile_repository: UserProfileRepositoryProtocol = Depends(get_user_profile_repository),
) -> AttendanceService:
    return AttendanceService(
        attendance_repository,
        user_repository=user_repository,
        user_profile_repository=user_profile_repository,
    )


def get_account_setting_service(
    user_profile_repository: UserProfileRepositoryProtocol = Depends(get_user_profile_repository),
    department_repository: DepartmentRepositoryProtocol = Depends(get_department_repository),
    history_repository: AccountSettingHistoryRepositoryProtocol = Depends(get_account_setting_history_repository),
) -> AccountSettingService:
    return AccountSettingService(user_profile_repository, department_repository, history_repository)


def get_practice_schedule_service(
    practice_schedule_repository: PracticeScheduleRepositoryProtocol = Depends(get_practice_schedule_repository),
    schedule_available_venue_repository: ScheduleAvailableVenueRepositoryProtocol = Depends(get_schedule_available_venue_repository),
    session_repository: SessionRepositoryProtocol = Depends(get_session_repository),
    session_instructor_repository: SessionInstructorRepositoryProtocol = Depends(get_session_instructor_repository),
    venue_repository: VenueRepositoryProtocol = Depends(get_venue_repository),
    member_assignment_repository: MemberAssignmentRepositoryProtocol = Depends(get_member_assignment_repository),
    attendance_repository: AttendanceRepositoryProtocol = Depends(get_attendance_repository),
    user_profile_repository: UserProfileRepositoryProtocol = Depends(get_user_profile_repository),
    schedule_time_slot_repository: ScheduleTimeSlotRepositoryProtocol = Depends(get_schedule_time_slot_repository),
) -> PracticeScheduleService:
    return PracticeScheduleService(
        practice_schedule_repository,
        schedule_available_venue_repository,
        session_repository,
        session_instructor_repository,
        venue_repository,
        member_assignment_repository,
        attendance_repository,
        user_profile_repository,
        schedule_time_slot_repository,
    )


def get_session_instructor_service(
    session_instructor_repository: SessionInstructorRepositoryProtocol = Depends(get_session_instructor_repository),
) -> SessionInstructorService:
    return SessionInstructorService(session_instructor_repository)


def get_member_admin_service(
    user_service: UserService = Depends(get_user_service),
    user_role_repository: UserRoleRepositoryProtocol = Depends(get_user_role_repository),
    user_profile_repository: UserProfileRepositoryProtocol = Depends(get_user_profile_repository),
) -> MemberAdminService:
    return MemberAdminService(user_service, user_role_repository, user_profile_repository)


def get_schedule_available_venue_service(
    schedule_available_venue_repository: ScheduleAvailableVenueRepositoryProtocol = Depends(get_schedule_available_venue_repository),
) -> ScheduleAvailableVenueService:
    return ScheduleAvailableVenueService(schedule_available_venue_repository)


def get_schedule_time_slot_service(
    schedule_time_slot_repository: ScheduleTimeSlotRepositoryProtocol = Depends(get_schedule_time_slot_repository),
) -> ScheduleTimeSlotService:
    return ScheduleTimeSlotService(schedule_time_slot_repository)


def get_scheduling_optimization_service(
    practice_schedule_repository: PracticeScheduleRepositoryProtocol = Depends(get_practice_schedule_repository),
    schedule_available_venue_repository: ScheduleAvailableVenueRepositoryProtocol = Depends(get_schedule_available_venue_repository),
    session_repository: SessionRepositoryProtocol = Depends(get_session_repository),
    part_repository: PartRepositoryProtocol = Depends(get_part_repository),
    member_assignment_repository: MemberAssignmentRepositoryProtocol = Depends(get_member_assignment_repository),
    user_repository: UserRepositoryProtocol = Depends(get_user_repository),
    attendance_repository: AttendanceRepositoryProtocol = Depends(get_attendance_repository),
    user_role_repository: UserRoleRepositoryProtocol = Depends(get_user_role_repository),
) -> SchedulingOptimizationService:
    return SchedulingOptimizationService(
        practice_schedule_repository,
        schedule_available_venue_repository,
        session_repository,
        part_repository,
        member_assignment_repository,
        user_repository,
        attendance_repository,
        user_role_repository,
    )


def get_materials_playlist_service(
    materials_playlist_repository: MaterialsPlaylistRepositoryProtocol = Depends(get_materials_playlist_repository),
) -> MaterialsPlaylistService:
    return MaterialsPlaylistService(materials_playlist_repository)


def get_materials_sub_playlist_service(
    materials_sub_playlist_repository: MaterialsSubPlaylistRepositoryProtocol = Depends(get_materials_sub_playlist_repository),
    materials_video_repository: MaterialsVideoRepositoryProtocol = Depends(get_materials_video_repository),
    materials_playlist_repository: MaterialsPlaylistRepositoryProtocol = Depends(get_materials_playlist_repository),
    youtube_oauth_token_repository: YoutubeOauthTokenRepositoryProtocol = Depends(get_youtube_oauth_token_repository),
) -> MaterialsSubPlaylistService:
    return MaterialsSubPlaylistService(
        materials_sub_playlist_repository,
        materials_video_repository,
        materials_playlist_repository,
        youtube_oauth_token_repository,
    )


def get_materials_video_service(
    materials_video_repository: MaterialsVideoRepositoryProtocol = Depends(get_materials_video_repository),
    materials_sub_playlist_repository: MaterialsSubPlaylistRepositoryProtocol = Depends(get_materials_sub_playlist_repository),
) -> MaterialsVideoService:
    return MaterialsVideoService(materials_video_repository, materials_sub_playlist_repository)


def get_materials_favorite_service(
    materials_favorite_repository: MaterialsFavoriteRepositoryProtocol = Depends(get_materials_favorite_repository),
) -> MaterialsFavoriteService:
    return MaterialsFavoriteService(materials_favorite_repository)


# ──────────────────────────────────────────────────────────────────
# 権限チェック
# ──────────────────────────────────────────────────────────────────

def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
    user_role_repository: UserRoleRepositoryProtocol = Depends(get_user_role_repository),
) -> CurrentUser:
    user_id = current_user.get("id")
    role = user_role_repository.get_role_by_user_id(user_id)
    if not role or role.get("role_type") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="管理者権限が必要です")
    return current_user


def require_instructor_or_admin(
    current_user: CurrentUser = Depends(get_current_user),
    user_role_repository: UserRoleRepositoryProtocol = Depends(get_user_role_repository),
) -> CurrentUser:
    user_id = current_user.get("id")
    role = user_role_repository.get_role_by_user_id(user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ユーザーロールが見つかりません")
    role_type = role.get("role_type")
    is_instructor = role.get("is_instructor", False)
    if role_type == "admin" or (role_type == "basic" and is_instructor):
        return current_user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="指導者以上の権限が必要です")


def require_member_or_above(
    current_user: CurrentUser = Depends(get_current_user),
    user_role_repository: UserRoleRepositoryProtocol = Depends(get_user_role_repository),
) -> CurrentUser:
    user_id = current_user.get("id")
    role = user_role_repository.get_role_by_user_id(user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ユーザーロールが見つかりません")
    if role.get("role_type") in ("admin", "basic"):
        return current_user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="メンバー権限が必要です")
