from datetime import datetime
from enum import Enum
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
    """お問い合わせ作成用スキーマ
    
    注意: user_idはエンドポイントで認証済みユーザーから自動設定されます
    """


class ContactUpdate(BaseModel):
    """お問い合わせ更新用スキーマ"""

    name: str | None = None
    category: ContactCategory | None = None
    content: str | None = None
    status: ContactStatus | None = None


class ContactResponse(ContactBase):
    """お問い合わせレスポンス用スキーマ"""

    id: UUID
    user_id: UUID
    name: str | None = None  # ユーザープロフィールから自動生成
    status: ContactStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

