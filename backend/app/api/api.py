from app.api.endpoints import users, venues, parts
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venues.router, prefix="/venues", tags=["venues"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])