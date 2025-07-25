"""
パート関連API用スキーマ定義
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# カテゴリ関連スキーマ
class CategoryCreate(BaseModel):
    """カテゴリ作成リクエストスキーマ"""
    name: str = Field(..., max_length=50, description="カテゴリ名")
    description: str = Field(..., description="説明")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="カテゴリ属性")


class CategoryUpdate(BaseModel):
    """カテゴリ更新リクエストスキーマ"""
    name: Optional[str] = Field(None, max_length=50, description="カテゴリ名")
    description: Optional[str] = Field(None, description="説明")
    attributes: Optional[Dict[str, Any]] = Field(None, description="カテゴリ属性")


class CategoryResponse(BaseModel):
    """カテゴリ情報レスポンススキーマ"""
    id: int
    name: str
    description: Optional[str]
    attributes: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# パート関連スキーマ
class PartCreate(BaseModel):
    """パート作成リクエストスキーマ"""
    category_id: int = Field(..., description="カテゴリID")
    parent_id: Optional[UUID] = Field(None, description="親パートID")
    name: str = Field(..., max_length=100, description="パート名")
    code: str = Field(..., max_length=20, description="パートコード")
    description: Optional[str] = Field(None, description="説明")
    requirements: Optional[Dict[str, Any]] = Field(default=None, description="必要条件")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="パート属性")


class PartUpdate(BaseModel):
    """パート更新リクエストスキーマ"""
    category_id: Optional[int] = Field(None, description="カテゴリID")
    parent_id: Optional[UUID] = Field(None, description="親パートID")
    name: Optional[str] = Field(None, max_length=100, description="パート名")
    code: Optional[str] = Field(None, max_length=20, description="パートコード")
    description: Optional[str] = Field(None, description="説明")
    requirements: Optional[Dict[str, Any]] = Field(None, description="必要条件")
    attributes: Optional[Dict[str, Any]] = Field(None, description="パート属性")
    is_active: Optional[bool] = Field(None, description="有効フラグ")


class PartResponse(BaseModel):
    """パート情報レスポンススキーマ"""
    id: UUID
    category_id: int
    parent_id: Optional[UUID]
    name: str
    code: str
    level: int
    description: Optional[str]
    requirements: Dict[str, Any]
    attributes: Dict[str, Any]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PartHierarchyResponse(BaseModel):
    """パート階層レスポンススキーマ"""
    id: UUID
    name: str
    code: str
    level: int
    children: List['PartHierarchyResponse'] = []
    
    class Config:
        from_attributes = True


# パート階層レスポンスの自己参照を有効にする
PartHierarchyResponse.model_rebuild()


# 所属関連スキーマ
class AssignmentCreate(BaseModel):
    """所属作成リクエストスキーマ"""
    user_id: UUID = Field(..., description="ユーザーID")
    part_id: UUID = Field(..., description="パートID")
    is_primary: bool = Field(False, description="主担当フラグ")
    skill_level: int = Field(1, ge=1, le=10, description="スキルレベル")
    assigned_date: date = Field(..., description="所属開始日")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="所属属性")


class AssignmentUpdate(BaseModel):
    """所属更新リクエストスキーマ"""
    is_primary: Optional[bool] = Field(None, description="主担当フラグ")
    skill_level: Optional[int] = Field(None, ge=1, le=10, description="スキルレベル")
    experience_points: Optional[int] = Field(None, ge=0, description="経験値")
    status: Optional[str] = Field(None, description="ステータス")
    attributes: Optional[Dict[str, Any]] = Field(None, description="所属属性")


class AssignmentEnd(BaseModel):
    """所属終了リクエストスキーマ"""
    end_date: date = Field(..., description="終了日")
    reason: Optional[str] = Field(None, description="終了理由")


class AssignmentResponse(BaseModel):
    """所属情報レスポンススキーマ"""
    id: UUID
    user_id: UUID
    part_id: UUID
    part_name: str = Field(..., description="パート名")
    is_primary: bool
    skill_level: int
    experience_points: int
    assigned_date: date
    end_date: Optional[date]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AssignmentTransfer(BaseModel):
    """所属移動リクエストスキーマ"""
    from_part_id: UUID = Field(..., description="移動元パートID")
    to_part_id: UUID = Field(..., description="移動先パートID")
    transfer_date: date = Field(..., description="移動日")
    reason: Optional[str] = Field(None, description="移動理由")


class ExperiencePointsAdd(BaseModel):
    """経験値追加リクエストスキーマ"""
    points: int = Field(..., ge=1, description="追加する経験値")
    reason: str = Field(..., description="経験値追加の理由")


# 履歴関連スキーマ
class AssignmentHistoryResponse(BaseModel):
    """所属履歴レスポンススキーマ"""
    id: UUID
    assignment_id: UUID
    action_type: str
    previous_state: Dict[str, Any]
    new_state: Dict[str, Any]
    action_date: datetime
    reason: Optional[str]
    modified_by: UUID
    
    class Config:
        from_attributes = True


# 統計関連スキーマ
class PartStatistics(BaseModel):
    """パート統計レスポンススキーマ"""
    part_id: UUID
    part_name: str
    category_name: str
    total_assignments: int
    active_assignments: int
    primary_assignments: int
    avg_skill_level: Optional[float]
    total_experience_points: Optional[int]
    
    class Config:
        from_attributes = True


class UserAssignmentSummary(BaseModel):
    """ユーザー所属サマリーレスポンススキーマ"""
    user_id: UUID
    active_assignments: List[AssignmentResponse]
    total_experience_points: int
    primary_parts: List[str]
    skill_levels: Dict[str, int]  # パートID: スキルレベル
    
    class Config:
        from_attributes = True


# バリデーション関連スキーマ
class AssignmentValidationResult(BaseModel):
    """所属可能性検証結果スキーマ"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    
    class Config:
        from_attributes = True


# 検索関連スキーマ
class PartSearchRequest(BaseModel):
    """パート検索リクエストスキーマ"""
    category_id: Optional[int] = Field(None, description="カテゴリID")
    parent_id: Optional[UUID] = Field(None, description="親パートID")
    name: Optional[str] = Field(None, description="パート名（部分一致）")
    code: Optional[str] = Field(None, description="パートコード（部分一致）")
    is_active: Optional[bool] = Field(None, description="有効フラグ")
    level: Optional[int] = Field(None, description="階層レベル")


class AssignmentSearchRequest(BaseModel):
    """所属検索リクエストスキーマ"""
    user_id: Optional[UUID] = Field(None, description="ユーザーID")
    part_id: Optional[UUID] = Field(None, description="パートID")
    status: Optional[str] = Field(None, description="ステータス")
    is_primary: Optional[bool] = Field(None, description="主担当フラグ")
    skill_level_min: Optional[int] = Field(None, ge=1, le=10, description="最小スキルレベル")
    skill_level_max: Optional[int] = Field(None, ge=1, le=10, description="最大スキルレベル")
    assigned_date_from: Optional[date] = Field(None, description="所属開始日（開始）")
    assigned_date_to: Optional[date] = Field(None, description="所属開始日（終了）")