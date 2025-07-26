from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any
import re


class UserCreate(BaseModel):
    """ユーザー作成リクエストスキーマ"""
    
    email: EmailStr
    password: str
    student_id: str
    first_name_kanji: str
    first_name_katakana: str
    last_name_kanji: str
    last_name_katakana: str
    grade: int
    department_id: UUID
    role_type: str = "general"
    
    @field_validator('password')
    def validate_password(cls, v):
        """パスワード検証"""
        if len(v) < 8:
            raise ValueError('パスワードは8文字以上である必要があります')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('パスワードには英字を含める必要があります')
        if not re.search(r'[0-9]', v):
            raise ValueError('パスワードには数字を含める必要があります')
        return v
    
    @field_validator('student_id')
    def validate_student_id(cls, v):
        """学籍番号検証"""
        if not v or len(v) < 8:
            raise ValueError('学籍番号は8桁以上である必要があります')
        if not v.isdigit():
            raise ValueError('学籍番号は数字のみである必要があります')
        return v
    
    @field_validator('grade')
    def validate_grade(cls, v):
        """学年検証"""
        if v < 1 or v > 4:
            raise ValueError('学年は1から4の間である必要があります')
        return v
    
    @field_validator('first_name_katakana', 'last_name_katakana')
    def validate_katakana(cls, v):
        """カタカナ検証"""
        if not v:
            return v
        katakana_pattern = r'^[ァ-ヶー\s]+$'
        if not re.match(katakana_pattern, v):
            raise ValueError('カタカナで入力してください')
        return v


class DepartmentResponse(BaseModel):
    """学部情報レスポンススキーマ"""
    
    id: UUID
    department_name: str
    campus: str
    full_display_name: str


class RoleResponse(BaseModel):
    """ロール情報レスポンススキーマ"""
    
    role_type: str
    role_display_name: str
    is_visible_to_general: bool


class ProfileResponse(BaseModel):
    """プロフィール情報レスポンススキーマ"""
    
    student_id: str
    full_name_kanji: str
    full_name_katakana: str
    grade: int
    grade_display: str
    avatar_url: Optional[str] = None
    department: DepartmentResponse


class UserResponse(BaseModel):
    """ユーザー情報レスポンススキーマ"""
    
    id: UUID
    email: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    profile: Optional[ProfileResponse] = None
    role: Optional[RoleResponse] = None


class UserUpdate(BaseModel):
    """ユーザー更新用スキーマ"""
    
    email: Optional[EmailStr] = None
    first_name_kanji: Optional[str] = None
    first_name_katakana: Optional[str] = None
    last_name_kanji: Optional[str] = None
    last_name_katakana: Optional[str] = None
    grade: Optional[int] = None
    department_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    
    @field_validator('grade')
    def validate_grade(cls, v):
        """学年検証"""
        if v is not None and (v < 1 or v > 4):
            raise ValueError('学年は1から4の間である必要があります')
        return v
    
    @field_validator('first_name_katakana', 'last_name_katakana')
    def validate_katakana(cls, v):
        """カタカナ検証"""
        if v is not None and v:
            katakana_pattern = r'^[ァ-ヶー\s]+$'
            if not re.match(katakana_pattern, v):
                raise ValueError('カタカナで入力してください')
        return v


class RoleUpdate(BaseModel):
    """ロール更新用スキーマ"""
    
    role_type: str
    
    @field_validator('role_type')
    def validate_role_type(cls, v):
        """ロールタイプ検証"""
        valid_roles = ['system_admin', 'club_admin', 'senior', 'general']
        if v not in valid_roles:
            raise ValueError(f'ロールタイプは {valid_roles} のいずれかである必要があります')
        return v