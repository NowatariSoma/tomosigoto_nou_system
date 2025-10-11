from datetime import datetime
from typing import Optional
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
    description: Optional[str] = None
    can_mai: bool = False  # NOT NULL制約
    desk: Optional[int] = None
    chair: Optional[int] = None


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    campus: Optional[str] = None
    is_active: Optional[bool] = None
    code: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None


class VenueResponse(VenueCreate):
    """会場レスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
