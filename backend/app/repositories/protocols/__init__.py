from app.repositories.protocols.user_repository_protocol import UserRepositoryProtocol
from app.repositories.protocols.user_role_repository_protocol import UserRoleRepositoryProtocol
from app.repositories.protocols.venue_repository_protocol import VenueRepositoryProtocol
from app.repositories.protocols.part_repository_protocol import PartRepositoryProtocol
from app.repositories.protocols.attendance_repository_protocol import AttendanceRepositoryProtocol
from app.repositories.protocols.member_assignment_repository_protocol import MemberAssignmentRepositoryProtocol
from app.repositories.protocols.practice_schedule_repository_protocol import PracticeScheduleRepositoryProtocol
from app.repositories.protocols.session_repository_protocol import SessionRepositoryProtocol, SessionRepositoryNewProtocol
from app.repositories.protocols.session_instructor_repository_protocol import SessionInstructorRepositoryProtocol
from app.repositories.protocols.stage_repository_protocol import StageRepositoryProtocol
from app.repositories.protocols.user_profile_repository_protocol import UserProfileRepositoryProtocol
from app.repositories.protocols.contact_repository_protocol import ContactRepositoryProtocol
from app.repositories.protocols.schedule_available_venue_repository_protocol import ScheduleAvailableVenueRepositoryProtocol
from app.repositories.protocols.schedule_time_slot_repository_protocol import ScheduleTimeSlotRepositoryProtocol
from app.repositories.protocols.department_repository_protocol import DepartmentRepositoryProtocol
from app.repositories.protocols.account_setting_history_repository_protocol import AccountSettingHistoryRepositoryProtocol
from app.repositories.protocols.materials_youtube_repository_protocol import (
    MaterialsPlaylistRepositoryProtocol,
    MaterialsSubPlaylistRepositoryProtocol,
    MaterialsVideoRepositoryProtocol,
    MaterialsFavoriteRepositoryProtocol,
)

__all__ = [
    "UserRepositoryProtocol",
    "UserRoleRepositoryProtocol",
    "VenueRepositoryProtocol",
    "PartRepositoryProtocol",
    "AttendanceRepositoryProtocol",
    "MemberAssignmentRepositoryProtocol",
    "PracticeScheduleRepositoryProtocol",
    "SessionRepositoryProtocol",
    "SessionRepositoryNewProtocol",
    "SessionInstructorRepositoryProtocol",
    "StageRepositoryProtocol",
    "UserProfileRepositoryProtocol",
    "ContactRepositoryProtocol",
    "ScheduleAvailableVenueRepositoryProtocol",
    "ScheduleTimeSlotRepositoryProtocol",
    "DepartmentRepositoryProtocol",
    "AccountSettingHistoryRepositoryProtocol",
    "MaterialsPlaylistRepositoryProtocol",
    "MaterialsSubPlaylistRepositoryProtocol",
    "MaterialsVideoRepositoryProtocol",
    "MaterialsFavoriteRepositoryProtocol",
]
