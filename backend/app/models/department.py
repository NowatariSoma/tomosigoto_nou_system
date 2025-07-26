from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import Dict, Any


class Department(BaseModel):
    """学部のドメインモデル"""
    
    id: UUID
    department_code: str
    department_name: str
    campus: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    @field_validator('campus')
    def validate_campus(cls, v):
        """キャンパス名の検証"""
        valid_campuses = ['今出川', '田辺']
        if v not in valid_campuses:
            raise ValueError(f'キャンパスは {valid_campuses} のいずれかである必要があります')
        return v
    
    @field_validator('department_code')
    def validate_department_code(cls, v):
        """学部コードの検証"""
        if not v or len(v) == 0:
            raise ValueError('学部コードは必須です')
        if len(v) > 50:
            raise ValueError('学部コードは50文字以下である必要があります')
        return v
    
    def full_display_name(self) -> str:
        """フル表示名（学部名 + キャンパス）を取得"""
        return f"{self.department_name}（{self.campus}）"
    
    def is_imadegawa(self) -> bool:
        """今出川キャンパスかどうか"""
        return self.campus == "今出川"
    
    def is_tanabe(self) -> bool:
        """田辺キャンパスかどうか"""
        return self.campus == "田辺"
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "department_code": self.department_code,
            "department_name": self.department_name,
            "campus": self.campus,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }