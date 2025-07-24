from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_supabase_service
from app.schemas.user import UserResponse
from app.services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
async def get_users(
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
):
    """すべてのユーザーを取得"""
    return await supabase_service.get_all_users()


@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
):
    """特定のユーザー情報を取得"""
    user = await supabase_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/me/", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """現在認証されているユーザーの情報を取得"""
    return current_user 