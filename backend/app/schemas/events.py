from datetime import datetime, date, time
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class EventBase(BaseModel):
    """イベントの基本情報"""
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    status: Optional[str] = "active"


class EventCreate(EventBase):
    """イベント作成用スキーマ"""
    id: Optional[str] = None


class EventUpdate(BaseModel):
    """イベント更新用スキーマ"""
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    status: Optional[str] = None


class EventResponse(EventBase):
    """イベントレスポンス用スキーマ"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoundBase(BaseModel):
    """ラウンドの基本情報"""
    event_id: str
    round_number: int
    round_name: str
    description: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = "scheduled"


class RoundCreate(RoundBase):
    """ラウンド作成用スキーマ"""
    pass


class RoundUpdate(BaseModel):
    """ラウンド更新用スキーマ"""
    round_number: Optional[int] = None
    round_name: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None


class RoundResponse(RoundBase):
    """ラウンドレスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventWithRoundsResponse(EventResponse):
    """ラウンド情報を含むイベントレスポンス"""
    rounds: List[RoundResponse] = []

    model_config = ConfigDict(from_attributes=True)
