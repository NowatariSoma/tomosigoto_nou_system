from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    """学部の基本情報"""

    department_code: str = Field(..., description="学部コード")
    department_name: str = Field(..., description="学部名")


class DepartmentResponse(DepartmentBase):
    """学部レスポンス用スキーマ"""

    id: str
    is_active: bool = True
    campus: str | None = Field(None, description="キャンパス")
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AccountSettingProfileBase(BaseModel):
    """アカウント設定プロフィールの基本情報（データベースフィールド名と一致）"""

    student_id: str = Field(..., description="学籍番号")
    first_name_kanji: str = Field(..., description="名（漢字）")
    first_name_katakana: str = Field(..., description="名（カタカナ）")
    last_name_kanji: str = Field(..., description="姓（漢字）")
    last_name_katakana: str = Field(..., description="姓（カタカナ）")
    grade: int = Field(..., ge=1, le=6, description="学年（1-6年）")  # year -> grade
    department_id: str = Field(..., description="学部ID")  # faculty -> department_id
    email: str | None = Field(None, description="メールアドレス")


class AccountSettingProfileCreate(BaseModel):
    """アカウント設定プロフィール作成用スキーマ（フロントエンド互換）"""

    student_id: str = Field(..., description="学籍番号")
    first_name_kanji: str = Field(..., description="名（漢字）")
    first_name_katakana: str = Field(..., description="名（カタカナ）")
    last_name_kanji: str = Field(..., description="姓（漢字）")
    last_name_katakana: str = Field(..., description="姓（カタカナ）")
    year: int = Field(..., ge=1, le=6, description="学年（1-6年）")
    department_code: str = Field(..., description="学部コード")
    email: str | None = Field(None, description="メールアドレス")
    avatar_url: str | None = Field(None, description="アバター画像URL")


class AccountSettingProfileResponse(BaseModel):
    """アカウント設定プロフィールレスポンス用スキーマ（フロントエンド互換）"""

    id: str
    user_id: str
    student_id: str
    first_name_kanji: str
    first_name_katakana: str
    last_name_kanji: str
    last_name_katakana: str
    year: int = Field(..., ge=1, le=6, description="学年（1-6年）")  # grade -> year
    department_code: str = Field(..., description="学部コード")  # department_id -> department_code
    department_name: str | None = Field(None, description="学部名")
    email: str | None = Field(None, description="メールアドレス")
    avatar_url: str | None = Field(None, description="アバター画像URL")
    preferences: dict[str, Any] | None = Field(None, description="設定情報")
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AccountSettingProfileUpdate(BaseModel):
    """アカウント設定プロフィール更新用スキーマ（データベースフィールド名と一致）"""

    student_id: str | None = Field(None, description="学籍番号")
    first_name_kanji: str | None = Field(None, description="名（漢字）")
    first_name_katakana: str | None = Field(None, description="名（カタカナ）")
    last_name_kanji: str | None = Field(None, description="姓（漢字）")
    last_name_katakana: str | None = Field(None, description="姓（カタカナ）")
    grade: int | None = Field(None, ge=1, le=6, description="学年（1-6年）")  # year -> grade
    department_id: str | None = Field(None, description="学部ID")  # faculty -> department_id
    email: str | None = Field(None, description="メールアドレス")
    avatar_url: str | None = Field(None, description="アバター画像URL")




class AccountSettingHistoryBase(BaseModel):
    """アカウント設定変更履歴の基本情報"""

    field_name: str = Field(..., description="変更されたフィールド名")
    old_value: str | None = Field(None, description="変更前の値")
    new_value: str | None = Field(None, description="変更後の値")
    change_reason: str | None = Field(None, description="変更理由")


class AccountSettingHistoryCreate(AccountSettingHistoryBase):
    """アカウント設定変更履歴作成用スキーマ"""

    pass


class AccountSettingHistoryResponse(AccountSettingHistoryBase):
    """アカウント設定変更履歴レスポンス用スキーマ"""

    id: str
    user_id: str
    changed_by: str | None = Field(None, description="変更者ユーザーID")
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountSettingUpdateRequest(BaseModel):
    """アカウント設定更新リクエスト用スキーマ"""

    student_id: str | None = Field(None, description="学籍番号")
    first_name_kanji: str | None = Field(None, description="名（漢字）")
    first_name_katakana: str | None = Field(None, description="名（カタカナ）")
    last_name_kanji: str | None = Field(None, description="姓（漢字）")
    last_name_katakana: str | None = Field(None, description="姓（カタカナ）")
    year: int | None = Field(None, ge=1, le=6, description="学年（1-6年）")
    department_code: str | None = Field(None, description="学部コード")
    email: str | None = Field(None, description="メールアドレス")
    avatar_url: str | None = Field(None, description="アバター画像URL")
    change_reason: str | None = Field(None, description="変更理由")


class AccountSettingBulkUpdateRequest(BaseModel):
    """アカウント設定一括更新リクエスト用スキーマ"""

    updates: list[AccountSettingUpdateRequest] = Field(..., description="更新項目のリスト")
    change_reason: str | None = Field(None, description="変更理由")


class AccountSettingValidationError(BaseModel):
    """アカウント設定バリデーションエラー用スキーマ"""

    field: str = Field(..., description="エラーフィールド名")
    message: str = Field(..., description="エラーメッセージ")
    value: str | None = Field(None, description="エラー値")


class AccountSettingValidationResponse(BaseModel):
    """アカウント設定バリデーション結果レスポンス用スキーマ"""

    is_valid: bool = Field(..., description="バリデーション結果")
    errors: list[AccountSettingValidationError] = Field(default_factory=list, description="エラーリスト")
    warnings: list[str] = Field(default_factory=list, description="警告リスト")


class UserRoleBase(BaseModel):
    """ユーザーロールの基本情報"""

    role_type: str = Field(..., description="ロールタイプ")
    is_visible_to_general: bool = Field(False, description="一般ユーザーに表示するか")


class UserRoleResponse(UserRoleBase):
    """ユーザーロールレスポンス用スキーマ"""

    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    """ユーザーの基本情報"""

    email: str = Field(..., description="メールアドレス")


class UserResponse(UserBase):
    """ユーザーレスポンス用スキーマ"""

    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_sign_in_at: datetime | None = None
    raw_user_meta_data: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)