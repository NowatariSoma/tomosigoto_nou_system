"""
UserService のユニットテスト（PostgreSQL版）
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.user_service import UserService
from app.core.exceptions import APIException
from fastapi import HTTPException
from tests.helpers.factories import make_user


class TestUserService:
    def setup_method(self):
        self.mock_repo = Mock()
        self.service = UserService(user_repository=self.mock_repo)

    def test_get_all_users_success(self):
        users = [make_user(), make_user()]
        self.mock_repo.get_all_users.return_value = users
        result = self.service.get_all_users()
        assert result == users
        self.mock_repo.get_all_users.assert_called_once()

    def test_get_all_users_empty(self):
        self.mock_repo.get_all_users.return_value = []
        result = self.service.get_all_users()
        assert result == []

    def test_get_user_by_id_found(self):
        user_id = str(uuid4())
        user = make_user(id=user_id)
        self.mock_repo.get_user_by_id.return_value = user
        result = self.service.get_user_by_id(user_id)
        assert result == user
        self.mock_repo.get_user_by_id.assert_called_once_with(user_id)

    def test_get_user_by_id_not_found(self):
        self.mock_repo.get_user_by_id.return_value = None
        with pytest.raises(APIException):
            self.service.get_user_by_id(str(uuid4()))

    def test_create_user_success(self):
        user_data = {"email": "new@example.com", "password": "password123"}
        self.mock_repo.get_user_by_email.return_value = None
        created_user = make_user(email="new@example.com")
        self.mock_repo.create_user.return_value = created_user
        result = self.service.create_user(user_data)
        assert result["email"] == "new@example.com"
        self.mock_repo.create_user.assert_called_once_with(user_data)

    def test_create_user_already_exists(self):
        user_data = {"email": "existing@example.com", "password": "password123"}
        self.mock_repo.get_user_by_email.return_value = make_user(email="existing@example.com")
        with pytest.raises(APIException):
            self.service.create_user(user_data)
        self.mock_repo.create_user.assert_not_called()

    def test_create_user_weak_password(self):
        user_data = {"email": "user@example.com", "password": "12345"}
        self.mock_repo.get_user_by_email.return_value = None
        with pytest.raises(HTTPException) as exc_info:
            self.service.create_user(user_data)
        assert exc_info.value.status_code == 422

    def test_delete_user_success(self):
        user_id = str(uuid4())
        self.mock_repo.get_user_by_id.return_value = make_user(id=user_id)
        self.mock_repo.delete_user.return_value = None
        result = self.service.delete_user(user_id)
        assert result is True
        self.mock_repo.delete_user.assert_called_once_with(user_id)

    def test_delete_user_not_found(self):
        self.mock_repo.get_user_by_id.return_value = None
        with pytest.raises(APIException):
            self.service.delete_user(str(uuid4()))

    def test_update_user_success(self):
        user_id = str(uuid4())
        existing_user = make_user(id=user_id)
        updated_user = make_user(id=user_id, email="updated@example.com")
        self.mock_repo.get_user_by_id.return_value = existing_user
        self.mock_repo.update_user.return_value = updated_user
        result = self.service.update_user(user_id, {"email": "updated@example.com"})
        assert result["email"] == "updated@example.com"

    def test_update_user_not_found(self):
        self.mock_repo.get_user_by_id.return_value = None
        with pytest.raises(APIException):
            self.service.update_user(str(uuid4()), {"email": "x@example.com"})

    def test_update_user_empty_data(self):
        user_id = str(uuid4())
        existing_user = make_user(id=user_id)
        self.mock_repo.get_user_by_id.return_value = existing_user
        result = self.service.update_user(user_id, {})
        assert result == existing_user
        self.mock_repo.update_user.assert_not_called()
