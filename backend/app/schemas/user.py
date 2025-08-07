from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """ユーザーの基本情報"""
    email: str
    name: Optional[str] = None


class UserCreate(UserBase):
    """ユーザー作成用スキーマ"""
    password: str


class UserUpdate(BaseModel):
    """ユーザー更新用スキーマ"""
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    """ユーザーレスポンス用スキーマ"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    email_confirmed_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """データベース内のユーザー情報（内部利用）"""
    hashed_password: Optional[str] = None 