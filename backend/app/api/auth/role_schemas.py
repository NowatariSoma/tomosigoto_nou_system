"""
ロール関連のPydanticスキーマ

このモジュールは以下のスキーマを提供します：
- ロール作成・更新スキーマ
- ロール割り当てスキーマ
- レスポンススキーマ
"""

from typing import List, Optional, Set
from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    """ロール基底スキーマ"""
    name: str = Field(..., description="ロール名")
    description: str = Field(..., description="ロール説明")


class RoleCreate(RoleBase):
    """ロール作成スキーマ"""
    permissions: List[str] = Field(default_factory=list, description="権限リスト")
    inherits_from: List[str] = Field(default_factory=list, description="継承元ロール")


class RoleUpdate(BaseModel):
    """ロール更新スキーマ"""
    description: Optional[str] = Field(None, description="ロール説明")
    permissions: Optional[List[str]] = Field(None, description="権限リスト")
    inherits_from: Optional[List[str]] = Field(None, description="継承元ロール")


class RoleResponse(RoleBase):
    """ロールレスポンススキーマ"""
    permissions: List[str] = Field(..., description="権限リスト")
    inherits_from: List[str] = Field(..., description="継承元ロール")
    
    class Config:
        from_attributes = True


class RoleAssignment(BaseModel):
    """ロール割り当てスキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    role_name: str = Field(..., description="ロール名")


class RoleAssignmentResponse(BaseModel):
    """ロール割り当てレスポンススキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    role_name: str = Field(..., description="ロール名")
    success: bool = Field(..., description="成功フラグ")
    message: str = Field(..., description="メッセージ")


class UserRolesResponse(BaseModel):
    """ユーザーロールレスポンススキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    roles: List[RoleResponse] = Field(..., description="ロールリスト")


class EffectivePermissionsResponse(BaseModel):
    """実効権限レスポンススキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    permissions: List[str] = Field(..., description="実効権限リスト")


class PermissionCheckRequest(BaseModel):
    """権限チェックリクエストスキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    permission: str = Field(..., description="チェック対象権限")


class PermissionCheckResponse(BaseModel):
    """権限チェックレスポンススキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    permission: str = Field(..., description="チェック対象権限")
    has_permission: bool = Field(..., description="権限有無")


class ResourcePermissionCheckRequest(BaseModel):
    """リソース権限チェックリクエストスキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    resource_type: str = Field(..., description="リソースタイプ")
    action: str = Field(..., description="アクション")


class ResourcePermissionCheckResponse(BaseModel):
    """リソース権限チェックレスポンススキーマ"""
    user_id: str = Field(..., description="ユーザーID")
    resource_type: str = Field(..., description="リソースタイプ")
    action: str = Field(..., description="アクション")
    has_permission: bool = Field(..., description="権限有無")