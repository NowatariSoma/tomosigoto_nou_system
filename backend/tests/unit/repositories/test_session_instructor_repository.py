"""SessionInstructorRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.session_instructor_repository import SessionInstructorRepository
from tests.helpers.factories import make_session_instructor


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestSessionInstructorRepository:
    """SessionInstructorRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_session_instructor(
            id="si-1",
            attendance_id="att-1",
            schedule_id="schedule-1",
            slot_order=1,
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = SessionInstructorRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = SessionInstructorRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionInstructorRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = SessionInstructorRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_schedule ---

    def test_find_by_schedule(self):
        conn = _make_conn(rows_all=[self.data])
        repo = SessionInstructorRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == [self.data]

    def test_find_by_schedule_empty(self):
        conn = _make_conn(rows_all=[])
        repo = SessionInstructorRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == []

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionInstructorRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = SessionInstructorRepository(conn)
        result = repo.update(uuid4(), {"slot_order": 2})
        assert result == self.data

    # --- delete ---

    def test_delete(self):
        conn = _make_conn(rows_one={"id": "si-1"})
        repo = SessionInstructorRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_delete_no_data(self):
        conn = _make_conn(rows_one=None)
        repo = SessionInstructorRepository(conn)
        result = repo.delete(uuid4())
        assert result is False
