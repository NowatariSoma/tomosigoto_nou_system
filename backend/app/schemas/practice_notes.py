from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PracticeNoteBase(BaseModel):
    """練習備考の基本情報"""

    practice_schedule_id: UUID
    title: str
    content: str
    priority: int = 0


class PracticeNoteCreate(PracticeNoteBase):
    """練習備考作成用スキーマ"""
    pass


class PracticeNoteUpdate(BaseModel):
    """練習備考更新用スキーマ"""

    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[int] = None


class PracticeNoteResponse(PracticeNoteBase):
    """練習備考レスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
