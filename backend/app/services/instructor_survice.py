import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.practice_schedule_repository import SessionInstructorRepository
from app.schemas.practice_schedules import (
    SessionInstructorCreate,
    SessionInstructorResponse,
)
from app.schemas.instructor import SessionInstructorUpdate

logger = logging.getLogger(__name__)


class InstructorService:
    """セッション指導者関連のビジネスロジックを処理するサービスクラス"""
    def __init__(self, session_instructor_repository: SessionInstructorRepository):
        self.repository = session_instructor_repository

    async def get_all_instructors(self) -> List[Dict[str, Any]]:
        """すべてのセッション指導者を取得"""
        await self.repository.find_all()
    
    async def get_instructor(self, instructor_id: UUID) -> Dict[str, Any]:
        """指定したセッション指導者を取得"""
        return await self.repository.find_by_id(instructor_id)
    
    async def create_instructor(self, instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッション指導者を作成"""
        return await self.repository.create(instructor_data)
    
    async def update_instructor(self, instructor_id: UUID, instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """指定したセッション指導者を更新"""
        return await self.repository.update(instructor_id, instructor_data)
    
    async def delete_instructor(self, instructor_id: UUID) -> bool:
        """指定したセッション指導者を削除"""
        return await self.repository.delete(instructor_id)