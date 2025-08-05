from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class VenueBase(BaseModel):
    """ 会場の基本情報"""
    name: str

class VenueResponse(VenueBase):
    """ 会場レスポンス用スキーマ """
    id: UUID

