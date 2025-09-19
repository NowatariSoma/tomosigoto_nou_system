from app.api.endpoints import users, venues, attendance, auth, account_setting
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(account_setting.router, prefix="/account-setting", tags=["account-setting"])
