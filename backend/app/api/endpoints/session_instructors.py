from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_session_instructor_repository
from app.schemas.instructor import (
    SessionInstructorBase,
    SessionInstructorCreate,
    SessionInstructorResponse,
    SessionInstructorUpdate,
)
from app.repositories.practice_schedule_repository import SessionInstructorRepository
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.get("/", response_model=List[SessionInstructorResponse])
async def get_all_session_instructors(
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """セッション指導者を取得（全部）"""

    instructors = await session_instructor_repository.find_all()
    return instructors


@router.get("/session/{schedule_id}", response_model=List[SessionInstructorResponse])
async def get_session_instructors_by_schedule(
    schedule_id: UUID,
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """指定されたスケジュールの指導者を取得（session_idパラメータでschedule_idを指定）"""

    instructors = await session_instructor_repository.find_by_schedule(schedule_id)
    return instructors


@router.get("/{session_instructor_id}", response_model=SessionInstructorResponse)
async def get_session_instructor(
    session_instructor_id: UUID,
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """指定したセッション指導者を取得（一人）"""

    instructor_data = await session_instructor_repository.find_by_id(session_instructor_id)
    return SessionInstructorResponse(**instructor_data)


@router.post("/", response_model=SessionInstructorResponse)
async def create_session_instructor(
    session_instructor_data: SessionInstructorCreate,
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """新しいセッション指導者を作成"""

    try:
        # UUIDを文字列に変換してからリポジトリに渡す
        instructor_data = session_instructor_data.dict()
        instructor_data["schedule_id"] = str(instructor_data["schedule_id"])
        instructor_data["attendance_id"] = str(instructor_data["attendance_id"])
        
        # schedule_available_venue_idが提供されている場合は文字列に変換
        if instructor_data.get("schedule_available_venue_id"):
            instructor_data["schedule_available_venue_id"] = str(instructor_data["schedule_available_venue_id"])
        
        created_instructor = await session_instructor_repository.create(instructor_data)
        return SessionInstructorResponse(**created_instructor)
    except Exception as e:
        error_msg = str(e)
        if "attendance/schedule mismatch" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="セッションと出席記録が同じスケジュールに属していないか、出席ステータスが'present'または'late'ではありません。"
            )
        elif "status not eligible" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="出席ステータスが'present'または'late'ではありません。"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"セッション指導者の作成に失敗しました: {error_msg}"
            )


@router.patch("/{session_instructor_id}", response_model=SessionInstructorResponse)
async def update_session_instructor(
    session_instructor_id: UUID,
    session_instructor_data: SessionInstructorUpdate,
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """指定したセッション指導者を更新"""
    
    # UUIDを文字列に変換してからリポジトリに渡す
    instructor_data = session_instructor_data.dict(exclude_unset=True)
    if "attendance_id" in instructor_data:
        instructor_data["attendance_id"] = str(instructor_data["attendance_id"])
    
    updated_instructor = await session_instructor_repository.update(session_instructor_id, instructor_data)
    return SessionInstructorResponse(**updated_instructor)


@router.delete("/{session_instructor_id}")
async def delete_session_instructor(
    session_instructor_id: UUID,
    session_instructor_repository: SessionInstructorRepository = Depends(get_session_instructor_repository),
    # current_user: Dict[str, Any] = Depends(get_current_user),
):
    """指定したセッション指導者を削除"""
    await session_instructor_repository.delete(session_instructor_id)
    return {"message": "セッション指導者が削除されました"}
