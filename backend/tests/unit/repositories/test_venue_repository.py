"""VenueRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.venue_repository import VenueRepository
from tests.helpers.factories import make_venue


def _make_conn(rows_one=None, rows_all=None):
    """psycopg2 connection mock を作成する。"""
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestVenueRepository:
    """VenueRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_venue(id="venue-1", name="テスト会場")

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = VenueRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = VenueRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = VenueRepository(conn)
        result = repo.find_by_id("venue-1")
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = VenueRepository(conn)
        result = repo.find_by_id("nonexistent")
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = VenueRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called_once()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = VenueRepository(conn)
        result = repo.update("venue-1", {"name": "更新会場"})
        assert result == self.data

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = VenueRepository(conn)
        result = repo.delete("venue-1")
        assert result is True
        conn.commit.assert_called_once()
