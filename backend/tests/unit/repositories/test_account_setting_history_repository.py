"""AccountSettingHistoryRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.account_setting_history_repository import AccountSettingHistoryRepository
from tests.helpers.factories import make_account_setting_history


def _make_conn(rows_one=None, rows_all=None, count=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    if count is not None:
        cursor.fetchone.return_value = {"cnt": count}
    conn.execute.return_value = cursor
    return conn


class TestAccountSettingHistoryRepository:
    """AccountSettingHistoryRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_account_setting_history(
            id="history-1",
            user_id="user-1",
            field_name="email",
            old_value="old@example.com",
            new_value="new@example.com",
        )

    # --- create_history_record ---

    def test_create_history_record(self):
        conn = _make_conn(rows_one=self.data)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.create_history_record(self.data)
        assert result == self.data
        conn.commit.assert_called_once()

    def test_create_history_record_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.create_history_record(self.data)
        assert result == {}

    # --- get_history_by_user_id ---

    def test_get_history_by_user_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_user_id("user-1")
        assert result == [self.data]

    def test_get_history_by_user_id_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_user_id("user-1")
        assert result == []

    # --- get_history_by_field ---

    def test_get_history_by_field(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_field("user-1", "email")
        assert result == [self.data]

    def test_get_history_by_field_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_field("user-1", "name")
        assert result == []

    # --- get_history_by_id ---

    def test_get_history_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_id("history-1")
        assert result == self.data

    def test_get_history_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_by_id("nonexistent")
        assert result is None

    # --- update_history_record ---

    def test_update_history_record(self):
        conn = _make_conn(rows_one=self.data)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.update_history_record("history-1", {"new_value": "updated@example.com"})
        assert result == self.data

    def test_update_history_record_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.update_history_record("nonexistent", {"new_value": "updated"})
        assert result is None

    # --- delete_history_record ---

    def test_delete_history_record(self):
        conn = _make_conn()
        repo = AccountSettingHistoryRepository(conn)
        result = repo.delete_history_record("history-1")
        assert result is True
        conn.commit.assert_called()

    # --- delete_history_by_user_id ---

    def test_delete_history_by_user_id(self):
        conn = _make_conn()
        repo = AccountSettingHistoryRepository(conn)
        result = repo.delete_history_by_user_id("user-1")
        assert result is True

    # --- get_history_count ---

    def test_get_history_count(self):
        conn = _make_conn(count=20)
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_history_count()
        assert result == 20

    # --- get_recent_changes ---

    def test_get_recent_changes(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_recent_changes()
        assert result == [self.data]

    def test_get_recent_changes_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AccountSettingHistoryRepository(conn)
        result = repo.get_recent_changes()
        assert result == []
