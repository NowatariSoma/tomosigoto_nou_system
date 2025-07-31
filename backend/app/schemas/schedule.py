"""
スケジュール関連のAPI用スキーマ定義
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from datetime import date as DateType
from uuid import UUID


class ScheduleQueryParams(BaseModel):
    """スケジュール取得クエリパラメータ"""
    start_date: Optional[DateType] = Field(None, description="開始日")
    end_date: Optional[DateType] = Field(None, description="終了日")
    part_id: Optional[UUID] = Field(None, description="パートID")
    venue_id: Optional[UUID] = Field(None, description="会場ID")
    schedule_type: Optional[str] = Field(None, description="練習種別")
    status: Optional[str] = Field(None, description="ステータス")
    page: int = Field(1, ge=1, description="ページ番号")
    limit: int = Field(20, ge=1, le=100, description="取得件数")
    sort_by: str = Field("schedule_date", description="ソート項目")
    sort_order: str = Field("asc", pattern="^(asc|desc)$", description="ソート順")


class VenueSchema(BaseModel):
    """会場情報スキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="会場ID")
    name: str = Field(description="会場名")
    capacity: Optional[int] = Field(None, description="収容人数")
    address: Optional[str] = Field(None, description="住所")


class PartSchema(BaseModel):
    """パート情報スキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="パートID")
    name: str = Field(description="パート名")
    description: Optional[str] = Field(None, description="説明")
    parent_id: Optional[UUID] = Field(None, description="親パートID")


class UserSchema(BaseModel):
    """ユーザー情報スキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="ユーザーID")
    name: Optional[str] = Field(None, description="ユーザー名")
    email: str = Field(description="メールアドレス")


class InstructorResponseSchema(BaseModel):
    """担当者情報レスポンススキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="担当者ID")
    session_id: UUID = Field(description="セッションID")
    user: UserSchema = Field(description="ユーザー情報")
    role: str = Field(description="役割")
    status: str = Field(description="ステータス")
    notes: Dict[str, Any] = Field(default_factory=dict, description="備考")


class PartAssignmentResponseSchema(BaseModel):
    """パート割り当て情報レスポンススキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="割り当てID")
    session_id: UUID = Field(description="セッションID")
    part: PartSchema = Field(description="パート情報")
    priority: int = Field(description="優先度")
    is_required: bool = Field(description="必須参加フラグ")
    special_requirements: Dict[str, Any] = Field(default_factory=dict, description="特別要件")
    status: str = Field(description="ステータス")


class SessionResponseSchema(BaseModel):
    """セッション情報レスポンススキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="セッションID")
    schedule_id: UUID = Field(description="スケジュールID")
    start_time: time = Field(description="開始時間")
    end_time: time = Field(description="終了時間")
    title: str = Field(description="セッションタイトル")
    description: Optional[str] = Field(None, description="説明")
    session_type: str = Field(description="セッション種別")
    priority: int = Field(description="優先度")
    resources: Dict[str, Any] = Field(default_factory=dict, description="必要リソース")
    location_in_venue: Optional[str] = Field(None, description="会場内位置")
    status: str = Field(description="ステータス")
    created_at: datetime = Field(description="作成日時")
    duration_minutes: int = Field(description="セッション時間（分）")
    instructors: List[InstructorResponseSchema] = Field(default_factory=list, description="担当者リスト")
    parts: List[PartAssignmentResponseSchema] = Field(default_factory=list, description="パート割り当てリスト")


class ScheduleResponseSchema(BaseModel):
    """スケジュール情報レスポンススキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID = Field(description="スケジュールID")
    venue: VenueSchema = Field(description="会場情報")
    schedule_date: DateType = Field(description="練習日")
    start_time: time = Field(description="開始時間")
    end_time: time = Field(description="終了時間")
    title: str = Field(description="練習タイトル")
    description: Optional[str] = Field(None, description="説明")
    schedule_type: str = Field(description="練習種別")
    status: str = Field(description="ステータス")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="メタデータ")
    created_at: datetime = Field(description="作成日時")
    created_by: UUID = Field(description="作成者ID")
    duration_minutes: int = Field(description="練習時間（分）")
    sessions_count: int = Field(description="セッション数")
    sessions: List[SessionResponseSchema] = Field(default_factory=list, description="セッション詳細")


class PaginatedResponse(BaseModel):
    """ページネーション付きレスポンス"""
    model_config = ConfigDict(from_attributes=True)
    
    items: List[ScheduleResponseSchema] = Field(description="項目リスト")
    total: int = Field(description="総件数")
    page: int = Field(description="現在のページ")
    limit: int = Field(description="1ページあたりの件数")
    pages: int = Field(description="総ページ数")
    has_next: bool = Field(description="次のページがあるか")
    has_previous: bool = Field(description="前のページがあるか")


class CalendarDataSchema(BaseModel):
    """カレンダー表示用データスキーマ"""
    model_config = ConfigDict(from_attributes=True)
    
    date: DateType = Field(description="日付")
    schedules: List[ScheduleResponseSchema] = Field(description="その日のスケジュール")
    total_schedules: int = Field(description="その日の総スケジュール数")
    has_conflicts: bool = Field(description="時間重複があるか")


class MonthlyScheduleResponse(BaseModel):
    """月別スケジュールレスポンス"""
    model_config = ConfigDict(from_attributes=True)
    
    year: int = Field(description="年")
    month: int = Field(description="月")
    calendar_data: List[CalendarDataSchema] = Field(description="カレンダーデータ")
    total_schedules: int = Field(description="月の総スケジュール数")
    schedule_types: Dict[str, int] = Field(description="種別別件数")


class WeeklyScheduleResponse(BaseModel):
    """週別スケジュールレスポンス"""
    model_config = ConfigDict(from_attributes=True)
    
    year: int = Field(description="年")
    week_number: int = Field(description="週番号")
    start_date: DateType = Field(description="週の開始日")
    end_date: DateType = Field(description="週の終了日")
    calendar_data: List[CalendarDataSchema] = Field(description="カレンダーデータ")
    total_schedules: int = Field(description="週の総スケジュール数")