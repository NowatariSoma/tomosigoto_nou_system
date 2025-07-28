from fastapi import APIRouter

from app.api.endpoints import users, pdf_exports
from app.api.auth import role_routes

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pdf_exports.router, prefix="", tags=["pdf-exports"])
api_router.include_router(role_routes.router, prefix="", tags=["auth"]) 