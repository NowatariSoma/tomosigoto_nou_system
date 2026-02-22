from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    """ユーザーの基本情報"""

    email: str
    name: str | None = None


class UserCreate(UserBase):
    """ユーザー作成用スキーマ"""

    password: str


class UserUpdate(BaseModel):
    """ユーザー更新用スキーマ"""

    email: str | None = None
    name: str | None = None
    password: str | None = None


class UserResponse(UserBase):
    """ユーザーレスポンス用スキーマ"""

    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    email_confirmed_at: datetime | None = None
    last_sign_in_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """データベース内のユーザー情報（内部利用）"""

    hashed_password: str | None = None
