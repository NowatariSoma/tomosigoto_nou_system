"""SessionRepository（session_repository.py）のユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.session_repository import SessionRepository
from tests.helpers.factories import make_session


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestSessionRepository:
    """SessionRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_session(
            id="session-1", schedule_id="schedule-1", part_id="part-1"
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = SessionRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = SessionRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is not None

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = SessionRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_schedule ---

    def test_find_by_schedule(self):
        conn = _make_conn(rows_all=[self.data])
        repo = SessionRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert isinstance(result, list)

    def test_find_by_schedule_empty(self):
        conn = _make_conn(rows_all=[])
        repo = SessionRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == []

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionRepository(conn)
        result = repo.create(self.data.copy())
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionRepository(conn)
        result = repo.update(uuid4(), {"slot_order": 2})
        assert result is not None

    # --- delete ---

    def test_delete(self):
        conn = _make_conn(rows_one={"id": "session-1"})
        repo = SessionRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_delete_no_data(self):
        conn = _make_conn(rows_one=None)
        repo = SessionRepository(conn)
        result = repo.delete(uuid4())
        assert result is False

    # --- delete_by_schedule ---

    def test_delete_by_schedule(self):
        conn = _make_conn(rows_all=[{"id": "session-1"}])
        repo = SessionRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 1

    def test_delete_by_schedule_none(self):
        conn = _make_conn(rows_all=[])
        repo = SessionRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 0
