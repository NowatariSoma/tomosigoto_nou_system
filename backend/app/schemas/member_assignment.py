from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_serializer, Field


class MemberAssignmentBase(BaseModel):
    """メンバー所属の基本情報"""

    user_id: UUID
    part_id: UUID
    category: str = Field(..., description="謡舞区分", pattern="^(utai|mai)$")
    display_order: int = Field(default=0, description="表示順序", ge=0)


class MemberAssignmentCreate(MemberAssignmentBase):
    """メンバー所属作成用スキーマ"""
    
    @field_serializer('user_id')
    def serialize_user_id(self, value: UUID) -> str:
        return str(value)
    
    @field_serializer('part_id')
    def serialize_part_id(self, value: UUID) -> str:
        return str(value)


class MemberAssignmentUpdate(BaseModel):
    """メンバー所属更新用スキーマ"""
    
    category: Optional[str] = Field(None, description="謡舞区分", pattern="^(utai|mai)$")
    display_order: Optional[int] = Field(None, description="表示順序", ge=0)


class MemberAssignmentResponse(MemberAssignmentBase):
    """メンバー所属レスポンス用スキーマ"""

    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)
    
    @field_serializer('user_id')
    def serialize_user_id(self, value: UUID) -> str:
        return str(value)
    
    @field_serializer('part_id')
    def serialize_part_id(self, value: UUID) -> str:
        return str(value)


class MemberAssignmentWithDetails(MemberAssignmentResponse):
    """詳細情報付きメンバー所属レスポンス用スキーマ"""
    
    # ユーザー情報
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    # パート情報
    part_name: Optional[str] = None
    part_description: Optional[str] = None
    
    # ステージ情報
    stage_name: Optional[str] = None
    stage_description: Optional[str] = None
