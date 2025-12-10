"""
スケジュール利用可能会場関連のAPIエンドポイント
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import (
    get_current_user,
    get_schedule_available_venue_service,
    require_instructor_or_admin,
    require_member_or_above,
)
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.schedule_available_venues import (
    ScheduleAvailableVenueCreate,
    ScheduleAvailableVenueResponse,
    ScheduleAvailableVenueUpdate,
    ScheduleAvailableVenueWithDetails,
    ScheduleAvailableVenueBulkCreate,
    ScheduleAvailableVenueBulkResponse,
    VenueAvailabilityUpdate,
)
from app.services.schedule_available_venue_service import ScheduleAvailableVenueService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("/", response_model=List[ScheduleAvailableVenueWithDetails])
async def get_schedule_available_venues(
    schedule_id: Optional[UUID] = Query(None, description="練習スケジュールIDでフィルタ"),
    venue_id: Optional[UUID] = Query(None, description="会場IDでフィルタ"),
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """スケジュール利用可能会場一覧を取得"""
    result = await schedule_venue_service.get_all_schedule_available_venues(
        schedule_id=schedule_id,
        venue_id=venue_id
    )
    return result


@router.get("/{schedule_venue_id}", response_model=ScheduleAvailableVenueResponse)
async def get_schedule_available_venue(
    schedule_venue_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """指定したIDのスケジュール利用可能会場を取得"""
    schedule_venue = await schedule_venue_service.get_schedule_available_venue(schedule_venue_id)
    return schedule_venue


@router.get("/schedule/{schedule_id}", response_model=List[ScheduleAvailableVenueResponse])
async def get_schedule_available_venues_by_schedule(
    schedule_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """指定したスケジュールの利用可能会場一覧を取得"""
    schedule_venues = await schedule_venue_service.get_schedule_available_venues_by_schedule(schedule_id)
    return schedule_venues


@router.get("/venue/{venue_id}", response_model=List[ScheduleAvailableVenueResponse])
async def get_schedule_available_venues_by_venue(
    venue_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """指定した会場のスケジュール利用可能性一覧を取得"""
    schedule_venues = await schedule_venue_service.get_schedule_available_venues_by_venue(venue_id)
    return schedule_venues


@router.post("/", response_model=ScheduleAvailableVenueResponse)
async def create_schedule_available_venue(
    schedule_venue_data: ScheduleAvailableVenueCreate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """スケジュール利用可能会場を作成"""
    schedule_venue = await schedule_venue_service.create_schedule_available_venue(
        schedule_venue_data.model_dump()
    )
    return schedule_venue


@router.post("/bulk", response_model=ScheduleAvailableVenueBulkResponse)
async def create_schedule_available_venues_bulk(
    bulk_data: ScheduleAvailableVenueBulkCreate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """スケジュール利用可能会場を一括作成"""
    result = await schedule_venue_service.create_schedule_available_venues_bulk(
        schedule_id=bulk_data.schedule_id,
        venues=bulk_data.venues
    )
    return result


@router.put("/{schedule_venue_id}", response_model=ScheduleAvailableVenueResponse)
async def update_schedule_available_venue(
    schedule_venue_id: UUID,
    update_data: ScheduleAvailableVenueUpdate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """スケジュール利用可能会場を更新"""
    # None値を除外
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新するデータが指定されていません"
        )
    
    schedule_venue = await schedule_venue_service.update_schedule_available_venue(
        schedule_venue_id, update_dict
    )
    return schedule_venue


@router.put("/schedule/{schedule_id}/venues")
async def update_venue_availability_bulk(
    schedule_id: UUID,
    update_data: VenueAvailabilityUpdate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """会場利用可能性を一括更新"""
    result = await schedule_venue_service.update_venue_availability_bulk(
        schedule_id=schedule_id,
        venue_updates=update_data.venue_updates
    )
    return result


@router.delete("/{schedule_venue_id}")
async def delete_schedule_available_venue(
    schedule_venue_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """スケジュール利用可能会場を削除"""
    success = await schedule_venue_service.delete_schedule_available_venue(schedule_venue_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="削除に失敗しました"
        )
    
    return {"message": "スケジュール利用可能会場を削除しました"}


@router.delete("/schedule/{schedule_id}")
async def delete_schedule_available_venues_by_schedule(
    schedule_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """指定したスケジュールの利用可能会場をすべて削除"""
    deleted_count = await schedule_venue_service.delete_schedule_available_venues_by_schedule(schedule_id)
    
    return {
        "message": f"スケジュール {schedule_id} の利用可能会場 {deleted_count} 件を削除しました",
        "deleted_count": deleted_count
    }


@router.delete("/venue/{venue_id}")
async def delete_schedule_available_venues_by_venue(
    venue_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    schedule_venue_service: ScheduleAvailableVenueService = Depends(get_schedule_available_venue_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """指定した会場の利用可能性をすべて削除"""
    deleted_count = await schedule_venue_service.delete_schedule_available_venues_by_venue(venue_id)
    
    return {
        "message": f"会場 {venue_id} の利用可能性 {deleted_count} 件を削除しました",
        "deleted_count": deleted_count
    }
