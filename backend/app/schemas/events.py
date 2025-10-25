from datetime import datetime, date, time
from typing import Optional
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ============= Event Schemas =============

class EventBase(BaseModel):
    """イベントの基本情報"""
    title: str
    description: Optional[str] = None
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    event_type: Optional[str] = None  # 'practice', 'performance', 'meeting', 'other'
    status: Optional[str] = "active"  # 'active', 'cancelled', 'completed'
    total_amount: Optional[Decimal] = Decimal("0")
    currency: Optional[str] = "JPY"


class EventCreate(EventBase):
    """イベント作成用スキーマ"""
    pass


class EventUpdate(BaseModel):
    """イベント更新用スキーマ"""
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
    total_amount: Optional[Decimal] = None
    currency: Optional[str] = None


class EventResponse(EventBase):
    """イベントレスポンス用スキーマ"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            date: lambda v: v.isoformat() if v else None,
            time: lambda v: v.isoformat() if v else None,
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else 0.0
        }
    )


# ============= Event Settlement Schemas =============

class EventSettlementBase(BaseModel):
    """イベント決済の基本情報"""
    event_id: str
    user_id: Optional[UUID] = None
    amount: Decimal
    paid_amount: Optional[Decimal] = Decimal("0")
    status: Optional[str] = "pending"  # 'pending', 'paid', 'partial', 'cancelled'
    payment_method: Optional[str] = None  # 'cash', 'bank_transfer', 'credit_card', 'other'
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class EventSettlementCreate(EventSettlementBase):
    """イベント決済作成用スキーマ"""
    pass


class EventSettlementUpdate(BaseModel):
    """イベント決済更新用スキーマ"""
    amount: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class EventSettlementResponse(EventSettlementBase):
    """イベント決済レスポンス用スキーマ"""
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None,
            Decimal: lambda v: float(v) if v else 0.0
        }
    )


# ============= Combined Response Schemas =============

class EventWithSettlementsResponse(EventResponse):
    """決済情報を含むイベントレスポンス"""
    settlements: list[EventSettlementResponse] = []


class EventSettlementSummary(BaseModel):
    """イベント決済サマリー"""
    event_id: str
    total_amount: Decimal
    total_paid: Decimal
    total_pending: Decimal
    settlement_count: int
    paid_count: int
    pending_count: int

    model_config = ConfigDict(
        json_encoders={
            Decimal: lambda v: float(v) if v else 0.0
        }
    )
