from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class VenueBase(BaseModel):
    """会場の基本情報"""

    name: str
    capacity: int  # NOT NULL制約
    campus: str  # NOT NULL制約
    is_active: bool = True


class VenueCreate(VenueBase):
    code: str  # NOT NULL制約
    address: str  # NOT NULL制約
    latitude: float  # NOT NULL制約
    longitude: float  # NOT NULL制約
    description: str | None = None
    can_mai: bool = False  # NOT NULL制約
    desk: int | None = None
    chair: int | None = None


class VenueUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = None
    campus: str | None = None
    is_active: bool | None = None
    code: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None


class VenueResponse(VenueCreate):
    """会場レスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
