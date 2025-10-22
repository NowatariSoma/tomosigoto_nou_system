"""
セッション指導者関連のスキーマ定義
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class SessionInstructorBase(BaseModel):
    """セッション指導者の基本スキーマ"""
    attendance_id: UUID = Field(..., description="出席ID")
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    schedule_available_venue_id: Optional[UUID] = Field(None, description="利用可能会場ID")
    slot_order: int = Field(..., description="コマ順序", gt=0)


class SessionInstructorCreate(SessionInstructorBase):
    """セッション指導者作成用スキーマ"""
    pass


class SessionInstructorUpdate(BaseModel):
    """セッション指導者更新用スキーマ"""
    attendance_id: Optional[UUID] = Field(None, description="出席ID")
    schedule_id: Optional[UUID] = Field(None, description="練習スケジュールID")
    schedule_available_venue_id: Optional[UUID] = Field(None, description="利用可能会場ID")
    slot_order: Optional[int] = Field(None, description="コマ順序", gt=0)


class SessionInstructorResponse(SessionInstructorBase):
    """セッション指導者レスポンス用スキーマ"""
    id: UUID = Field(..., description="セッション指導者ID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True


class SessionInstructorWithDetails(SessionInstructorResponse):
    """詳細情報付きセッション指導者レスポンス用スキーマ"""
    # 出席者情報
    user_name: Optional[str] = Field(None, description="ユーザー名")
    user_email: Optional[str] = Field(None, description="ユーザーメールアドレス")
    attendance_status: Optional[str] = Field(None, description="出席状況")
    
    # スケジュール情報
    schedule_date: Optional[str] = Field(None, description="練習日")
    schedule_title: Optional[str] = Field(None, description="練習タイトル")
    schedule_start_time: Optional[str] = Field(None, description="開始時間")
    schedule_end_time: Optional[str] = Field(None, description="終了時間")
    
    # 会場情報
    venue_name: Optional[str] = Field(None, description="会場名")
    venue_address: Optional[str] = Field(None, description="会場住所")
    
    # パート情報
    part_name: Optional[str] = Field(None, description="パート名")


class SessionInstructorListResponse(BaseModel):
    """セッション指導者一覧レスポンス用スキーマ"""
    items: list[SessionInstructorWithDetails] = Field(..., description="セッション指導者一覧")
    total: int = Field(..., description="総件数")
    page: int = Field(..., description="現在のページ")
    per_page: int = Field(..., description="1ページあたりの件数")
    total_pages: int = Field(..., description="総ページ数")


class SessionInstructorBulkCreate(BaseModel):
    """セッション指導者一括作成用スキーマ"""
    schedule_id: UUID = Field(..., description="練習スケジュールID")
    schedule_available_venue_id: Optional[UUID] = Field(None, description="利用可能会場ID")
    slot_order: int = Field(..., description="コマ順序", gt=0)
    attendance_ids: list[UUID] = Field(..., description="出席ID一覧")


class SessionInstructorBulkResponse(BaseModel):
    """セッション指導者一括作成レスポンス用スキーマ"""
    created_count: int = Field(..., description="作成された件数")
    created_items: list[SessionInstructorResponse] = Field(..., description="作成されたセッション指導者一覧")
    errors: list[str] = Field(default_factory=list, description="エラー一覧")
