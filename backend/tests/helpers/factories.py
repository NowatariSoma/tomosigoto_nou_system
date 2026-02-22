"""
テストデータファクトリ

テストで使用するダミーデータを生成するファクトリ関数群。
各関数はデフォルト値を持つ dict を返し、**overrides で任意のフィールドを上書きできる。

使い方:
    user = make_user(name="カスタム太郎")
    venue = make_venue(capacity=100)
    current_user = make_current_user(role="admin")
"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.schemas.current_user import CurrentUser


def make_user(**overrides: Any) -> dict[str, Any]:
    """ユーザーテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "email": f"user-{uuid4().hex[:8]}@example.com",
        "name": "テストユーザー",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_venue(**overrides: Any) -> dict[str, Any]:
    """会場テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "name": "テスト会場",
        "code": "TEST-VENUE-01",
        "capacity": 50,
        "campus": "メインキャンパス",
        "address": "東京都千代田区テスト町1-1-1",
        "latitude": 35.6812,
        "longitude": 139.7671,
        "description": "テスト用会場",
        "is_active": True,
        "can_mai": False,
        "desk": 10,
        "chair": 50,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_part(**overrides: Any) -> dict[str, Any]:
    """パートテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "name": "テストパート",
        "description": "テスト用パート説明",
        "status": "active",
        "stage_id": str(uuid4()),
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_stage(**overrides: Any) -> dict[str, Any]:
    """ステージ（舞台）テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "name": "テスト舞台",
        "description": "テスト用舞台説明",
        "performance_date": "2024-06-15",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_attendance(**overrides: Any) -> dict[str, Any]:
    """出欠記録テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "practice_schedule_id": str(uuid4()),
        "user_id": str(uuid4()),
        "status": "present",
        "notes": None,
        "available_from": None,
        "available_to": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "created_by": str(uuid4()),
        "updated_by": str(uuid4()),
    }
    return {**defaults, **overrides}


def make_practice_schedule(**overrides: Any) -> dict[str, Any]:
    """練習スケジュールテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "schedule_date": "2024-02-15",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "division_count": 6,
        "title": "テスト練習",
        "description": "テスト練習セッション",
        "schedule_type": "regular",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "created_by": str(uuid4()),
        "updated_by": str(uuid4()),
    }
    return {**defaults, **overrides}


def make_session(**overrides: Any) -> dict[str, Any]:
    """セッションテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "schedule_id": str(uuid4()),
        "part_id": str(uuid4()),
        "part_name": "テストパート",
        "slot_order": 1,
        "venue_id": str(uuid4()),
        "schedule_available_venue_id": str(uuid4()),
        "priority": 0,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_contact(**overrides: Any) -> dict[str, Any]:
    """お問い合わせテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "name": "テスト 太郎",
        "category": "question",
        "content": "テスト用お問い合わせ内容です。",
        "status": "pending",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_member_assignment(**overrides: Any) -> dict[str, Any]:
    """メンバー所属テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "part_id": str(uuid4()),
        "category": "utai",
        "display_order": 0,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_current_user(**overrides: Any) -> CurrentUser:
    """CurrentUser TypedDict に準拠したテストデータを生成する。"""
    user_id = overrides.pop("id", None) or str(uuid4())
    defaults: dict[str, Any] = {
        "id": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "email": f"test-{uuid4().hex[:8]}@example.com",
        "email_confirmed_at": "2024-01-01T00:00:00.000Z",
        "phone": "",
        "confirmed_at": "2024-01-01T00:00:00.000Z",
        "last_sign_in_at": "2024-01-01T00:00:00.000Z",
        "app_metadata": {"provider": "email", "providers": ["email"]},
        "user_metadata": {},
        "identities": [],
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return CurrentUser(**{**defaults, **overrides})


def make_user_role(**overrides: Any) -> dict[str, Any]:
    """ユーザーロールテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "role_type": "basic",
        "is_instructor": False,
        "is_visible_to_general": False,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_user_profile(**overrides: Any) -> dict[str, Any]:
    """ユーザープロフィールテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "student_id": f"S{uuid4().hex[:8].upper()}",
        "first_name_kanji": "太郎",
        "first_name_katakana": "タロウ",
        "last_name_kanji": "テスト",
        "last_name_katakana": "テスト",
        "grade": 3,
        "department_id": str(uuid4()),
        "email": f"profile-{uuid4().hex[:8]}@example.com",
        "avatar_url": None,
        "preferences": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_session_instructor(**overrides: Any) -> dict[str, Any]:
    """セッション指導者テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "attendance_id": str(uuid4()),
        "schedule_id": str(uuid4()),
        "schedule_available_venue_id": str(uuid4()),
        "slot_order": 1,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_schedule_available_venue(**overrides: Any) -> dict[str, Any]:
    """スケジュール利用可能会場テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "schedule_id": str(uuid4()),
        "venue_id": str(uuid4()),
        "is_preferred": False,
        "priority": 0,
        "notes": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_schedule_time_slot(**overrides: Any) -> dict[str, Any]:
    """スケジュール時間スロットテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "schedule_id": str(uuid4()),
        "slot_order": 1,
        "start_time": "09:00",
        "end_time": "10:00",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_materials_playlist(**overrides: Any) -> dict[str, Any]:
    """教材プレイリストテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "title": "テストプレイリスト",
        "name": "テスト舞台名",
        "year": 2024,
        "thumbnail_url": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_materials_sub_playlist(**overrides: Any) -> dict[str, Any]:
    """教材サブプレイリストテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "playlist_id": str(uuid4()),
        "title": "テストサブプレイリスト",
        "recorded_date": "2024-03-01",
        "phase": "稽古",
        "playlist_url": "https://www.youtube.com/playlist?list=TEST",
        "thumbnail_url": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_materials_video(**overrides: Any) -> dict[str, Any]:
    """教材ビデオテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "title": "テスト動画",
        "video_url": "https://www.youtube.com/watch?v=TEST",
        "recorded_date": "2024-03-01",
        "thumbnail_url": None,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_materials_favorite(**overrides: Any) -> dict[str, Any]:
    """教材お気に入りテストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "video_id": str(uuid4()),
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_department(**overrides: Any) -> dict[str, Any]:
    """学部テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "department_code": "LIT",
        "department_name": "文学部",
        "campus": "メインキャンパス",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}


def make_account_setting_history(**overrides: Any) -> dict[str, Any]:
    """アカウント設定変更履歴テストデータを生成する。"""
    defaults: dict[str, Any] = {
        "id": str(uuid4()),
        "user_id": str(uuid4()),
        "field_name": "email",
        "old_value": "old@example.com",
        "new_value": "new@example.com",
        "changed_at": "2024-01-01T00:00:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
    }
    return {**defaults, **overrides}
