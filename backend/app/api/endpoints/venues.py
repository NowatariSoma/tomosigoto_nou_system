from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.schemas.venues import VenueBase, VenueResponse
from app.services.venue_service import VenueService
from app.api.deps import get_venue_service, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[VenueResponse])
async def get_venues(
    venue_service: VenueService = Depends(get_venue_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """     
    会場の全情報を取得

    Args: 
        venue_service: 会場サービス
        current_user: 現在のユーザー（認証必須）
    
    Returns:
        listですべての会場情報
    """
    all_venue_data = await venue_service.get_all_venues()
    return all_venue_data

@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: UUID,
    venue_service: VenueService = Depends(get_venue_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """ 
    指定した会場情報を取得 

    Args:
        venue_id: 会場を指定するuuid
        venue_service: 会場サービス
        current_user: 現在のユーザー（認証必須）
    
    Returns
        スキーマを通して辞書型とした会場情報
    """
    venue_data = await venue_service.get_venue_by_id(str(venue_id))
    return VenueResponse(**venue_data)

@router.post("/", response_model=VenueResponse)
async def create_venue(
    venue_data: VenueBase,
    venue_service: VenueService = Depends(get_venue_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """ 
    新しく会場情報を生成 

    Args:
        venue_data: 生成する会場情報
        venue_service: 会場サービス
        current_user: 現在のユーザー（認証必須）
    
    Returns
        スキーマを通して辞書型とした会場情報
    """
    created_venue = await venue_service.create_venue(venue_data.dict())
    return VenueResponse(**created_venue)

@router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: UUID,
    venue_data: VenueBase,
    venue_service: VenueService = Depends(get_venue_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """ 
    指定した会場情報を更新 

    Args:
        venue_id: 会場を指定するuuid
        venue_data: 更新後の会場情報
        venue_service: 会場サービス
        current_user: 現在のユーザー（認証必須）
    
    Returns
        スキーマを通して辞書型とした会場情報
    """
    updated_venue = await venue_service.update_venue(str(venue_id), venue_data.dict())
    return VenueResponse(**updated_venue)

@router.delete("/{venue_id}")
async def delete_venue(
    venue_id: UUID,
    venue_service: VenueService = Depends(get_venue_service),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """ 
    指定した会場情報を削除 

    Args:
        venue_id: 会場を指定するuuid
        venue_service: 会場サービス
        current_user: 現在のユーザー（認証必須）
    
    Returns
        確認メッセージ
    """
    success = await venue_service.delete_venue(str(venue_id))

    if success:
        return {"message": f"Venue-{venue_id} deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Venue-{venue_id} deletion failed"
        )