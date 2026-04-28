"""AttendanceRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock, call
from uuid import uuid4

from app.repositories.attendance_repository import AttendanceRepository
from tests.helpers.factories import make_attendance


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestAttendanceRepository:
    """AttendanceRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_attendance(
            id="att-1",
            practice_schedule_id="schedule-1",
            user_id="user-1",
            status="present",
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AttendanceRepository(conn)
        result = repo.find_all()
        assert isinstance(result, list)

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AttendanceRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = AttendanceRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is not None

    def test_find_by_id_not_found(self):
        from fastapi import HTTPException
        conn = _make_conn(rows_one=None)
        repo = AttendanceRepository(conn)
        with pytest.raises((HTTPException, Exception)):
            repo.find_by_id(uuid4())

    # --- find_by_practice_schedule ---

    def test_find_by_practice_schedule(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AttendanceRepository(conn)
        result = repo.find_by_practice_schedule(uuid4())
        assert isinstance(result, list)

    def test_find_by_practice_schedule_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AttendanceRepository(conn)
        result = repo.find_by_practice_schedule(uuid4())
        assert result == []

    # --- find_by_user ---

    def test_find_by_user(self):
        conn = _make_conn(rows_all=[self.data])
        repo = AttendanceRepository(conn)
        result = repo.find_by_user(uuid4())
        assert isinstance(result, list)

    def test_find_by_user_empty(self):
        conn = _make_conn(rows_all=[])
        repo = AttendanceRepository(conn)
        result = repo.find_by_user(uuid4())
        assert result == []

    # --- find_by_practice_and_user ---

    def test_find_by_practice_and_user(self):
        conn = _make_conn(rows_one=self.data)
        repo = AttendanceRepository(conn)
        result = repo.find_by_practice_and_user(uuid4(), uuid4())
        assert result is not None

    def test_find_by_practice_and_user_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = AttendanceRepository(conn)
        result = repo.find_by_practice_and_user(uuid4(), uuid4())
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = AttendanceRepository(conn)
        result = repo.create(self.data)
        assert result is not None
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = AttendanceRepository(conn)
        result = repo.update(uuid4(), {"status": "absent"})
        assert result is not None

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = AttendanceRepository(conn)
        result = repo.delete(uuid4())
        assert result is True
