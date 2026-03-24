"""
スケジュール時間スロット関連のAPIエンドポイント
"""
from uuid import UUID

from app.api.deps import (
    get_current_user,
    get_schedule_time_slot_service,
    require_instructor_or_admin,
    require_member_or_above,
)
from app.schemas.current_user import CurrentUser
from app.schemas.schedule_time_slots import (
    ScheduleTimeSlotCreate,
    ScheduleTimeSlotResponse,
    ScheduleTimeSlotUpdate,
    ScheduleTimeSlotBulkCreate,
    ScheduleTimeSlotBulkResponse,
)
from app.services.schedule_time_slot_service import ScheduleTimeSlotService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("/", response_model=list[ScheduleTimeSlotResponse])
def get_schedule_time_slots(
    schedule_id: UUID | None = Query(None, description="練習スケジュールIDでフィルタ"),
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_member_or_above),
):
    """スケジュール時間スロット一覧を取得"""
    result = time_slot_service.get_all_schedule_time_slots(
        schedule_id=schedule_id
    )
    return result


@router.get("/{time_slot_id}", response_model=ScheduleTimeSlotResponse)
def get_schedule_time_slot(
    time_slot_id: UUID,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_member_or_above),
):
    """指定したIDのスケジュール時間スロットを取得"""
    time_slot = time_slot_service.get_schedule_time_slot(time_slot_id)
    return time_slot


@router.get("/schedule/{schedule_id}", response_model=list[ScheduleTimeSlotResponse])
def get_schedule_time_slots_by_schedule(
    schedule_id: UUID,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_member_or_above),
):
    """指定したスケジュールの時間スロット一覧を取得"""
    time_slots = time_slot_service.get_schedule_time_slots_by_schedule(schedule_id)
    return time_slots


@router.post("/", response_model=ScheduleTimeSlotResponse)
def create_schedule_time_slot(
    time_slot_data: ScheduleTimeSlotCreate,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
):
    """スケジュール時間スロットを作成"""
    # バリデーション: slot_order が 0 以下の場合はエラー
    if time_slot_data.slot_order <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="slot_orderは1以上である必要があります"
        )
    
    # バリデーション: start_time と end_time が同じ場合はエラー
    if time_slot_data.start_time >= time_slot_data.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始時刻は終了時刻より前である必要があります"
        )
    
    time_slot = time_slot_service.create_schedule_time_slot(
        time_slot_data.model_dump()
    )
    return time_slot


@router.post("/bulk", response_model=ScheduleTimeSlotBulkResponse)
def create_schedule_time_slots_bulk(
    bulk_data: ScheduleTimeSlotBulkCreate,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
):
    """スケジュール時間スロットを一括作成"""
    result = time_slot_service.create_schedule_time_slots_bulk(
        schedule_id=bulk_data.schedule_id,
        time_slots=bulk_data.time_slots
    )
    return result


@router.put("/{time_slot_id}", response_model=ScheduleTimeSlotResponse)
def update_schedule_time_slot(
    time_slot_id: UUID,
    update_data: ScheduleTimeSlotUpdate,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
):
    """スケジュール時間スロットを更新"""
    # None値を除外
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="更新するデータが指定されていません"
        )
    
    time_slot = time_slot_service.update_schedule_time_slot(
        time_slot_id, update_dict
    )
    return time_slot


@router.delete("/{time_slot_id}")
def delete_schedule_time_slot(
    time_slot_id: UUID,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
):
    """スケジュール時間スロットを削除"""
    success = time_slot_service.delete_schedule_time_slot(time_slot_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="削除に失敗しました"
        )
    
    return {"message": "スケジュール時間スロットを削除しました"}


@router.delete("/schedule/{schedule_id}")
def delete_schedule_time_slots_by_schedule(
    schedule_id: UUID,
    #current_user: CurrentUser = Depends(get_current_user),
    time_slot_service: ScheduleTimeSlotService = Depends(get_schedule_time_slot_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
):
    """指定したスケジュールの時間スロットをすべて削除"""
    deleted_count = time_slot_service.delete_schedule_time_slots_by_schedule(schedule_id)
    
    return {
        "message": f"スケジュール {schedule_id} の時間スロット {deleted_count} 件を削除しました",
        "deleted_count": deleted_count
    }

