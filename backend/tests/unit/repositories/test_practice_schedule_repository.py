"""PracticeScheduleRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from tests.helpers.factories import make_practice_schedule


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestPracticeScheduleRepository:
    """PracticeScheduleRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_practice_schedule(
            id="schedule-1", schedule_date="2024-02-15"
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = PracticeScheduleRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = PracticeScheduleRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_date ---

    def test_find_by_date(self):
        conn = _make_conn(rows_one=self.data)
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_date("2024-02-15")
        assert result == self.data

    def test_find_by_date_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_date("2024-12-31")
        assert result is None

    # --- find_by_date_range ---

    def test_find_by_date_range(self):
        conn = _make_conn(rows_all=[self.data])
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_date_range("2024-02-01", "2024-03-01")
        assert result == [self.data]

    def test_find_by_date_range_empty(self):
        conn = _make_conn(rows_all=[])
        repo = PracticeScheduleRepository(conn)
        result = repo.find_by_date_range("2025-01-01", "2025-02-01")
        assert result == []

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = PracticeScheduleRepository(conn)
        result = repo.create(self.data.copy())
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = PracticeScheduleRepository(conn)
        result = repo.update(uuid4(), {"title": "更新練習"})
        assert result == self.data

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = PracticeScheduleRepository(conn)
        result = repo.delete(uuid4())
        assert result is True
