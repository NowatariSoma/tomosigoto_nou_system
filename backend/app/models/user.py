from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, Optional
import re


class User(BaseModel):
    """ユーザーアカウントのドメインモデル"""
    
    id: UUID
    email: EmailStr
    auth_provider: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    is_active: bool
    email_verified: bool
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "email": str(self.email),
            "auth_provider": self.auth_provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "is_active": self.is_active,
            "email_verified": self.email_verified
        }


class UserProfile(BaseModel):
    """学生プロフィールのドメインモデル"""
    
    id: UUID
    user_id: UUID
    student_id: str
    first_name_kanji: str
    first_name_katakana: str
    last_name_kanji: str
    last_name_katakana: str
    grade: int
    department_id: UUID
    avatar_url: Optional[str] = None
    preferences: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    
    @field_validator('student_id')
    def validate_student_id(cls, v):
        """学籍番号の検証"""
        if not v or len(v) < 8:
            raise ValueError('学籍番号は8桁以上である必要があります')
        if not v.isdigit():
            raise ValueError('学籍番号は数字のみである必要があります')
        return v
    
    @field_validator('first_name_katakana', 'last_name_katakana')
    def validate_katakana(cls, v):
        """カタカナの検証"""
        if not v:
            return v
        # カタカナとハイフン、スペースのみ許可
        katakana_pattern = r'^[ァ-ヶー\s]+$'
        if not re.match(katakana_pattern, v):
            raise ValueError('カタカナで入力してください')
        return v
    
    @field_validator('grade')
    def validate_grade(cls, v):
        """学年の検証"""
        if v < 1 or v > 4:
            raise ValueError('学年は1から4の間である必要があります')
        return v
    
    def full_name_kanji(self) -> str:
        """フルネーム（漢字）を取得"""
        return f"{self.last_name_kanji} {self.first_name_kanji}"
    
    def full_name_katakana(self) -> str:
        """フルネーム（カタカナ）を取得"""
        return f"{self.last_name_katakana} {self.first_name_katakana}"
    
    def grade_display(self) -> str:
        """学年表示（例：「3回生」）"""
        return f"{self.grade}回生"
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "student_id": self.student_id,
            "first_name_kanji": self.first_name_kanji,
            "first_name_katakana": self.first_name_katakana,
            "last_name_kanji": self.last_name_kanji,
            "last_name_katakana": self.last_name_katakana,
            "grade": self.grade,
            "department_id": str(self.department_id),
            "avatar_url": self.avatar_url,
            "preferences": self.preferences,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class UserRole(BaseModel):
    """ユーザーロールのドメインモデル"""
    
    id: UUID
    user_id: UUID
    role_type: str
    is_visible_to_general: bool
    created_at: datetime
    updated_at: datetime
    
    @field_validator('role_type')
    def validate_role_type(cls, v):
        """ロールタイプの検証"""
        valid_roles = ['system_admin', 'club_admin', 'senior', 'general']
        if v not in valid_roles:
            raise ValueError(f'ロールタイプは {valid_roles} のいずれかである必要があります')
        return v
    
    def is_admin(self) -> bool:
        """管理者権限かどうか"""
        return self.role_type in ['system_admin', 'club_admin']
    
    def can_manage_users(self) -> bool:
        """ユーザー管理権限があるか"""
        return self.role_type in ['system_admin', 'club_admin']
    
    def role_display_name(self) -> str:
        """ロール表示名を取得"""
        role_names = {
            'system_admin': 'システム管理者',
            'club_admin': '能楽部管理者',
            'senior': '4回生',
            'general': '一般部員'
        }
        return role_names.get(self.role_type, self.role_type)
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "role_type": self.role_type,
            "is_visible_to_general": self.is_visible_to_general,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }