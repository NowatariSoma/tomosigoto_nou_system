from typing import Any, Dict, List
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.practice_notes_repository import PracticeNotesRepository


class PracticeNotesService:
    """練習備考のビジネスロジックを実装するクラス"""

    def __init__(self, practice_notes_repository: PracticeNotesRepository):
        self.repository = practice_notes_repository

    async def get_all_notes(self) -> List[Dict[str, Any]]:
        """すべての練習備考を取得"""
        return await self.repository.find_all()

    async def get_note(self, note_id: UUID) -> Dict[str, Any]:
        """指定したIDの練習備考を取得"""
        note = await self.repository.find_by_id(note_id)
        if not note:
            raise APIException("練習備考が見つかりません")
        return note

    async def get_notes_by_practice(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの備考を取得"""
        return await self.repository.find_by_practice_schedule(practice_schedule_id)

    async def create_note(self, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習備考を作成"""
        return await self.repository.create(note_data)

    async def update_note(self, note_id: UUID, note_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習備考を更新"""
        existing = await self.repository.find_by_id(note_id)
        if not existing:
            raise APIException("練習備考が見つかりません")

        return await self.repository.update(note_id, note_data)

    async def remove_note(self, note_id: UUID) -> bool:
        """練習備考を削除"""
        note = await self.repository.find_by_id(note_id)
        if not note:
            raise APIException("練習備考が見つかりません")

        await self.repository.delete(note_id)
        return True
