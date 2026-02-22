from datetime import datetime, time
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, ConfigDict


class AttendanceStatus(str, Enum):
    """出席状況の列挙型"""
    PRESENT = "present"      # 出席
    ABSENT = "absent"        # 欠席
    LATE = "late"           # 遅刻
    NO_SHOW = "no_show"     # 無断欠席
    UNDECIDED = "undecided"  # 未決定（後方互換性のため）


class AttendanceBase(BaseModel):
    """出欠記録の基本情報"""

    practice_schedule_id: UUID
    user_id: UUID
    status: AttendanceStatus
    notes: str | None = None
    available_from: time | None = None
    available_to: time | None = None


class AttendanceCreate(AttendanceBase):
    """出欠記録作成用スキーマ"""
    pass


class AttendanceUpdate(BaseModel):
    """出欠記録更新用スキーマ"""

    status: AttendanceStatus | None = None
    notes: str | None = None
    available_from: time | None = None
    available_to: time | None = None


class AttendanceResponse(AttendanceBase):
    """出欠記録レスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    created_by: UUID | None = None
    updated_by: UUID | None = None
    user_name: str | None = None  # フルネーム（last_name_kanji first_name_kanji）
    user_email: str | None = None  # ユーザーのメールアドレス
    user_year: int | None = None  # ユーザーの学年

    model_config = ConfigDict(from_attributes=True)


class AttendanceSummary(BaseModel):
    """練習別出欠サマリー用スキーマ"""
    
    practice_schedule_id: UUID
    schedule_date: datetime
    description: str | None = None
    venue_name: str | None = None
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
    first_name_kanji: str | None = None
    last_name_kanji: str | None = None
    student_id: str | None = None
    attendance_status: AttendanceStatus | None = None
    available_from: time | None = None
    available_to: time | None = None
    schedule_date: datetime | None = None
    description: str | None = None
    venue_name: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


