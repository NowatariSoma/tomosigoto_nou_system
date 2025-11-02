from typing import List
from uuid import UUID

from app.api.deps import get_current_user_optional, get_practice_notes_service, require_admin
from app.schemas.practice_notes import (
    PracticeNoteCreate,
    PracticeNoteResponse,
    PracticeNoteUpdate,
)
from app.services.practice_notes_service import PracticeNotesService
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/", response_model=List[PracticeNoteResponse])
async def get_all_notes(
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
):
    """
    すべての練習備考を取得

    Args:
        practice_notes_service: 練習備考管理サービス

    Returns:
        すべての練習備考のリスト
    """
    notes = await practice_notes_service.get_all_notes()
    return [PracticeNoteResponse(**note) for note in notes]


@router.get("/{note_id}", response_model=PracticeNoteResponse)
async def get_note(
    note_id: UUID,
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
):
    """
    指定したIDの練習備考を取得

    Args:
        note_id: 練習備考ID
        practice_notes_service: 練習備考管理サービス

    Returns:
        指定したIDの練習備考
    """
    note = await practice_notes_service.get_note(note_id)
    return PracticeNoteResponse(**note)


@router.get("/practice/{practice_schedule_id}", response_model=List[PracticeNoteResponse])
async def get_notes_by_practice(
    practice_schedule_id: UUID,
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
):
    """
    指定した練習スケジュールの備考を取得

    Args:
        practice_schedule_id: 練習スケジュールID
        practice_notes_service: 練習備考管理サービス

    Returns:
        指定した練習の備考のリスト
    """
    notes = await practice_notes_service.get_notes_by_practice(practice_schedule_id)
    return [PracticeNoteResponse(**note) for note in notes]


@router.post("/", response_model=PracticeNoteResponse)
async def create_note(
    note_data: PracticeNoteCreate,
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
    current_user = Depends(get_current_user_optional),
):
    """
    新しい練習備考を作成

    Args:
        note_data: 作成する練習備考のデータ
        practice_notes_service: 練習備考管理サービス
        current_user: 現在のユーザー

    Returns:
        作成された練習備考
    """
    note_dict = note_data.model_dump()
    created_note = await practice_notes_service.create_note(note_dict)
    return PracticeNoteResponse(**created_note)


@router.put("/{note_id}", response_model=PracticeNoteResponse)
async def update_note(
    note_id: UUID,
    note_data: PracticeNoteUpdate,
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
    current_user = Depends(require_admin),
):
    """
    指定した練習備考を更新

    Args:
        note_id: 練習備考ID
        note_data: 更新後の練習備考データ
        practice_notes_service: 練習備考管理サービス
        current_user: 現在のユーザー

    Returns:
        更新された練習備考
    """
    note_dict = note_data.model_dump(exclude_unset=True)
    updated_note = await practice_notes_service.update_note(note_id, note_dict)
    return PracticeNoteResponse(**updated_note)


@router.delete("/{note_id}")
async def delete_note(
    note_id: UUID,
    practice_notes_service: PracticeNotesService = Depends(get_practice_notes_service),
    current_user = Depends(require_admin),
):
    """
    指定した練習備考を削除

    Args:
        note_id: 練習備考ID
        practice_notes_service: 練習備考管理サービス
        current_user: 現在のユーザー

    Returns:
        削除成功のメッセージ
    """
    await practice_notes_service.remove_note(note_id)
    return {"message": "練習備考が正常に削除されました"}
