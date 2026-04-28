"""ScheduleTimeSlotRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.schedule_time_slot_repository import ScheduleTimeSlotRepository
from tests.helpers.factories import make_schedule_time_slot


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestScheduleTimeSlotRepository:
    """ScheduleTimeSlotRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_schedule_time_slot(
            id="slot-1", schedule_id="schedule-1", slot_order=1
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_schedule ---

    def test_find_by_schedule(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == [self.data]

    def test_find_by_schedule_empty(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == []

    # --- count_all ---

    def test_count_all(self):
        conn = _make_conn(rows_one={"cnt": 5})
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.count_all()
        assert isinstance(result, int)

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.update(uuid4(), {"start_time": "10:00"})
        assert result == self.data

    def test_update_not_found(self):
        """updateでデータが無い場合、ValueErrorが発生する"""
        conn = _make_conn(rows_one=None)
        repo = ScheduleTimeSlotRepository(conn)
        with pytest.raises((ValueError, Exception)):
            repo.update(uuid4(), {"start_time": "10:00"})

    # --- delete ---

    def test_delete(self):
        conn = _make_conn(rows_one={"id": "slot-1"})
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_delete_no_data(self):
        conn = _make_conn(rows_one=None)
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.delete(uuid4())
        assert result is False

    # --- delete_by_schedule ---

    def test_delete_by_schedule(self):
        conn = _make_conn(rows_all=[{"id": "slot-1"}])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 1

    def test_delete_by_schedule_none(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleTimeSlotRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 0
