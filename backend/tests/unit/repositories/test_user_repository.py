"""UserRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.user_repository import UserRepository
from tests.helpers.factories import make_user


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestUserRepository:
    """UserRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_user(id="user-1", name="テスト太郎", email="test@example.com")

    # --- get_user_by_id ---

    def test_get_user_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRepository(conn)
        result = repo.get_user_by_id("user-1")
        assert result == self.data

    def test_get_user_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRepository(conn)
        result = repo.get_user_by_id("nonexistent")
        assert result is None

    # --- get_user_by_email ---

    def test_get_user_by_email(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRepository(conn)
        result = repo.get_user_by_email("test@example.com")
        assert result == self.data

    def test_get_user_by_email_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRepository(conn)
        result = repo.get_user_by_email("notfound@example.com")
        assert result is None

    # --- create_user ---

    def test_create_user(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRepository(conn)
        result = repo.create_user(self.data)
        assert result == self.data
        conn.commit.assert_called()

    def test_create_user_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = UserRepository(conn)
        result = repo.create_user(self.data)
        assert result == {}

    # --- update_user ---

    def test_update_user(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRepository(conn)
        result = repo.update_user("user-1", {"name": "更新太郎"})
        assert result == self.data

    def test_update_user_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRepository(conn)
        result = repo.update_user("nonexistent", {"name": "更新太郎"})
        assert result is None

    # --- delete_user ---

    def test_delete_user(self):
        conn = _make_conn()
        repo = UserRepository(conn)
        result = repo.delete_user("user-1")
        assert result is True
        conn.commit.assert_called()

    # --- get_all_users ---

    def test_get_all_users(self):
        conn = _make_conn(rows_all=[self.data])
        repo = UserRepository(conn)
        result = repo.get_all_users()
        assert result == [self.data]

    def test_get_all_users_empty(self):
        conn = _make_conn(rows_all=[])
        repo = UserRepository(conn)
        result = repo.get_all_users()
        assert result == []

    # --- get_user_count ---

    def test_get_user_count(self):
        conn = _make_conn(rows_one={"cnt": 5})
        repo = UserRepository(conn)
        result = repo.get_user_count()
        assert result == 5

    def test_get_user_count_zero(self):
        conn = _make_conn(rows_one={"cnt": 0})
        repo = UserRepository(conn)
        result = repo.get_user_count()
        assert result == 0
