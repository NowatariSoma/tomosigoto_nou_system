from datetime import datetime, date
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScheduleItemBase(BaseModel):
    """練習表アイテムの基本情報"""
    
    time: str
    duration: str
    activity: str
    columns: List[str]


class ScheduleItemCreate(ScheduleItemBase):
    """練習表アイテム作成用スキーマ"""
    
    practice_slot_id: UUID


class ScheduleItemUpdate(BaseModel):
    """練習表アイテム更新用スキーマ"""
    
    time: Optional[str] = None
    duration: Optional[str] = None
    activity: Optional[str] = None
    columns: Optional[List[str]] = None


class ScheduleItemResponse(ScheduleItemBase):
    """練習表アイテムレスポンス用スキーマ"""
    
    id: UUID
    practice_slot_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class PracticeSlotBase(BaseModel):
    """練習表の基本情報"""
    
    date: date
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class PracticeSlotCreate(PracticeSlotBase):
    """練習表作成用スキーマ"""
    
    pass


class PracticeSlotUpdate(BaseModel):
    """練習表更新用スキーマ"""
    
    date: Optional[date] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PracticeSlotResponse(PracticeSlotBase):
    """練習表レスポンス用スキーマ"""
    
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    schedule_items: Optional[List[ScheduleItemResponse]] = []
    
    model_config = ConfigDict(from_attributes=True)


class PracticeSlotWithItemsResponse(PracticeSlotResponse):
    """練習表とアイテムを含むレスポンス用スキーマ"""
    
    schedule_items: List[ScheduleItemResponse] = []
