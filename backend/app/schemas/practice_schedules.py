from datetime import datetime, date, time
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PracticeScheduleBase(BaseModel):
    """練習スケジュールの基本情報"""

    schedule_date: date
    start_time: time
    end_time: time
    division_count: int = 6
    title: Optional[str] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    status: Optional[str] = "active"


class PracticeScheduleCreate(PracticeScheduleBase):
    """練習スケジュール作成用スキーマ"""
    # 複数部屋選択対応
    venue_ids: Optional[List[UUID]] = None


class PracticeScheduleUpdate(BaseModel):
    """練習スケジュール更新用スキーマ"""

    schedule_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    division_count: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    status: Optional[str] = None
    # 複数部屋選択対応
    venue_ids: Optional[List[UUID]] = None


class PracticeScheduleResponse(PracticeScheduleBase):
    """練習スケジュールレスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    # 複数部屋選択対応
    venue_ids: Optional[List[UUID]] = None
    venues: Optional[List[dict]] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={
        date: lambda v: v.isoformat() if v else None,
        time: lambda v: v.isoformat() if v else None,
        datetime: lambda v: v.isoformat() if v else None
    })


class ScheduleAvailableVenueBase(BaseModel):
    """スケジュール利用可能会場の基本情報"""

    schedule_id: UUID
    venue_id: UUID
    is_preferred: bool = False
    priority: int = 0
    notes: Optional[str] = None


class ScheduleAvailableVenueCreate(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場作成用スキーマ"""
    pass


class ScheduleAvailableVenueUpdate(BaseModel):
    """スケジュール利用可能会場更新用スキーマ"""

    is_preferred: Optional[bool] = None
    priority: Optional[int] = None
    notes: Optional[str] = None


class ScheduleAvailableVenueResponse(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場レスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SessionBase(BaseModel):
    """セッションの基本情報"""

    schedule_id: UUID
    part_id: Optional[UUID] = None
    title: str
    slot_order: int
    schedule_available_venue_id: Optional[UUID] = None
    priority: int = 0


class SessionCreate(SessionBase):
    """セッション作成用スキーマ"""
    pass


class SessionUpdate(BaseModel):
    """セッション更新用スキーマ"""

    part_id: Optional[UUID] = None
    title: Optional[str] = None
    slot_order: Optional[int] = None
    schedule_available_venue_id: Optional[UUID] = None
    priority: Optional[int] = None


class SessionResponse(SessionBase):
    """セッションレスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# SessionInstructor関連の型定義は instructor.py に移動しました


# 複合レスポンススキーマ
class SessionWithInstructorsResponse(SessionResponse):
    """指導者情報を含むセッションレスポンス"""

    instructors: List[Dict[str, Any]] = []  # SessionInstructorResponseは instructor.py で定義


class PracticeScheduleWithDetailsResponse(PracticeScheduleResponse):
    """詳細情報を含む練習スケジュールレスポンス"""

    available_venues: List[ScheduleAvailableVenueResponse] = []
    sessions: List[SessionWithInstructorsResponse] = []


# フロントエンド表示用スキーマ
class VenueDisplayInfo(BaseModel):
    """会場表示用情報"""

    id: UUID
    name: str
    is_preferred: bool = False
    priority: int = 0
    notes: Optional[str] = None


class InstructorDisplayInfo(BaseModel):
    """指導者表示用情報"""

    id: UUID
    name: str
    email: Optional[str] = None


class SessionDisplayInfo(BaseModel):
    """セッション表示用情報"""

    id: UUID
    title: str
    slot_order: int
    part_name: Optional[str] = None
    venue_name: Optional[str] = None
    priority: int = 0
    instructors: List[InstructorDisplayInfo] = []


class PracticeScheduleDisplayResponse(BaseModel):
    """練習表表示用レスポンス"""

    id: UUID
    schedule_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    description: Optional[str] = None
    schedule_type: Optional[str] = None
    status: Optional[str] = None
    available_venues: List[VenueDisplayInfo] = []
    sessions: List[SessionDisplayInfo] = []

    model_config = ConfigDict(from_attributes=True)