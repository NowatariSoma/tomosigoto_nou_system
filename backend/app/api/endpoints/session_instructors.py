"""
セッション指導者関連のAPIエンドポイント
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_session_instructor_service
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.session_instructors import (
    SessionInstructorCreate,
    SessionInstructorResponse,
    SessionInstructorUpdate,
    SessionInstructorWithDetails,
    SessionInstructorBulkCreate,
    SessionInstructorBulkResponse,
)
from app.services.session_instructor_service import SessionInstructorService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("/candidates", response_model=List[Dict[str, Any]])
async def get_instructor_candidates(
    practice_schedule_id: UUID = Query(..., description="練習スケジュールID"),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """インストラクター候補を取得（出席記録ありかつis_instructorがtrueのユーザー）"""
    candidates = await session_instructor_service.get_instructor_candidates(practice_schedule_id)
    return candidates


@router.get("/", response_model=List[SessionInstructorWithDetails])
async def get_session_instructors(
    schedule_id: Optional[UUID] = Query(None, description="練習スケジュールIDでフィルタ"),
    slot_order: Optional[int] = Query(None, description="コマ順序でフィルタ"),
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """セッション指導者一覧を取得"""
    result = await session_instructor_service.get_all_session_instructors_simple(
        schedule_id=schedule_id,
        slot_order=slot_order
    )
    return result


@router.get("/{session_instructor_id}", response_model=SessionInstructorResponse)
async def get_session_instructor(
    session_instructor_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定したIDのセッション指導者を取得"""
    session_instructor = await session_instructor_service.get_session_instructor(session_instructor_id)
    return session_instructor


@router.get("/schedule/{schedule_id}", response_model=List[SessionInstructorResponse])
async def get_session_instructors_by_schedule(
    schedule_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定したスケジュールの指導者一覧を取得"""
    session_instructors = await session_instructor_service.get_session_instructors_by_schedule(schedule_id)
    return session_instructors


@router.get("/schedule/{schedule_id}/slot/{slot_order}", response_model=List[SessionInstructorResponse])
async def get_session_instructors_by_schedule_and_slot(
    schedule_id: UUID,
    slot_order: int,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定したスケジュールとコマの指導者一覧を取得"""
    session_instructors = await session_instructor_service.get_session_instructors_by_schedule_and_slot(
        schedule_id, slot_order
    )
    return session_instructors


@router.get("/attendance/{attendance_id}", response_model=List[SessionInstructorResponse])
async def get_session_instructors_by_attendance(
    attendance_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定した出席IDの指導者割り当て一覧を取得"""
    session_instructors = await session_instructor_service.get_session_instructors_by_attendance(attendance_id)
    return session_instructors


@router.post("/", response_model=SessionInstructorResponse)
async def create_session_instructor(
    session_instructor_data: SessionInstructorCreate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """セッション指導者を作成"""
    session_instructor = await session_instructor_service.create_session_instructor(
        session_instructor_data.model_dump()
    )
    return session_instructor


@router.post("/bulk", response_model=SessionInstructorBulkResponse)
async def create_session_instructors_bulk(
    bulk_data: SessionInstructorBulkCreate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """セッション指導者を一括作成"""
    result = await session_instructor_service.create_session_instructors_bulk(
        schedule_id=bulk_data.schedule_id,
        slot_order=bulk_data.slot_order,
        schedule_available_venue_id=bulk_data.schedule_available_venue_id,
        attendance_ids=bulk_data.attendance_ids
    )
    return result


@router.put("/{session_instructor_id}", response_model=SessionInstructorResponse)
async def update_session_instructor(
    session_instructor_id: UUID,
    update_data: SessionInstructorUpdate,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """セッション指導者を更新"""
    # None値を除外
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise APIException("更新するデータが指定されていません")
    
    session_instructor = await session_instructor_service.update_session_instructor(
        session_instructor_id, update_dict
    )
    return session_instructor


@router.delete("/{session_instructor_id}")
async def delete_session_instructor(
    session_instructor_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """セッション指導者を削除"""
    print(f"DEBUG delete_session_instructor: session_instructor_id={session_instructor_id}")
    try:
        success = await session_instructor_service.delete_session_instructor(session_instructor_id)
        print(f"DEBUG delete_session_instructor: success={success}")
    except Exception as e:
        print(f"DEBUG delete_session_instructor: エラー発生 - {str(e)}")
        raise
    
    if not success:
        raise APIException("削除に失敗しました")
    
    return {"message": "セッション指導者を削除しました"}


@router.delete("/schedule/{schedule_id}")
async def delete_session_instructors_by_schedule(
    schedule_id: UUID,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定したスケジュールの指導者割り当てをすべて削除"""
    deleted_count = await session_instructor_service.delete_session_instructors_by_schedule(schedule_id)
    
    return {
        "message": f"スケジュール {schedule_id} の指導者割り当て {deleted_count} 件を削除しました",
        "deleted_count": deleted_count
    }


@router.delete("/schedule/{schedule_id}/slot/{slot_order}")
async def delete_session_instructors_by_schedule_and_slot(
    schedule_id: UUID,
    slot_order: int,
    #current_user: Dict[str, Any] = Depends(get_current_user),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """指定したスケジュールとコマの指導者割り当てをすべて削除"""
    deleted_count = await session_instructor_service.delete_session_instructors_by_schedule_and_slot(
        schedule_id, slot_order
    )
    
    return {
        "message": f"スケジュール {schedule_id} コマ {slot_order} の指導者割り当て {deleted_count} 件を削除しました",
        "deleted_count": deleted_count
    }


@router.put("/{session_instructor_id}/move")
async def move_session_instructor(
    session_instructor_id: UUID,
    target_venue_id: UUID = Query(..., description="移動先会場ID"),
    target_slot_order: int = Query(..., description="移動先時限番号"),
    session_instructor_service: SessionInstructorService = Depends(get_session_instructor_service),
):
    """インストラクターを別の会場・時限に移動"""
    updated_session_instructor = await session_instructor_service.move_session_instructor(
        session_instructor_id, target_venue_id, target_slot_order
    )
    return SessionInstructorResponse.model_validate(updated_session_instructor)
