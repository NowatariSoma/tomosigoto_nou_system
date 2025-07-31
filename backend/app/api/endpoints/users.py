from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_supabase_service
from app.schemas.user import UserResponse, UserCreate, UserUpdate
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


@router.post("/", response_model=Dict[str, Any])
async def create_user(
    user_data: UserCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
):
    """
    新しいユーザーを作成
    
    Args:
        user_data: ユーザー作成データ
        current_user: 現在認証されているユーザー
        supabase_service: Supabaseサービス
        
    Returns:
        作成されたユーザー情報
    """
    try:
        created_user = await supabase_service.create_user(user_data.dict())
        return created_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー作成エラー: {str(e)}"
        )


@router.put("/{user_id}", response_model=Dict[str, Any])
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
):
    """
    ユーザー情報を更新
    
    Args:
        user_id: 更新対象のユーザーID
        user_data: 更新データ
        current_user: 現在認証されているユーザー
        supabase_service: Supabaseサービス
        
    Returns:
        更新されたユーザー情報
    """
    # 更新データから None 値を除外
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新データが指定されていません"
        )
    
    try:
        updated_user = await supabase_service.update_user(user_id, update_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー更新エラー: {str(e)}"
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service),
):
    """
    ユーザーを削除
    
    Args:
        user_id: 削除対象のユーザーID
        current_user: 現在認証されているユーザー
        supabase_service: Supabaseサービス
        
    Returns:
        削除成功メッセージ
    """
    try:
        # ユーザーが存在するかチェック
        existing_user = await supabase_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # 削除実行
        await supabase_service.delete_user(user_id)
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ユーザー削除エラー: {str(e)}"
        ) 