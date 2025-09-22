"""
Stage関連のPydanticスキーマ定義
"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID


class StageBase(BaseModel):
    """ステージの基本スキーマ"""
    name: str = Field(..., max_length=255, description="舞台名称")
    description: Optional[str] = Field(None, description="舞台説明")
    performance_date: Optional[date] = Field(None, description="公演予定日")
    status: str = Field(default="active", description="ステータス", pattern="^(active|inactive)$")


class StageCreate(StageBase):
    """ステージ作成用スキーマ"""
    pass


class StageUpdate(BaseModel):
    """ステージ更新用スキーマ"""
    name: Optional[str] = Field(None, max_length=255, description="舞台名称")
    description: Optional[str] = Field(None, description="舞台説明")
    performance_date: Optional[date] = Field(None, description="公演予定日")
    status: Optional[str] = Field(None, description="ステータス", pattern="^(active|inactive)$")


class StageResponse(StageBase):
    """ステージレスポンス用スキーマ"""
    id: UUID = Field(..., description="ステージID")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat() if v else None,
        }


class StageListResponse(BaseModel):
    """ステージ一覧レスポンス用スキーマ"""
    stages: list[StageResponse]
    total: int = Field(..., description="総件数")
