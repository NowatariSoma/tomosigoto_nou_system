"""UserRoleRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock, call

from app.repositories.user_role_repository import UserRoleRepository
from tests.helpers.factories import make_user_role


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestUserRoleRepository:
    """UserRoleRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_user_role(
            id="role-1", user_id="user-1", role_type="admin"
        )

    # --- get_role_by_user_id ---

    def test_get_role_by_user_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRoleRepository(conn)
        result = repo.get_role_by_user_id("user-1")
        assert result == self.data

    def test_get_role_by_user_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRoleRepository(conn)
        result = repo.get_role_by_user_id("nonexistent")
        assert result is None

    # --- get_role_by_user_and_type ---

    def test_get_role_by_user_and_type(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRoleRepository(conn)
        result = repo.get_role_by_user_and_type("user-1", "admin")
        assert result == self.data

    def test_get_role_by_user_and_type_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRoleRepository(conn)
        result = repo.get_role_by_user_and_type("user-1", "viewer")
        assert result is None

    # --- create_role ---

    def test_create_role(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRoleRepository(conn)
        result = repo.create_role(self.data)
        assert result == self.data
        conn.commit.assert_called()

    def test_create_role_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = UserRoleRepository(conn)
        result = repo.create_role(self.data)
        assert result == {}

    # --- update_role ---

    def test_update_role(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserRoleRepository(conn)
        result = repo.update_role("user-1", {"role_type": "viewer"})
        assert result == self.data

    def test_update_role_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRoleRepository(conn)
        result = repo.update_role("nonexistent", {"role_type": "viewer"})
        assert result is None

    # --- delete_role ---

    def test_delete_role(self):
        conn = _make_conn()
        repo = UserRoleRepository(conn)
        result = repo.delete_role("user-1")
        assert result is True
        conn.commit.assert_called()

    # --- delete_role_by_type ---

    def test_delete_role_by_type(self):
        conn = _make_conn()
        repo = UserRoleRepository(conn)
        result = repo.delete_role_by_type("user-1", "admin")
        assert result is True
        conn.commit.assert_called()

    # --- get_roles_by_type ---

    def test_get_roles_by_type(self):
        conn = _make_conn(rows_all=[self.data])
        repo = UserRoleRepository(conn)
        result = repo.get_roles_by_type("admin")
        assert result == [self.data]

    def test_get_roles_by_type_empty(self):
        conn = _make_conn(rows_all=[])
        repo = UserRoleRepository(conn)
        result = repo.get_roles_by_type("viewer")
        assert result == []

    # --- get_all_roles ---

    def test_get_all_roles(self):
        conn = _make_conn(rows_all=[self.data])
        repo = UserRoleRepository(conn)
        result = repo.get_all_roles()
        assert result == [self.data]

    def test_get_all_roles_empty(self):
        conn = _make_conn(rows_all=[])
        repo = UserRoleRepository(conn)
        result = repo.get_all_roles()
        assert result == []

    # --- update_instructor_flag ---

    def test_update_instructor_flag_existing(self):
        """既存のレコードがある場合、updateが呼ばれる"""
        # 1回目のexecute (SELECT) → existing row あり
        # 2回目のexecute (UPDATE) → updated row
        existing_row = self.data
        updated_row = {**self.data, "is_instructor": True}

        cursor1 = Mock()
        cursor1.fetchone.return_value = existing_row
        cursor2 = Mock()
        cursor2.fetchone.return_value = updated_row

        conn = Mock()
        conn.execute.side_effect = [cursor1, cursor2]

        repo = UserRoleRepository(conn)
        result = repo.update_instructor_flag("user-1", True)
        assert result == updated_row

    def test_update_instructor_flag_not_found(self):
        """既存レコードが無い場合はinsertされる"""
        inserted_row = {**self.data, "is_instructor": True}

        cursor1 = Mock()
        cursor1.fetchone.return_value = None
        cursor2 = Mock()
        cursor2.fetchone.return_value = inserted_row

        conn = Mock()
        conn.execute.side_effect = [cursor1, cursor2]

        repo = UserRoleRepository(conn)
        result = repo.update_instructor_flag("user-1", True)
        assert result == inserted_row

    # --- get_instructor_flag ---

    def test_get_instructor_flag_true(self):
        conn = _make_conn(rows_one={"is_instructor": True})
        repo = UserRoleRepository(conn)
        result = repo.get_instructor_flag("user-1")
        assert result is True

    def test_get_instructor_flag_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserRoleRepository(conn)
        result = repo.get_instructor_flag("nonexistent")
        assert result is False
