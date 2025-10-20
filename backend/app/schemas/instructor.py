from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SessionInstructorBase(BaseModel):
    """セッション指導者の基本情報"""

    schedule_id: UUID
    attendance_id: UUID


class SessionInstructorCreate(SessionInstructorBase):
    """セッション指導者作成用スキーマ"""
    pass


class SessionInstructorUpdate(BaseModel):
    """セッション指導者更新用スキーマ"""

    attendance_id: Optional[UUID] = None


class SessionInstructorResponse(SessionInstructorBase):
    """セッション指導者レスポンス用スキーマ"""

    id: UUID
    schedule_available_venue_id: Optional[UUID] = None
    slot_order: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
