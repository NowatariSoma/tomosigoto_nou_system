"""
スケジュール利用可能会場関連のスキーマ定義
"""
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


class ScheduleAvailableVenueBase(BaseModel):
    """スケジュール利用可能会場の基本スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    venue_id: UUID = Field(..., description="会場ID")
    is_preferred: bool = Field(False, description="優先会場かどうか")
    priority: int = Field(0, description="優先度（数値が大きいほど優先）")
    notes: str | None = Field(None, description="備考")


class ScheduleAvailableVenueCreate(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場作成用スキーマ"""
    pass


class ScheduleAvailableVenueUpdate(BaseModel):
    """スケジュール利用可能会場更新用スキーマ"""
    schedule_id: UUID | None = Field(None, description="練習スケジュールID")
    venue_id: UUID | None = Field(None, description="会場ID")
    is_preferred: bool | None = Field(None, description="優先会場かどうか")
    priority: int | None = Field(None, description="優先度（数値が大きいほど優先）")
    notes: str | None = Field(None, description="備考")


class ScheduleAvailableVenueResponse(ScheduleAvailableVenueBase):
    """スケジュール利用可能会場レスポンス用スキーマ"""
    id: UUID = Field(..., description="スケジュール利用可能会場ID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class ScheduleAvailableVenueWithDetails(ScheduleAvailableVenueResponse):
    """詳細情報付きスケジュール利用可能会場レスポンス用スキーマ"""
    # 会場情報
    venue_name: str | None = Field(None, description="会場名")
    venue_address: str | None = Field(None, description="会場住所")
    venue_capacity: int | None = Field(None, description="会場収容人数")
    venue_phone: str | None = Field(None, description="会場電話番号")
    venue_email: str | None = Field(None, description="会場メールアドレス")
    venue_website: str | None = Field(None, description="会場ウェブサイト")
    
    # スケジュール情報
    schedule_date: str | None = Field(None, description="練習日")
    schedule_title: str | None = Field(None, description="練習タイトル")
    schedule_start_time: str | None = Field(None, description="開始時間")
    schedule_end_time: str | None = Field(None, description="終了時間")


class ScheduleAvailableVenueBulkCreate(BaseModel):
    """スケジュール利用可能会場一括作成用スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    venues: list[dict] = Field(..., description="会場情報一覧")
    # venues の構造例:
    # [
    #   {
    #     "venue_id": "uuid",
    #     "is_preferred": true,
    #     "priority": 1,
    #     "notes": "メイン会場"
    #   }
    # ]


class ScheduleAvailableVenueBulkResponse(BaseModel):
    """スケジュール利用可能会場一括作成レスポンス用スキーマ"""
    created_count: int = Field(..., description="作成された件数")
    created_items: list[ScheduleAvailableVenueResponse] = Field(..., description="作成されたスケジュール利用可能会場一覧")
    errors: list[str] = Field(default_factory=list, description="エラー一覧")


class VenueAvailabilityUpdate(BaseModel):
    """会場利用可能性一括更新用スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    venue_updates: list[dict] = Field(..., description="会場更新情報一覧")
    # venue_updates の構造例:
    # [
    #   {
    #     "venue_id": "uuid",
    #     "is_preferred": true,
    #     "priority": 1,
    #     "notes": "更新されたメモ",
    #     "action": "create" | "update" | "delete"
    #   }
    # ]
