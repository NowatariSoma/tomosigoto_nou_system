from fastapi import APIRouter

from app.api.endpoints import users, pdf_exports
from app.api.v1.endpoints import schedules

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pdf_exports.router, prefix="", tags=["pdf-exports"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"]) 