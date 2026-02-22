"""
認証オーバーライドヘルパー

エンドポイントテストで FastAPI の依存性注入をオーバーライドし、
認証をバイパスするためのユーティリティ。

使い方:
    # 管理者として認証をオーバーライド
    override_auth_as_admin()

    # テスト後にクリア
    clear_auth_overrides()

    # カスタムユーザーで認証をオーバーライド
    user = make_current_user(email="custom@example.com")
    override_auth(user)
"""

from __future__ import annotations

from app.api.deps import (
    get_current_user,
    require_admin,
    require_instructor_or_admin,
    require_member_or_above,
)
from app.main import app
from app.schemas.current_user import CurrentUser
from tests.helpers.factories import make_current_user


def override_auth(user: CurrentUser | None = None) -> None:
    """
    すべての認証依存関数を指定ユーザーでオーバーライドする。

    user を省略した場合は、デフォルトの admin ユーザーが使用される。
    """
    if user is None:
        user = make_current_user(
            role="authenticated",
            app_metadata={"provider": "email", "providers": ["email"]},
        )

    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[require_admin] = lambda: user
    app.dependency_overrides[require_instructor_or_admin] = lambda: user
    app.dependency_overrides[require_member_or_above] = lambda: user


def override_auth_as_admin(**overrides: object) -> CurrentUser:
    """
    管理者ユーザーとして認証をオーバーライドする。

    Returns:
        使用された CurrentUser インスタンス
    """
    user = make_current_user(
        role="authenticated",
        app_metadata={"provider": "email", "providers": ["email"]},
        **overrides,
    )
    override_auth(user)
    return user


def override_auth_as_member(**overrides: object) -> CurrentUser:
    """
    一般メンバーとして認証をオーバーライドする。

    require_admin はオーバーライドしない（403 を返すように）。

    Returns:
        使用された CurrentUser インスタンス
    """
    user = make_current_user(
        role="authenticated",
        app_metadata={"provider": "email", "providers": ["email"]},
        **overrides,
    )
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[require_member_or_above] = lambda: user
    # require_admin はオーバーライドしない → 管理者専用エンドポイントは 403
    # require_instructor_or_admin もオーバーライドしない → 指導者専用エンドポイントは 403
    return user


def override_auth_as_instructor(**overrides: object) -> CurrentUser:
    """
    指導者ユーザーとして認証をオーバーライドする。

    require_admin はオーバーライドしない（403 を返すように）。

    Returns:
        使用された CurrentUser インスタンス
    """
    user = make_current_user(
        role="authenticated",
        app_metadata={"provider": "email", "providers": ["email"]},
        **overrides,
    )
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[require_instructor_or_admin] = lambda: user
    app.dependency_overrides[require_member_or_above] = lambda: user
    # require_admin はオーバーライドしない → 管理者専用エンドポイントは 403
    return user


def clear_auth_overrides() -> None:
    """すべての認証依存関数のオーバーライドをクリアする。"""
    for dep in [
        get_current_user,
        require_admin,
        require_instructor_or_admin,
        require_member_or_above,
    ]:
        app.dependency_overrides.pop(dep, None)
