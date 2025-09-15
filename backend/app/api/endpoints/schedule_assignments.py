from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_supabase_client
from app.repositories.schedule_assignments_repository import ScheduleAssignmentsRepository
from app.services.schedule_assignments_service import ScheduleAssignmentsService
from app.schemas.schedule_assignments import (
    ScheduleAssignmentCreate,
    ScheduleAssignmentUpdate,
    ScheduleAssignmentResponse,
    ScheduleAssignmentWithDetails
)
from supabase import Client

router = APIRouter()


@router.get("/", response_model=List[ScheduleAssignmentResponse])
async def get_all_assignments(client: Client = Depends(get_supabase_client)):
    """すべてのスケジュール割り当てを取得"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignments = await service.get_all_assignments()
        return assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/practice-slot/{practice_slot_id}", response_model=List[ScheduleAssignmentWithDetails])
async def get_assignments_by_practice_slot(
    practice_slot_id: str, 
    client: Client = Depends(get_supabase_client)
):
    """指定された練習日のすべての割り当てを取得"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignments = await service.get_assignments_by_practice_slot(practice_slot_id)
        return assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/practice-slot/{practice_slot_id}/time/{time_slot}/group/{group_id}", response_model=ScheduleAssignmentWithDetails)
async def get_assignment_by_time_and_group(
    practice_slot_id: str,
    time_slot: str,
    group_id: str,
    client: Client = Depends(get_supabase_client)
):
    """指定された時間・グループの割り当てを取得"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignment = await service.get_assignment_by_time_and_group(practice_slot_id, time_slot, group_id)
        if not assignment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        return assignment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ScheduleAssignmentResponse)
async def create_assignment(
    assignment_data: ScheduleAssignmentCreate,
    client: Client = Depends(get_supabase_client)
):
    """新しいスケジュール割り当てを作成"""
    try:
        # デバッグ用ログ: 受信したデータを確認
        print(f"Received assignment data: {assignment_data}")
        
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignment = await service.create_assignment(assignment_data)
        return assignment
    except ValueError as e:
        # バリデーションエラーの場合は422を返す
        print(f"Validation error creating assignment: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        print(f"Error creating assignment: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{assignment_id}", response_model=ScheduleAssignmentResponse)
async def update_assignment(
    assignment_id: str,
    assignment_data: ScheduleAssignmentUpdate,
    client: Client = Depends(get_supabase_client)
):
    """スケジュール割り当てを更新"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignment = await service.update_assignment(assignment_id, assignment_data)
        return assignment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    client: Client = Depends(get_supabase_client)
):
    """スケジュール割り当てを削除"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        success = await service.delete_assignment(assignment_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        return {"message": "Assignment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upsert", response_model=ScheduleAssignmentResponse)
async def upsert_assignment(
    assignment_data: ScheduleAssignmentCreate,
    client: Client = Depends(get_supabase_client)
):
    """スケジュール割り当てを更新または作成"""
    try:
        service = ScheduleAssignmentsService(ScheduleAssignmentsRepository(client))
        assignment = await service.upsert_assignment(assignment_data)
        return assignment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



