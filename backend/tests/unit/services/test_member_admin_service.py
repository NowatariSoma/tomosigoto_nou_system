"""
MemberAdminService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.member_admin_service import MemberAdminService
from app.core.exceptions import APIException
from tests.helpers.factories import make_user, make_user_profile, make_user_role


class TestMemberAdminService:
    """MemberAdminService のテスト"""

    def setup_method(self):
        self.mock_user_service = Mock()
        self.mock_role_repo = Mock()
        self.mock_profile_repo = Mock()
        self.service = MemberAdminService(
            user_service=self.mock_user_service,
            user_role_repository=self.mock_role_repo,
            user_profile_repository=self.mock_profile_repo,
        )

    # ===== list_members =====

    def test_list_members_success(self):
        """メンバー一覧取得 - 正常"""
        user_id = str(uuid4())
        users = [make_user(id=user_id, email="test@example.com")]
        profiles = [make_user_profile(user_id=user_id, first_name_kanji="太郎", last_name_kanji="テスト")]
        roles = [{"user_id": user_id, "role_type": "admin", "is_instructor": True}]

        self.mock_user_service.get_all_users.return_value = users
        self.mock_profile_repo.get_profiles_by_user_ids.return_value = profiles
        self.mock_role_repo.get_user_roles_with_instructor.return_value = roles

        result = self.service.list_members()

        assert len(result) == 1
        assert result[0]["id"] == user_id
        assert result[0]["role"] == "admin"
        assert result[0]["is_instructor"] is True
        assert result[0]["name"] == "テスト太郎"

    def test_list_members_empty(self):
        """メンバー一覧取得 - ユーザーなし"""
        self.mock_user_service.get_all_users.return_value = []

        result = self.service.list_members()

        assert result == []

    def test_list_members_no_profile(self):
        """メンバー一覧取得 - プロフィールがないユーザー"""
        user_id = str(uuid4())
        users = [make_user(id=user_id, email="noname@example.com")]

        self.mock_user_service.get_all_users.return_value = users
        self.mock_profile_repo.get_profiles_by_user_ids.return_value = []
        self.mock_role_repo.get_user_roles_with_instructor.return_value = []

        result = self.service.list_members()

        assert len(result) == 1
        # プロフィールがない場合はメールが名前として使われる
        assert result[0]["name"] == "noname@example.com"
        assert result[0]["role"] == "basic"
        assert result[0]["is_instructor"] is False

    # ===== get_member =====

    def test_get_member_success(self):
        """単一メンバー取得 - 正常"""
        user_id = str(uuid4())
        user = make_user(id=user_id, email="member@example.com")
        profile = make_user_profile(
            user_id=user_id,
            first_name_kanji="花子",
            last_name_kanji="山田",
        )

        self.mock_user_service.get_user_by_id.return_value = user
        self.mock_profile_repo.get_profile_by_user_id.return_value = profile
        self.mock_role_repo.get_role_by_user_id.return_value = {"role_type": "admin"}
        self.mock_role_repo.get_instructor_flag.return_value = True

        result = self.service.get_member(user_id)

        assert result["id"] == user_id
        assert result["name"] == "山田花子"
        assert result["role"] == "admin"
        assert result["is_instructor"] is True

    def test_get_member_not_found(self):
        """単一メンバー取得 - 存在しない"""
        self.mock_user_service.get_user_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_member(str(uuid4()))

    # ===== update_member_role =====

    def test_update_member_role_existing_role(self):
        """ロール更新 - 既存ロールの更新"""
        user_id = str(uuid4())
        user = make_user(id=user_id)

        self.mock_user_service.get_user_by_id.return_value = user
        self.mock_role_repo.get_role_by_user_id.side_effect = [
            {"role_type": "basic"},  # update_member_role内の呼び出し
            {"role_type": "admin"},  # get_member内の呼び出し
        ]
        self.mock_role_repo.update_role.return_value = None
        self.mock_profile_repo.get_profile_by_user_id.return_value = None
        self.mock_role_repo.get_instructor_flag.return_value = False

        result = self.service.update_member_role(user_id, "admin")

        self.mock_role_repo.update_role.assert_called_once_with(
            user_id, {"role_type": "admin"}
        )

    def test_update_member_role_create_new_role(self):
        """ロール更新 - ロールが未作成の場合は新規作成"""
        user_id = str(uuid4())
        user = make_user(id=user_id)

        self.mock_user_service.get_user_by_id.return_value = user
        self.mock_role_repo.get_role_by_user_id.side_effect = [
            None,  # update_member_role内の呼び出し（ロールなし）
            {"role_type": "viewer"},  # get_member内の呼び出し
        ]
        self.mock_role_repo.create_role.return_value = None
        self.mock_profile_repo.get_profile_by_user_id.return_value = None
        self.mock_role_repo.get_instructor_flag.return_value = False

        result = self.service.update_member_role(user_id, "viewer")

        self.mock_role_repo.create_role.assert_called_once_with(
            {"user_id": user_id, "role_type": "viewer"}
        )

    # ===== update_instructor_flag =====

    def test_update_instructor_flag(self):
        """指導者フラグ更新"""
        user_id = str(uuid4())
        user = make_user(id=user_id)

        self.mock_user_service.get_user_by_id.return_value = user
        self.mock_role_repo.update_instructor_flag.return_value = None
        self.mock_profile_repo.get_profile_by_user_id.return_value = None
        self.mock_role_repo.get_role_by_user_id.return_value = {"role_type": "basic"}
        self.mock_role_repo.get_instructor_flag.return_value = True

        result = self.service.update_instructor_flag(user_id, True)

        self.mock_role_repo.update_instructor_flag.assert_called_once_with(
            user_id, True
        )
        assert result["is_instructor"] is True

    # ===== remove_member =====

    def test_remove_member(self):
        """メンバー削除"""
        user_id = str(uuid4())
        current_user_id = str(uuid4())
        self.mock_role_repo.get_admin_users.return_value = []
        self.mock_role_repo.delete_role.return_value = None
        self.mock_user_service.delete_user.return_value = True

        self.service.remove_member(user_id, current_user_id)

        self.mock_role_repo.delete_role.assert_called_once_with(user_id)
        self.mock_user_service.delete_user.assert_called_once_with(user_id)

    # ===== _normalize_role_type =====

    def test_normalize_role_type_admin(self):
        """ロール正規化 - admin"""
        assert self.service._normalize_role_type("admin") == "admin"

    def test_normalize_role_type_viewer(self):
        """ロール正規化 - viewer"""
        assert self.service._normalize_role_type("viewer") == "viewer"

    def test_normalize_role_type_basic(self):
        """ロール正規化 - basic"""
        assert self.service._normalize_role_type("basic") == "basic"

    def test_normalize_role_type_none(self):
        """ロール正規化 - None"""
        assert self.service._normalize_role_type(None) == "basic"

    def test_normalize_role_type_unknown(self):
        """ロール正規化 - 不明な値"""
        assert self.service._normalize_role_type("unknown") == "basic"

    # ===== _build_display_name =====

    def test_build_display_name_with_profile(self):
        """表示名構築 - プロフィールあり"""
        profile = {"last_name_kanji": "田中", "first_name_kanji": "太郎"}
        user = {"email": "test@example.com"}

        assert self.service._build_display_name(profile, user) == "田中太郎"

    def test_build_display_name_without_profile(self):
        """表示名構築 - プロフィールなし"""
        user = {"email": "test@example.com"}

        assert self.service._build_display_name(None, user) == "test@example.com"

    def test_build_display_name_empty_profile(self):
        """表示名構築 - プロフィールの名前が空"""
        profile = {"last_name_kanji": "", "first_name_kanji": ""}
        user = {"email": "fallback@example.com"}

        assert self.service._build_display_name(profile, user) == "fallback@example.com"

    def test_build_display_name_no_email(self):
        """表示名構築 - メールもない"""
        user = {}

        assert self.service._build_display_name(None, user) == "不明なユーザー"
