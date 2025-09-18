from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_serializer


class PartBase(BaseModel):
    """パートの基本情報"""

    name: str
    description: Optional[str] = None
    status: str = 'active'


class PartCreate(PartBase):
    stage_id: UUID
    
    @field_serializer('stage_id')
    def serialize_stage_id(self, value: UUID) -> str:
        return str(value)


class PartUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class PartResponse(PartCreate):
    """パートレスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)
