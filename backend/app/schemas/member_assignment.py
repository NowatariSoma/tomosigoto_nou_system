from datetime import datetime
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
    
    category: str | None = Field(None, description="謡舞区分", pattern="^(utai|mai)$")
    display_order: int | None = Field(None, description="表示順序", ge=0)


class MemberAssignmentResponse(MemberAssignmentBase):
    """メンバー所属レスポンス用スキーマ"""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None

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


class BulkAssignmentItem(BaseModel):
    """一括所属用の個別アイテムスキーマ"""
    
    user_id: UUID = Field(..., description="所属させるユーザーのID")
    category: str = Field(..., description="謡舞区分 (utai: 謡, mai: 舞)", pattern="^(utai|mai)$")
    display_order: int = Field(default=0, description="表示順序", ge=0)
    
    @field_serializer('user_id')
    def serialize_user_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "12345678-1234-5678-9012-123456789012",
                "category": "utai",
                "display_order": 1
            }
        }


class BulkAssignmentRequest(BaseModel):
    """一括所属リクエスト用スキーマ"""
    
    assignments: list[BulkAssignmentItem] = Field(
        ..., 
        description="所属させるユーザーのリスト",
        min_items=1,
        max_items=50
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "assignments": [
                    {
                        "user_id": "12345678-1234-5678-9012-123456789012",
                        "category": "utai",
                        "display_order": 1
                    },
                    {
                        "user_id": "12345678-1234-5678-9012-123456789013",
                        "category": "mai", 
                        "display_order": 2
                    }
                ]
            }
        }


class MemberAssignmentWithDetails(MemberAssignmentResponse):
    """詳細情報付きメンバー所属レスポンス用スキーマ"""
    
    # ユーザー情報
    user_name: str | None = None
    user_email: str | None = None
    
    # パート情報
    part_name: str | None = None
    part_description: str | None = None
    
    # ステージ情報
    stage_name: str | None = None
    stage_description: str | None = None
