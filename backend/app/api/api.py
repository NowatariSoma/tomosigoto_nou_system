from app.api.endpoints import users, venues, auth, practice_slots, groups, parts, schedule_assignments
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(practice_slots.router, prefix="/practice-slots", tags=["practice-slots"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
api_router.include_router(schedule_assignments.router, prefix="/schedule-assignments", tags=["schedule-assignments"])
