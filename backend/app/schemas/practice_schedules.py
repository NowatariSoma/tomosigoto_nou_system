from datetime import datetime, date, time
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class PracticeScheduleBase(BaseModel):
    """練習スケジュールの基本情報"""

    schedule_date: date
    start_time: time
    end_time: time
    division_count: int = 6
    title: str | None = None
    description: str | None = None
    schedule_type: str | None = None
    status: str | None = "active"

    @model_validator(mode='after')
    def validate_time_order(self) -> 'PracticeScheduleBase':
        """終了時間が開始時間より後であることを検証"""
        if self.start_time and self.end_time:
            if self.start_time >= self.end_time:
                raise ValueError('終了時間は開始時間より後である必要があります')
        return self


class PracticeScheduleCreate(PracticeScheduleBase):
    """練習スケジュール作成用スキーマ"""
    # 複数部屋選択対応
    venue_ids: list[UUID] | None = None
    # ステージID（この練習で扱う舞台）
    stage_id: UUID | None = None


class PracticeScheduleUpdate(BaseModel):
    """練習スケジュール更新用スキーマ"""

    schedule_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    division_count: int | None = None
    title: str | None = None
    description: str | None = None
    schedule_type: str | None = None
    status: str | None = None
    # 複数部屋選択対応
    venue_ids: list[UUID] | None = None
    # ステージID（この練習で扱う舞台）
    stage_id: UUID | None = None

    @model_validator(mode='after')
    def validate_time_order(self) -> 'PracticeScheduleUpdate':
        """終了時間が開始時間より後であることを検証（両方指定された場合のみ）"""
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValueError('終了時間は開始時間より後である必要があります')
        return self


class PracticeScheduleResponse(PracticeScheduleBase):
    """練習スケジュールレスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    created_by: UUID | None = None
    updated_by: UUID | None = None
    # 複数部屋選択対応
    venue_ids: list[UUID] | None = None
    venues: list[dict[str, Any]] | None = None
    # ステージID（この練習で扱う舞台）
    stage_id: UUID | None = None
    stage: dict[str, Any] | None = None

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
    notes: str | None = None


class ScheduleAvailableVenueCreate(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場作成用スキーマ"""
    pass


class ScheduleAvailableVenueUpdate(BaseModel):
    """スケジュール利用可能会場更新用スキーマ"""

    is_preferred: bool | None = None
    priority: int | None = None
    notes: str | None = None


class ScheduleAvailableVenueResponse(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場レスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SessionBase(BaseModel):
    """セッションの基本情報"""

    schedule_id: UUID
    part_id: UUID | None = None
    part_name: str | None = None  # パート名
    slot_order: int
    venue_id: UUID | None = None  # フロントエンドから送信される会場ID
    schedule_available_venue_id: UUID | None = None
    priority: int = 0


class SessionCreate(SessionBase):
    """セッション作成用スキーマ"""
    pass


class SessionUpdate(BaseModel):
    """セッション更新用スキーマ"""

    part_id: UUID | None = None
    slot_order: int | None = None
    schedule_available_venue_id: UUID | None = None
    priority: int | None = None


class SessionResponse(SessionBase):
    """セッションレスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class SessionInstructorBase(BaseModel):
    """セッション指導者の基本情報"""

    session_id: UUID
    attendance_id: UUID


class SessionInstructorCreate(SessionInstructorBase):
    """セッション指導者作成用スキーマ"""
    pass


class SessionInstructorResponse(SessionInstructorBase):
    """セッション指導者レスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# 複合レスポンススキーマ
class SessionWithInstructorsResponse(SessionResponse):
    """指導者情報を含むセッションレスポンス"""

    instructors: list[SessionInstructorResponse] = []


class PracticeScheduleWithDetailsResponse(PracticeScheduleResponse):
    """詳細情報を含む練習スケジュールレスポンス"""

    available_venues: list[ScheduleAvailableVenueResponse] = []
    sessions: list[SessionWithInstructorsResponse] = []


# フロントエンド表示用スキーマ
class VenueDisplayInfo(BaseModel):
    """会場表示用情報"""

    id: UUID
    name: str
    is_preferred: bool = False
    priority: int = 0
    notes: str | None = None


class InstructorDisplayInfo(BaseModel):
    """指導者表示用情報"""

    id: UUID
    name: str
    email: str | None = None


class SessionDisplayInfo(BaseModel):
    """セッション表示用情報"""

    id: UUID
    title: str
    slot_order: int
    part_name: str | None = None
    venue_name: str | None = None
    priority: int = 0
    instructors: list[InstructorDisplayInfo] = []


class PracticeScheduleDisplayResponse(BaseModel):
    """練習表表示用レスポンス"""

    id: UUID
    schedule_date: date
    start_time: time | None = None
    end_time: time | None = None
    description: str | None = None
    schedule_type: str | None = None
    status: str | None = None
    available_venues: list[VenueDisplayInfo] = []
    sessions: list[SessionDisplayInfo] = []

    model_config = ConfigDict(from_attributes=True)


class BundleVenueInfo(BaseModel):
    """bundle API 用の会場情報"""

    id: str | None = None  # schedule_available_venue_id
    venue_id: str | None = None
    name: str
    color: str | None = None
    is_preferred: bool | None = None
    priority: int | None = None
    campus: str | None = None


class PracticeScheduleBundleSchedule(BaseModel):
    """bundle API のスケジュール情報"""

    id: str
    schedule_date: str
    start_time: str | None = None
    end_time: str | None = None
    title: str | None = None
    description: str | None = None
    division_count: int | None = None
    venues: list[BundleVenueInfo] = []


class PracticeScheduleBundleIdeal(BaseModel):
    """bundle API のidealデータ"""

    schedule_info: dict[str, Any] | None = None
    venues: list[dict[str, Any]] | None = None
    time_schedule: dict[str, Any] | None = None
    debug_info: dict[str, Any] | None = None


class PracticeScheduleBundleAttendance(BaseModel):
    """bundle API の出欠情報"""

    entries: list[dict[str, Any]] = []
    my_entry: dict[str, Any] | None = None


class PracticeScheduleBundleInstructor(BaseModel):
    """bundle API の指導者情報"""

    id: str
    attendance_id: str
    schedule_id: str
    schedule_available_venue_id: str | None = None
    slot_order: int
    created_at: str | None = None
    updated_at: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    attendance_status: str | None = None
    schedule_date: str | None = None
    schedule_title: str | None = None
    schedule_start_time: str | None = None
    schedule_end_time: str | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    part_name: str | None = None


class PracticeScheduleBundleUser(BaseModel):
    """bundle API のユーザー情報"""

    id: str
    name: str
    email: str | None = None


class PracticeScheduleBundleMeta(BaseModel):
    """bundle API のメタ情報"""

    generated_at: str
    version: int = 1


class PracticeScheduleBundleResponse(BaseModel):
    """bundle API 全体レスポンス"""

    schedule: PracticeScheduleBundleSchedule
    ideal: PracticeScheduleBundleIdeal
    attendance: PracticeScheduleBundleAttendance
    users: list[PracticeScheduleBundleUser] = []
    session_instructors: dict[str, list[PracticeScheduleBundleInstructor]] = {}
    meta: PracticeScheduleBundleMeta