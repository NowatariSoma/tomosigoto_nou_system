"""PartRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.part_repository import PartRepository
from tests.helpers.factories import make_part


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestPartRepository:
    """PartRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_part(id="part-1", name="テストパート", status="active")

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = PartRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = PartRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = PartRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = PartRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_name ---

    def test_find_by_name(self):
        conn = _make_conn(rows_one=self.data)
        repo = PartRepository(conn)
        result = repo.find_by_name("テストパート")
        assert result == self.data

    def test_find_by_name_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = PartRepository(conn)
        result = repo.find_by_name("存在しない")
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = PartRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    def test_create_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = PartRepository(conn)
        result = repo.create(self.data)
        assert result == {}

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = PartRepository(conn)
        result = repo.update(uuid4(), {"name": "更新パート"})
        assert result == self.data

    def test_update_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = PartRepository(conn)
        result = repo.update(uuid4(), {"name": "更新パート"})
        assert result is None

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = PartRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    # --- count ---

    def test_count(self):
        conn = _make_conn(rows_one={"cnt": 10})
        repo = PartRepository(conn)
        result = repo.count()
        assert result == 10

    def test_count_zero(self):
        conn = _make_conn(rows_one={"cnt": 0})
        repo = PartRepository(conn)
        result = repo.count()
        assert result == 0

    # --- find_active ---

    def test_find_active(self):
        conn = _make_conn(rows_all=[self.data])
        repo = PartRepository(conn)
        result = repo.find_active()
        assert result == [self.data]

    def test_find_active_empty(self):
        conn = _make_conn(rows_all=[])
        repo = PartRepository(conn)
        result = repo.find_active()
        assert result == []

    # --- find_by_stage_id ---

    def test_find_by_stage_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = PartRepository(conn)
        result = repo.find_by_stage_id("stage-1")
        assert result == [self.data]

    def test_find_by_stage_id_empty(self):
        conn = _make_conn(rows_all=[])
        repo = PartRepository(conn)
        result = repo.find_by_stage_id("stage-1")
        assert result == []
