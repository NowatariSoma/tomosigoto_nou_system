"""ContactRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.contact_repository import ContactRepository
from tests.helpers.factories import make_contact


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestContactRepository:
    """ContactRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_contact(id="contact-1", user_id="user-1")

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ContactRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_with_user_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ContactRepository(conn)
        result = repo.find_all(user_id="user-1")
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = ContactRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = ContactRepository(conn)
        result = repo.find_by_id("contact-1")
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = ContactRepository(conn)
        result = repo.find_by_id("nonexistent")
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = ContactRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called_once()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = ContactRepository(conn)
        result = repo.update("contact-1", {"status": "resolved"})
        assert result == self.data

    def test_update_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = ContactRepository(conn)
        result = repo.update("nonexistent", {"status": "resolved"})
        assert result is None

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = ContactRepository(conn)
        result = repo.delete("contact-1")
        assert result is True
        conn.commit.assert_called_once()
