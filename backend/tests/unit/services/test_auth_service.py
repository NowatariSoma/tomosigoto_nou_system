"""
AuthService のユニットテスト（PostgreSQL/psycopg2版）
"""
import pytest
from unittest.mock import Mock, patch
from uuid import uuid4

from app.services.auth_service import AuthService
from app.core.exceptions import APIException


def make_conn_mock():
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = None
    cursor.fetchall.return_value = []
    conn.execute.return_value = cursor
    return conn, cursor


class TestAuthServiceSignin:
    def setup_method(self):
        self.conn, self.cursor = make_conn_mock()
        self.service = AuthService(conn=self.conn)

    def test_signin_success(self):
        user_row = {
            "id": str(uuid4()),
            "email": "test@example.com",
            "encrypted_password": "hashed",
            "is_verified": True,
            "raw_user_meta_data": {},
            "created_at": None,
            "updated_at": None,
            "last_sign_in_at": None,
        }
        self.cursor.fetchone.return_value = user_row
        with patch("app.services.auth_service.verify_password", return_value=True), \
             patch("app.services.auth_service.create_access_token", return_value="access-tok"), \
             patch("app.services.auth_service.create_refresh_token", return_value="refresh-tok"), \
             patch("app.services.auth_service.get_refresh_token_expires", return_value=None):
            result = self.service.signin("test@example.com", "password123")
        assert result["access_token"] == "access-tok"
        assert result["user"]["email"] == "test@example.com"

    def test_signin_user_not_found(self):
        self.cursor.fetchone.return_value = None
        with pytest.raises(APIException):
            self.service.signin("notfound@example.com", "password123")

    def test_signin_wrong_password(self):
        user_row = {
            "id": str(uuid4()), "email": "test@example.com",
            "encrypted_password": "hashed", "is_verified": True,
            "raw_user_meta_data": {}, "created_at": None,
            "updated_at": None, "last_sign_in_at": None,
        }
        self.cursor.fetchone.return_value = user_row
        with patch("app.services.auth_service.verify_password", return_value=False):
            with pytest.raises(APIException):
                self.service.signin("test@example.com", "wrongpassword")

    def test_signin_unverified_user(self):
        user_row = {
            "id": str(uuid4()), "email": "test@example.com",
            "encrypted_password": "hashed", "is_verified": False,
            "raw_user_meta_data": {}, "created_at": None,
            "updated_at": None, "last_sign_in_at": None,
        }
        self.cursor.fetchone.return_value = user_row
        with patch("app.services.auth_service.verify_password", return_value=True):
            with pytest.raises(APIException):
                self.service.signin("test@example.com", "password123")


class TestAuthServiceSignup:
    def setup_method(self):
        self.conn, self.cursor = make_conn_mock()
        self.service = AuthService(conn=self.conn)

    def test_signup_success(self):
        self.cursor.fetchone.return_value = None
        with patch("app.services.auth_service.get_password_hash", return_value="hashed"), \
             patch("app.services.auth_service.secrets.token_urlsafe", return_value="verify-token"), \
             patch("app.services.auth_service.get_refresh_token_expires", return_value=None), \
             patch.object(self.service, "_send_verification_email"):
            result = self.service.signup("new@example.com", "password123")
        assert "message" in result

    def test_signup_already_exists(self):
        self.cursor.fetchone.return_value = {"id": str(uuid4())}
        with pytest.raises(APIException):
            self.service.signup("existing@example.com", "password123")


class TestAuthServiceSignout:
    def setup_method(self):
        self.conn, self.cursor = make_conn_mock()
        self.service = AuthService(conn=self.conn)

    def test_signout_success(self):
        result = self.service.signout("refresh-token")
        assert "message" in result
        self.conn.execute.assert_called()
        self.conn.commit.assert_called()
