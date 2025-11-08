from datetime import datetime, time
from typing import Optional
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, ConfigDict


class AttendanceStatus(str, Enum):
    """出席状況の列挙型"""
    PRESENT = "present"      # 出席
    ABSENT = "absent"        # 欠席
    LATE = "late"           # 遅刻
    NO_SHOW = "no_show"     # 無断欠席
    UNDECIDED = "undecided"  # 未定


class AttendanceBase(BaseModel):
    """出欠記録の基本情報"""

    practice_schedule_id: UUID
    user_id: UUID
    status: AttendanceStatus
    notes: Optional[str] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None


class AttendanceCreate(AttendanceBase):
    """出欠記録作成用スキーマ"""
    pass


class AttendanceUpdate(BaseModel):
    """出欠記録更新用スキーマ"""

    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None


class AttendanceResponse(AttendanceBase):
    """出欠記録レスポンス用スキーマ"""
    
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceSummary(BaseModel):
    """練習別出欠サマリー用スキーマ"""
    
    practice_schedule_id: UUID
    schedule_date: datetime
    description: Optional[str] = None
    venue_name: Optional[str] = None
    total_people: int
    present_count: int
    absent_count: int
    late_count: int
    no_show_count: int
    attendance_rate: float

    model_config = ConfigDict(from_attributes=True)


class UserAttendanceHistory(BaseModel):
    """ユーザー別出欠履歴用スキーマ"""

    user_id: UUID
    email: str
    first_name_kanji: Optional[str] = None
    last_name_kanji: Optional[str] = None
    student_id: Optional[str] = None
    attendance_status: Optional[AttendanceStatus] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None
    schedule_date: Optional[datetime] = None
    description: Optional[str] = None
    venue_name: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


