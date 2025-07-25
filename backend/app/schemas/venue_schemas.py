from pydantic import BaseModel, ConfigDict, field_validator, Field
from typing import Optional, Dict, Any
from datetime import datetime, date, time
from uuid import UUID
import uuid


# ベースクラス
class VenueBase(BaseModel):
    """会場の基本情報"""
    name: str = Field(..., min_length=1, max_length=255, description="会場名")
    code: str = Field(..., min_length=1, max_length=50, description="会場コード")
    address: Optional[str] = Field(None, description="住所")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="緯度")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="経度")
    venue_type: Optional[str] = Field(None, max_length=100, description="会場種別")
    capacity: Optional[int] = Field(None, gt=0, description="収容人数")
    contact_info: Optional[str] = Field(None, description="連絡先情報")
    description: Optional[str] = Field(None, description="説明")


class VenueCreate(VenueBase):
    """会場作成用スキーマ"""
    is_active: bool = Field(default=True, description="有効フラグ")
    
    @field_validator('capacity')
    @classmethod
    def validate_capacity(cls, v):
        if v is not None and v <= 0:
            raise ValueError('収容人数は正の整数である必要があります')
        return v


class VenueUpdate(BaseModel):
    """会場更新用スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    venue_type: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = Field(None, gt=0)
    contact_info: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class VenueResponse(VenueBase):
    """会場レスポンス用スキーマ"""
    id: UUID
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# 会場属性スキーマ
class VenueAttributeBase(BaseModel):
    """会場属性の基本情報"""
    attribute_key: str = Field(..., min_length=1, max_length=100, description="属性キー")
    attribute_value: Optional[str] = Field(None, description="属性値")
    attribute_type: Optional[str] = Field(None, max_length=50, description="属性タイプ")


class VenueAttributeCreate(VenueAttributeBase):
    """会場属性作成用スキーマ"""
    venue_id: UUID = Field(..., description="会場ID")


class VenueAttributeUpdate(BaseModel):
    """会場属性更新用スキーマ"""
    attribute_value: Optional[str] = None
    attribute_type: Optional[str] = Field(None, max_length=50)


class VenueAttributeResponse(VenueAttributeBase):
    """会場属性レスポンス用スキーマ"""
    id: UUID
    venue_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# 利用可能時間枠スキーマ
class AvailabilitySlotBase(BaseModel):
    """利用可能時間枠の基本情報"""
    slot_date: date = Field(..., description="利用可能日")
    start_time: time = Field(..., description="開始時間")
    end_time: time = Field(..., description="終了時間")
    status: str = Field(default="available", description="ステータス")
    cost: float = Field(default=0.0, ge=0, description="利用料金")
    constraints: Optional[Dict[str, Any]] = Field(default_factory=dict, description="制約条件")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed_statuses = ['available', 'booked', 'blocked', 'maintenance']
        if v not in allowed_statuses:
            raise ValueError(f'ステータスは{allowed_statuses}のいずれかである必要があります')
        return v
    
    @field_validator('end_time')
    @classmethod
    def validate_time_order(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('終了時間は開始時間より後である必要があります')
        return v


class AvailabilitySlotCreate(AvailabilitySlotBase):
    """利用可能時間枠作成用スキーマ"""
    venue_id: UUID = Field(..., description="会場ID")


class AvailabilitySlotUpdate(BaseModel):
    """利用可能時間枠更新用スキーマ"""
    slot_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None
    cost: Optional[float] = Field(None, ge=0)
    constraints: Optional[Dict[str, Any]] = None


class AvailabilitySlotResponse(AvailabilitySlotBase):
    """利用可能時間枠レスポンス用スキーマ"""
    id: UUID
    venue_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# 定期予約枠スキーマ
class RecurringSlotBase(BaseModel):
    """定期予約枠の基本情報"""
    day_of_week: int = Field(..., ge=0, le=6, description="曜日 (0=日曜日, 1=月曜日, ..., 6=土曜日)")
    start_time: time = Field(..., description="開始時間")
    end_time: time = Field(..., description="終了時間")
    valid_from: date = Field(..., description="有効開始日")
    valid_until: date = Field(..., description="有効終了日")
    recurrence_rule: str = Field(default="weekly", description="繰り返しルール")
    is_active: bool = Field(default=True, description="有効フラグ")
    
    @field_validator('recurrence_rule')
    @classmethod
    def validate_recurrence_rule(cls, v):
        allowed_rules = ['weekly', 'biweekly', 'monthly']
        if v not in allowed_rules:
            raise ValueError(f'繰り返しルールは{allowed_rules}のいずれかである必要があります')
        return v
    
    @field_validator('day_of_week')
    @classmethod
    def validate_day_of_week(cls, v):
        if not (0 <= v <= 6):
            raise ValueError('曜日は0-6の範囲で指定してください')
        return v
    
    @field_validator('end_time')
    @classmethod
    def validate_time_order(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('終了時間は開始時間より後である必要があります')
        return v
    
    @field_validator('valid_until')
    @classmethod
    def validate_date_order(cls, v, info):
        if 'valid_from' in info.data and v < info.data['valid_from']:
            raise ValueError('有効終了日は有効開始日以降である必要があります')
        return v


class RecurringSlotCreate(RecurringSlotBase):
    """定期予約枠作成用スキーマ"""
    venue_id: UUID = Field(..., description="会場ID")


class RecurringSlotUpdate(BaseModel):
    """定期予約枠更新用スキーマ"""
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    recurrence_rule: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringSlotResponse(RecurringSlotBase):
    """定期予約枠レスポンス用スキーマ"""
    id: UUID
    venue_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# 複合レスポンススキーマ
class VenueWithAttributes(VenueResponse):
    """属性情報を含む会場レスポンス"""
    attributes: list[VenueAttributeResponse] = Field(default_factory=list)


class VenueWithAvailability(VenueResponse):
    """利用可能時間枠を含む会場レスポンス"""
    availability_slots: list[AvailabilitySlotResponse] = Field(default_factory=list)
    recurring_slots: list[RecurringSlotResponse] = Field(default_factory=list)