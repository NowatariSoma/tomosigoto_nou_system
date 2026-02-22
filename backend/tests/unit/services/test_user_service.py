"""
UserService のユニットテスト（リポジトリモックパターン版）
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

from app.services.user_service import UserService
from app.core.exceptions import APIException
from fastapi import HTTPException
from tests.helpers.factories import make_user


class TestUserService:
    """UserService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.mock_auth_client = Mock()
        self.service = UserService(
            user_repository=self.mock_repo,
            auth_client=self.mock_auth_client,
        )

    # ===== get_all_users =====

    @pytest.mark.asyncio
    async def test_get_all_users_success(self):
        """すべてのユーザー取得 - 正常"""
        users = [make_user(), make_user(name="ユーザー2")]
        self.mock_repo.get_all_users.return_value = users

        result = await self.service.get_all_users()

        assert result == users
        self.mock_repo.get_all_users.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_users_empty(self):
        """すべてのユーザー取得 - 空"""
        self.mock_repo.get_all_users.return_value = []

        result = await self.service.get_all_users()

        assert result == []

    # ===== get_user_by_id =====

    @pytest.mark.asyncio
    async def test_get_user_by_id_found(self):
        """IDでユーザー取得 - 見つかった"""
        user_id = str(uuid4())
        user = make_user(id=user_id)
        self.mock_repo.get_user_by_id.return_value = user

        result = await self.service.get_user_by_id(user_id)

        assert result == user
        self.mock_repo.get_user_by_id.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self):
        """IDでユーザー取得 - 見つからない場合はAPIException"""
        self.mock_repo.get_user_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.get_user_by_id("non-existent-id")

    # ===== verify_jwt_token =====

    @pytest.mark.asyncio
    async def test_verify_jwt_token_valid(self):
        """JWTトークン検証 - 有効"""
        mock_user = Mock()
        mock_user.dict.return_value = {"id": "user-id", "email": "test@example.com"}

        mock_response = Mock()
        mock_response.user = mock_user

        self.mock_auth_client.get_user.return_value = mock_response

        result = await self.service.verify_jwt_token("valid-token")

        assert result is not None
        assert result["id"] == "user-id"

    @pytest.mark.asyncio
    async def test_verify_jwt_token_no_user(self):
        """JWTトークン検証 - ユーザーなし"""
        mock_response = Mock()
        mock_response.user = None

        self.mock_auth_client.get_user.return_value = mock_response

        result = await self.service.verify_jwt_token("invalid-token")

        assert result is None

    @pytest.mark.asyncio
    async def test_verify_jwt_token_exception(self):
        """JWTトークン検証 - エラーの場合はNone"""
        self.mock_auth_client.get_user.side_effect = Exception("Auth error")

        result = await self.service.verify_jwt_token("error-token")

        assert result is None

    # ===== create_user =====

    @pytest.mark.asyncio
    async def test_create_user_success(self):
        """ユーザー作成 - 正常"""
        user_data = {
            "email": "newuser@example.com",
            "password": "password123",
            "name": "新ユーザー",
        }

        mock_auth_user = Mock()
        mock_auth_user.id = "new-user-id"
        mock_auth_user.created_at = None
        mock_auth_user.updated_at = None

        mock_auth_response = Mock()
        mock_auth_response.user = mock_auth_user
        self.mock_auth_client.admin.create_user.return_value = mock_auth_response

        self.mock_repo.get_user_by_email.return_value = None
        created_user = make_user(id="new-user-id", email="newuser@example.com")
        self.mock_repo.create_user.return_value = created_user

        result = await self.service.create_user(user_data)

        assert result["id"] == "new-user-id"
        assert result["email"] == "newuser@example.com"
        self.mock_auth_client.admin.create_user.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_already_exists(self):
        """ユーザー作成 - 既存ユーザー"""
        user_data = {"email": "existing@example.com", "password": "password123"}

        self.mock_repo.get_user_by_email.return_value = make_user(
            email="existing@example.com"
        )

        with pytest.raises(APIException):
            await self.service.create_user(user_data)

        self.mock_auth_client.admin.create_user.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_user_weak_password(self):
        """ユーザー作成 - パスワードが弱い"""
        user_data = {"email": "user@example.com", "password": "12345"}

        self.mock_repo.get_user_by_email.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await self.service.create_user(user_data)

        assert exc_info.value.status_code == 422

    @pytest.mark.asyncio
    async def test_create_user_auth_failure(self):
        """ユーザー作成 - 認証ユーザー作成失敗"""
        user_data = {"email": "user@example.com", "password": "password123"}

        self.mock_repo.get_user_by_email.return_value = None

        mock_auth_response = Mock()
        mock_auth_response.user = None
        self.mock_auth_client.admin.create_user.return_value = mock_auth_response

        with pytest.raises(APIException):
            await self.service.create_user(user_data)

    # ===== delete_user =====

    @pytest.mark.asyncio
    async def test_delete_user_success(self):
        """ユーザー削除 - 正常"""
        user_id = str(uuid4())
        self.mock_repo.get_user_by_id.return_value = make_user(id=user_id)
        self.mock_repo.delete_user.return_value = None
        self.mock_auth_client.admin.delete_user.return_value = None

        result = await self.service.delete_user(user_id)

        assert result is True
        self.mock_repo.delete_user.assert_called_once_with(user_id)
        self.mock_auth_client.admin.delete_user.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self):
        """ユーザー削除 - 存在しない"""
        self.mock_repo.get_user_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.delete_user(str(uuid4()))

    @pytest.mark.asyncio
    async def test_delete_user_auth_failure_still_succeeds(self):
        """ユーザー削除 - Auth削除失敗してもDB削除は成功"""
        user_id = str(uuid4())
        self.mock_repo.get_user_by_id.return_value = make_user(id=user_id)
        self.mock_repo.delete_user.return_value = None
        self.mock_auth_client.admin.delete_user.side_effect = Exception("Auth error")

        result = await self.service.delete_user(user_id)

        assert result is True

    # ===== update_user =====

    @pytest.mark.asyncio
    async def test_update_user_success(self):
        """ユーザー更新 - 正常"""
        user_id = str(uuid4())
        update_data = {"email": "updated@example.com", "name": "Updated Name"}
        existing_user = make_user(id=user_id)
        updated_user = make_user(
            id=user_id, email="updated@example.com", name="Updated Name"
        )

        self.mock_repo.get_user_by_id.return_value = existing_user
        self.mock_repo.update_user.return_value = updated_user

        result = await self.service.update_user(user_id, update_data)

        assert result["email"] == "updated@example.com"
        assert result["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_user_not_found(self):
        """ユーザー更新 - 存在しない"""
        self.mock_repo.get_user_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.update_user(str(uuid4()), {"name": "New Name"})

    @pytest.mark.asyncio
    async def test_update_user_empty_data(self):
        """ユーザー更新 - 空データの場合は既存を返す"""
        user_id = str(uuid4())
        existing_user = make_user(id=user_id)
        self.mock_repo.get_user_by_id.return_value = existing_user

        result = await self.service.update_user(user_id, {})

        assert result == existing_user
        self.mock_repo.update_user.assert_not_called()
