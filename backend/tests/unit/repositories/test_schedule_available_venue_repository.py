"""ScheduleAvailableVenueRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.schedule_available_venue_repository import ScheduleAvailableVenueRepository
from tests.helpers.factories import make_schedule_available_venue


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestScheduleAvailableVenueRepository:
    """ScheduleAvailableVenueRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_schedule_available_venue(
            id="sav-1", schedule_id="schedule-1", venue_id="venue-1"
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_schedule ---

    def test_find_by_schedule(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert isinstance(result, list)

    def test_find_by_schedule_empty(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_schedule(uuid4())
        assert result == []

    # --- find_by_venue ---

    def test_find_by_venue(self):
        conn = _make_conn(rows_all=[self.data])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_venue(uuid4())
        assert result == [self.data]

    # --- find_by_schedule_and_venue ---

    def test_find_by_schedule_and_venue(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_schedule_and_venue(uuid4(), uuid4())
        assert result == self.data

    def test_find_by_schedule_and_venue_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.find_by_schedule_and_venue(uuid4(), uuid4())
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.update(uuid4(), {"is_preferred": True})
        assert result == self.data

    # --- delete ---

    def test_delete(self):
        conn = _make_conn(rows_one={"id": "sav-1"})
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_delete_no_data(self):
        conn = _make_conn(rows_one=None)
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.delete(uuid4())
        assert result is False

    # --- delete_by_schedule ---

    def test_delete_by_schedule(self):
        conn = _make_conn(rows_all=[{"id": "sav-1"}])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 1

    def test_delete_by_schedule_none(self):
        conn = _make_conn(rows_all=[])
        repo = ScheduleAvailableVenueRepository(conn)
        result = repo.delete_by_schedule(uuid4())
        assert result == 0
