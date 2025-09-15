"""
練習スケジュール関連のPydanticスキーマ
"""

from datetime import date, time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PracticeScheduleBase(BaseModel):
    """練習スケジュールの基本スキーマ"""
    selected_venue_id: Optional[str] = None
    schedule_date: date
    start_time: time
    end_time: time
    description: Optional[str] = None
    schedule_type: str = Field(default="regular", description="練習タイプ（regular, rehearsal等）")
    status: Optional[str] = Field(default="active", description="スケジュールステータス")


class PracticeScheduleCreate(PracticeScheduleBase):
    """練習スケジュール作成用スキーマ"""
    pass


class PracticeScheduleUpdate(BaseModel):
    """練習スケジュール更新用スキーマ"""
    selected_venue_id: Optional[str] = None
    schedule_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    status: Optional[str] = None


class PracticeScheduleResponse(PracticeScheduleBase):
    """練習スケジュール応答用スキーマ"""
    id: str
    created_at: str
    updated_at: str
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


class SessionBase(BaseModel):
    """セッションの基本スキーマ"""
    schedule_id: str
    part_id: str
    title: Optional[str] = None
    start_time: time
    end_time: time
    location_in_venue: Optional[str] = None
    priority: int = Field(default=0, description="セッション優先度")


class SessionCreate(SessionBase):
    """セッション作成用スキーマ"""
    pass


class SessionUpdate(BaseModel):
    """セッション更新用スキーマ"""
    part_id: Optional[str] = None
    title: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_in_venue: Optional[str] = None
    priority: Optional[int] = None


class SessionResponse(SessionBase):
    """セッション応答用スキーマ"""
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PracticeScheduleWithSessionsResponse(PracticeScheduleResponse):
    """セッション付き練習スケジュール応答用スキーマ"""
    sessions: List[SessionResponse] = []


# 既存のAPIとの互換性のためのエイリアス
PracticeSlot = PracticeScheduleResponse
PracticeSlotResponse = PracticeScheduleResponse
PracticeSlotCreate = PracticeScheduleCreate
PracticeSlotUpdate = PracticeScheduleUpdate
PracticeSlotWithItemsResponse = PracticeScheduleWithSessionsResponse
ScheduleItem = SessionResponse
ScheduleItemResponse = SessionResponse
ScheduleItemCreate = SessionCreate
ScheduleItemUpdate = SessionUpdate
