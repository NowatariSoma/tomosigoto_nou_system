from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ContactCategory(str, Enum):
    """お問い合わせカテゴリの列挙型"""
    BUG = "bug"          # バグ報告
    FEATURE = "feature"  # 機能要望
    QUESTION = "question"  # 質問
    OTHER = "other"      # その他


class ContactStatus(str, Enum):
    """お問い合わせステータスの列挙型"""
    PENDING = "pending"        # 未対応
    IN_PROGRESS = "in_progress"  # 対応中
    RESOLVED = "resolved"       # 解決済み
    CLOSED = "closed"          # クローズ


class ContactBase(BaseModel):
    """お問い合わせの基本情報"""

    category: ContactCategory
    content: str


class ContactCreate(ContactBase):
    """お問い合わせ作成用スキーマ"""
    user_id: UUID


class ContactUpdate(BaseModel):
    """お問い合わせ更新用スキーマ"""

    name: Optional[str] = None
    category: Optional[ContactCategory] = None
    content: Optional[str] = None
    status: Optional[ContactStatus] = None


class ContactResponse(ContactBase):
    """お問い合わせレスポンス用スキーマ"""

    id: UUID
    user_id: UUID
    name: Optional[str] = None  # ユーザープロフィールから自動生成
    status: ContactStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

