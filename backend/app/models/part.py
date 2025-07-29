"""
パート関連のドメインモデル定義
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple, List
from uuid import UUID
from pydantic import BaseModel, Field, validator


class PartCategory(BaseModel):
    """パートカテゴリのドメインモデル"""
    
    id: int
    name: str = Field(..., max_length=50, description="カテゴリ名（謡/踊）")
    description: Optional[str] = Field(None, description="説明")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="カテゴリ属性")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "attributes": self.attributes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class PartDefinition(BaseModel):
    """パート定義のドメインモデル"""
    
    id: UUID
    category_id: int = Field(..., description="カテゴリID参照")
    parent_id: Optional[UUID] = Field(None, description="親パートID参照")
    name: str = Field(..., max_length=100, description="パート名")
    code: str = Field(..., max_length=20, description="パートコード")
    level: int = Field(1, ge=1, le=10, description="階層レベル")
    description: Optional[str] = Field(None, description="説明")
    requirements: Dict[str, Any] = Field(default_factory=dict, description="必要条件")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="パート属性")
    is_active: bool = Field(True, description="有効フラグ")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    
    @validator('parent_id')
    def validate_parent_id(cls, v, values):
        """親パートIDの自己参照チェック"""
        if v is not None and 'id' in values and v == values['id']:
            raise ValueError('Part cannot be its own parent')
        return v
    
    @validator('level')
    def validate_level_depth(cls, v, values):
        """階層レベルの深さ制限チェック"""
        if v > 5:  # 最大階層深度を5に制限
            raise ValueError('Part hierarchy cannot exceed 5 levels deep')
        return v
    
    def has_requirement(self, req_name: str) -> bool:
        """特定の要件を持つかどうか確認"""
        return req_name in self.requirements
    
    def is_sub_part_of(self, parent_id: UUID) -> bool:
        """特定パートの下位パートかどうか確認"""
        return self.parent_id == parent_id
    
    @staticmethod
    def validate_no_circular_reference(part_id: UUID, new_parent_id: UUID, all_parts: List['PartDefinition']) -> bool:
        """循環参照がないかチェック（サービスレイヤーで使用）"""
        if new_parent_id is None:
            return True
            
        # 新しい親から辿って、自分自身に戻らないかチェック
        visited = set()
        current_id = new_parent_id
        
        while current_id is not None:
            if current_id in visited:
                # 既に訪問済みの場合は循環参照
                return False
            if current_id == part_id:
                # 自分自身に戻った場合は循環参照
                return False
                
            visited.add(current_id)
            
            # 次の親を探す
            current_part = next((p for p in all_parts if p.id == current_id), None)
            if current_part is None:
                break
            current_id = current_part.parent_id
            
        return True
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "category_id": self.category_id,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "name": self.name,
            "code": self.code,
            "level": self.level,
            "description": self.description,
            "requirements": self.requirements,
            "attributes": self.attributes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class MemberAssignment(BaseModel):
    """メンバー所属のドメインモデル"""
    
    id: UUID
    user_id: UUID = Field(..., description="ユーザーID参照")
    part_id: UUID = Field(..., description="パートID参照")
    is_primary: bool = Field(False, description="主担当フラグ")
    skill_level: int = Field(1, ge=1, le=10, description="スキルレベル")
    experience_points: int = Field(0, ge=0, description="経験値")
    assigned_date: date = Field(..., description="所属開始日")
    end_date: Optional[date] = Field(None, description="所属終了日")
    status: str = Field("active", description="ステータス")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="所属属性")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    
    @validator('status')
    def validate_status(cls, v):
        """ステータスの妥当性チェック"""
        valid_statuses = ['active', 'ended', 'suspended', 'transferred']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        """終了日の妥当性チェック"""
        if v is not None and 'assigned_date' in values:
            if v < values['assigned_date']:
                raise ValueError('End date must be after or equal to assigned date')
        return v
    
    def is_active(self) -> bool:
        """現在有効な所属かどうか確認"""
        if self.status != 'active':
            return False
        if self.end_date is None:
            return True
        return self.end_date >= date.today()
    
    def duration_days(self) -> Optional[int]:
        """所属期間（日数）を計算"""
        if self.end_date is None:
            return None
        return (self.end_date - self.assigned_date).days
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "part_id": str(self.part_id),
            "is_primary": self.is_primary,
            "skill_level": self.skill_level,
            "experience_points": self.experience_points,
            "assigned_date": self.assigned_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "attributes": self.attributes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class AssignmentHistory(BaseModel):
    """所属履歴のドメインモデル"""
    
    id: UUID
    assignment_id: UUID = Field(..., description="所属ID参照")
    action_type: str = Field(..., description="アクション種別")
    previous_state: Dict[str, Any] = Field(default_factory=dict, description="変更前状態")
    new_state: Dict[str, Any] = Field(default_factory=dict, description="変更後状態")
    action_date: datetime = Field(..., description="アクション日時")
    reason: Optional[str] = Field(None, description="理由")
    modified_by: UUID = Field(..., description="変更者ID")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }
    
    @validator('action_type')
    def validate_action_type(cls, v):
        """アクション種別の妥当性チェック"""
        valid_actions = [
            'create', 'update', 'end', 'suspend', 'reactivate',
            'transfer', 'skill_update', 'experience_add', 'delete'
        ]
        if v not in valid_actions:
            raise ValueError(f'Action type must be one of: {valid_actions}')
        return v
    
    def get_changes(self) -> Dict[str, Tuple[Any, Any]]:
        """変更内容を取得（前の値と新しい値のタプル）"""
        changes = {}
        
        # 新しい状態のキーをベースに変更点を抽出
        for key in self.new_state.keys():
            old_value = self.previous_state.get(key)
            new_value = self.new_state.get(key)
            
            # 値が変更されている場合のみ記録
            if old_value != new_value:
                changes[key] = (old_value, new_value)
        
        return changes
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "assignment_id": str(self.assignment_id),
            "action_type": self.action_type,
            "previous_state": self.previous_state,
            "new_state": self.new_state,
            "action_date": self.action_date.isoformat(),
            "reason": self.reason,
            "modified_by": str(self.modified_by)
        }