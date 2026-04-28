"""
依存関数のユニットテスト
TDDに従って、期待される入出力を定義するテスト
"""
import pytest
from unittest.mock import Mock
from fastapi import HTTPException
from app.api.deps import require_admin


class TestRequireAdmin:
    """管理者権限チェック依存関数のテスト"""

    @pytest.fixture
    def mock_user_role_repository(self):
        """モックUserRoleRepository"""
        return Mock()

    @pytest.fixture
    def admin_user(self):
        """管理者ユーザー"""
        return {
            "id": "admin-user-123",
            "email": "admin@example.com"
        }

    @pytest.fixture
    def senior_user(self):
        """4回生ユーザー"""
        return {
            "id": "senior-user-123",
            "email": "senior@example.com"
        }

    @pytest.fixture
    def general_user(self):
        """一般部員ユーザー"""
        return {
            "id": "general-user-123",
            "email": "general@example.com"
        }

    def test_admin_can_access(self, admin_user, mock_user_role_repository):
        """
        管理者は管理者専用機能にアクセスできる

        期待される動作:
        1. 管理者ロール（admin）を持つユーザーでアクセス
        2. HTTPExceptionが発生せず、ユーザー情報が返される
        """
        mock_user_role_repository.get_role_by_user_id.return_value = {
            "id": "role-123",
            "user_id": admin_user["id"],
            "role_type": "admin",
            "is_visible_to_general": True
        }

        result = require_admin(
            current_user=admin_user,
            user_role_repository=mock_user_role_repository
        )

        assert result == admin_user
        mock_user_role_repository.get_role_by_user_id.assert_called_once_with(admin_user["id"])

    def test_senior_user_cannot_access(self, senior_user, mock_user_role_repository):
        """
        4回生は管理者専用機能にアクセスできない

        期待される動作:
        1. 4回生ロール（senior）を持つユーザーでアクセス
        2. 403 Forbiddenエラーが発生
        """
        mock_user_role_repository.get_role_by_user_id.return_value = {
            "id": "role-123",
            "user_id": senior_user["id"],
            "role_type": "senior",
            "is_visible_to_general": True
        }

        with pytest.raises(HTTPException) as exc_info:
            require_admin(
                current_user=senior_user,
                user_role_repository=mock_user_role_repository
            )

        assert exc_info.value.status_code == 403
        assert "管理者権限" in exc_info.value.detail or "permission" in exc_info.value.detail.lower()

    def test_general_user_cannot_access(self, general_user, mock_user_role_repository):
        """
        一般部員は管理者専用機能にアクセスできない

        期待される動作:
        1. 一般部員ロール（general）を持つユーザーでアクセス
        2. 403 Forbiddenエラーが発生
        """
        mock_user_role_repository.get_role_by_user_id.return_value = {
            "id": "role-123",
            "user_id": general_user["id"],
            "role_type": "general",
            "is_visible_to_general": True
        }

        with pytest.raises(HTTPException) as exc_info:
            require_admin(
                current_user=general_user,
                user_role_repository=mock_user_role_repository
            )

        assert exc_info.value.status_code == 403
        assert "管理者権限" in exc_info.value.detail or "permission" in exc_info.value.detail.lower()

    def test_user_without_role_cannot_access(self, general_user, mock_user_role_repository):
        """
        ロールが存在しないユーザーは管理者専用機能にアクセスできない

        期待される動作:
        1. ロールが存在しないユーザーでアクセス
        2. 403 Forbiddenエラーが発生
        """
        mock_user_role_repository.get_role_by_user_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            require_admin(
                current_user=general_user,
                user_role_repository=mock_user_role_repository
            )

        assert exc_info.value.status_code == 403
        assert "管理者権限" in exc_info.value.detail or "permission" in exc_info.value.detail.lower()