from app.api.endpoints import (
    account_setting,
    admin_members,
    attendance,
    auth,
    contacts,
    member_assignments,
    parts,
    practice_slots,
    schedule_available_venues,
    schedule_time_slots,
    scheduling,
    session_instructors,
    stages,
    users,
    venues,
)
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])

api_router.include_router(stages.router, prefix="/stages", tags=["stages"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(member_assignments.router, prefix="/member-assignments", tags=["member-assignments"])

api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(account_setting.router, prefix="/account-setting", tags=["account-setting"])
api_router.include_router(practice_slots.router, prefix="/practice_schedules", tags=["practice_schedules"])
api_router.include_router(session_instructors.router, prefix="/session-instructors", tags=["session-instructors"])
api_router.include_router(schedule_available_venues.router, prefix="/schedule-available-venues", tags=["schedule-available-venues"])
api_router.include_router(schedule_time_slots.router, prefix="/schedule-time-slots", tags=["schedule-time-slots"])
api_router.include_router(scheduling.router, prefix="/scheduling", tags=["scheduling"])
api_router.include_router(admin_members.router, prefix="/admin/members", tags=["admin-members"])