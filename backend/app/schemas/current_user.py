"""
認証済みユーザー情報の型定義

Supabase Auth の response.user.dict() が返すユーザーデータの型。
get_current_user 等の依存関数の戻り値型として使用する。
"""

from datetime import datetime
from typing import Any, TypedDict


class AppMetadata(TypedDict, total=False):
    """Supabase Auth のアプリケーションメタデータ"""

    provider: str
    providers: list[str]


class CurrentUser(TypedDict, total=False):
    """
    Supabase Auth のユーザー情報（response.user.dict() の戻り値）。

    get_current_user / require_admin / require_instructor_or_admin /
    require_member_or_above の戻り値型として使用する。

    total=False にしているのは、Supabase Auth のレスポンスで
    全フィールドが常に含まれる保証がないため。
    ただし id は実質必須フィールド。
    """

    id: str
    aud: str
    role: str
    email: str
    email_confirmed_at: datetime | None
    phone: str
    confirmed_at: datetime | None
    last_sign_in_at: datetime | None
    app_metadata: AppMetadata
    user_metadata: dict[str, Any]
    identities: list[dict[str, Any]]
    created_at: datetime | None
    updated_at: datetime | None
