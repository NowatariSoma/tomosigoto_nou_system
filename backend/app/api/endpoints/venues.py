from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from uuid import UUID

from app.schemas.venues import VenueBase, VenueResponse
from app.services.venue_service import VenueService

router = APIRouter()

@router.get("/", response_model=List[VenueResponse])
async def get_venues(
    venue_service: VenueService = Depends(VenueService)
):
    """     
    会場の全情報を取得

    Args: 
        venue_service: supabaseサービス
    
    Returns:
        listですべての会場情報
    """
    all_venue_data = await venue_service.get_all_venues()
    return all_venue_data

@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: UUID,
    venue_service: VenueService = Depends(VenueService) 
):
    """ 
    指定した会場情報を取得 

    Args:
        venue_id: 会場を指定するuuid
        venue_service: supabaseサービス
    
    Returns
        スキーマを通して辞書型とした会場情報
    """

    venue_data = await venue_service.get_venue(venue_id)
    return VenueResponse(**venue_data)

@router.post("/", response_model=VenueResponse)
async def create_venue(
    venue_data: VenueBase,
    venue_service: VenueService = Depends(VenueService)
):
    """ 
    新しく会場情報を生成 

    Args:
        venue_data: 生成する会場情報
        venue_service: supabaseサービス
    
    Returns
        スキーマを通して辞書型とした会場情報
    """
    created_venue = await venue_service.create_venue(venue_data.dict())
    return VenueResponse(**created_venue)

@router.put("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: UUID,
    venue_data: VenueBase,
    venue_service: VenueService = Depends(VenueService)
):
    """ 
    指定した会場情報を更新 

    Args:
        venue_id: 会場を指定するuuid
        venue_data: 更新後の会場情報
        venue_service: supabaseサービス
    
    Returns
        スキーマを通して辞書型とした会場情報
    """
    updated_venue = await venue_service.update_venue(venue_id, venue_data.dict())
    return VenueResponse(**updated_venue)

@router.delete("/{venue_id}")
async def delete_venue(
    venue_id: UUID,
    # venue_name: str,
    venue_service: VenueService = Depends(VenueService)
):
    """ 
    指定した会場情報を削除 

    Args:
        venue_id: 会場を指定するuuid
        venue_service: supabaseサービス
    
    Returns
        確認メッセージ
    """
    removed_venue = await venue_service.remove_venue(venue_id)

    if removed_venue:
        return {"message": f"Venue-{venue_id} deleted successfully"}
    else:
        return {"message": f"Venue-{venue_id} deleted failed"}