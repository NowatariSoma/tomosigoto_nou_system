from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PartBase(BaseModel):
    """パートの基本情報"""

    part_name: str
    description: Optional[str] = None
    is_active: bool = True


class PartCreate(PartBase):
    priority: Optional[int] = None


class PartUpdate(BaseModel):
    part_name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None

class PartResponse(PartCreate):
    """パートレスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
