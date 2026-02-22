from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_serializer


class PartBase(BaseModel):
    """パートの基本情報"""

    name: str
    description: str | None = None
    status: str = 'active'


class PartCreate(PartBase):
    stage_id: UUID
    
    @field_serializer('stage_id')
    def serialize_stage_id(self, value: UUID) -> str:
        return str(value)


class PartUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None

class PartResponse(PartCreate):
    """パートレスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)
