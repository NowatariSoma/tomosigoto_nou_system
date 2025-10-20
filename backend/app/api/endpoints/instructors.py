from typing import Any, Dict, List

from app.api.deps import get_current_user, get_user_service
from app.schemas.user import UserResponse
from app.services.user_service import UserService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_available_instructors(
    user_service: UserService = Depends(get_user_service),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """指導者として登録可能なユーザー一覧を取得"""
    
    users = await user_service.get_all_users()
    return users
