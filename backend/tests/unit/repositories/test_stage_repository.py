"""StageRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.stage_repository import StageRepository
from tests.helpers.factories import make_stage


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestStageRepository:
    """StageRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_stage(id="stage-1", name="テスト舞台")

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = StageRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = StageRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = StageRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = StageRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = StageRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = StageRepository(conn)
        result = repo.update(uuid4(), {"name": "更新舞台"})
        assert result == self.data

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = StageRepository(conn)
        result = repo.delete(uuid4())
        assert isinstance(result, bool)

    # --- exists ---

    def test_exists_true(self):
        conn = _make_conn(rows_one={"id": "stage-1"})
        repo = StageRepository(conn)
        result = repo.exists(uuid4())
        assert result is True

    def test_exists_false(self):
        conn = _make_conn(rows_one=None)
        repo = StageRepository(conn)
        result = repo.exists(uuid4())
        assert result is False
