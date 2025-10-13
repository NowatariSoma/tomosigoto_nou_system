from typing import Any, Dict, List

from app.api.deps import get_current_user, get_user_service, get_user_role_repository
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    user_service: UserService = Depends(get_user_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    すべてのユーザーを取得
    """
    return await user_service.get_all_users()


@router.get("/me")
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    現在認証されているユーザーの情報を取得
    """
    return current_user

@router.get("/me/role")
async def get_current_user_role(
    current_user: Dict[str, Any] = Depends(get_current_user),
    user_role_repository = Depends(get_user_role_repository),
):
    """
    現在認証されているユーザーのロール情報を取得
    """
    user_id = current_user.get("id")
    role = await user_role_repository.get_role_by_user_id(user_id)

    if not role:
        return {
            "role_type": "general",
            "is_visible_to_general": True
        }

    return role


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    特定のユーザー情報を取得
    """
    return await user_service.get_user_by_id(user_id)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    """
    新規ユーザー登録（認証不要）
    """
    return await user_service.create_user(user_data.dict())


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    user_service: UserService = Depends(get_user_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    新しいユーザーを作成（管理者用・認証必要）
    """
    return await user_service.create_user(user_data.dict())


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    user_service: UserService = Depends(get_user_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    ユーザー情報を更新
    """
    # 更新データから None 値を除外
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}

    if not update_data:
        raise APIException(ErrorMessage.BAD_REQUEST)

    return await user_service.update_user(user_id, update_data)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    ユーザーを削除
    """
    await user_service.delete_user(user_id)
    return {"message": "User deleted successfully"}