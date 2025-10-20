from app.api.endpoints import users, venues, parts, member_assignments, stages, attendance, auth, account_setting, instructor, instructors, session_instructors, practice_slots
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])

api_router.include_router(stages.router, prefix="/stages", tags=["stages"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(member_assignments.router, prefix="/member-assignments", tags=["member-assignments"])

api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(account_setting.router, prefix="/account-setting", tags=["account-setting"])
api_router.include_router(practice_slots.router, prefix="/practice_schedules", tags=["practice_schedules"])

api_router.include_router(instructors.router, prefix="/instructors", tags=["instructors"])
api_router.include_router(session_instructors.router, prefix="/session-instructors", tags=["session-instructors"])