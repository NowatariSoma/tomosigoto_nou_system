"""DepartmentRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.department_repository import DepartmentRepository
from tests.helpers.factories import make_department


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestDepartmentRepository:
    """DepartmentRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_department(
            id="dept-1", department_code="LIT", department_name="文学部"
        )

    # --- get_all_departments ---

    def test_get_all_departments(self):
        conn = _make_conn(rows_all=[self.data])
        repo = DepartmentRepository(conn)
        result = repo.get_all_departments()
        assert result == [self.data]

    def test_get_all_departments_empty(self):
        conn = _make_conn(rows_all=[])
        repo = DepartmentRepository(conn)
        result = repo.get_all_departments()
        assert result == []

    # --- get_department_by_code ---

    def test_get_department_by_code(self):
        conn = _make_conn(rows_one=self.data)
        repo = DepartmentRepository(conn)
        result = repo.get_department_by_code("LIT")
        assert result == self.data

    def test_get_department_by_code_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = DepartmentRepository(conn)
        result = repo.get_department_by_code("NOTEXIST")
        assert result is None

    # --- get_department_by_id ---

    def test_get_department_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = DepartmentRepository(conn)
        result = repo.get_department_by_id("dept-1")
        assert result == self.data

    def test_get_department_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = DepartmentRepository(conn)
        result = repo.get_department_by_id("nonexistent")
        assert result is None

    # --- create_department ---

    def test_create_department(self):
        conn = _make_conn(rows_one=self.data)
        repo = DepartmentRepository(conn)
        result = repo.create_department(self.data)
        assert result == self.data
        conn.commit.assert_called_once()

    def test_create_department_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = DepartmentRepository(conn)
        result = repo.create_department(self.data)
        assert result == {}

    # --- update_department ---

    def test_update_department(self):
        conn = _make_conn(rows_one=self.data)
        repo = DepartmentRepository(conn)
        result = repo.update_department("dept-1", {"department_name": "理学部"})
        assert result == self.data

    def test_update_department_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = DepartmentRepository(conn)
        result = repo.update_department("nonexistent", {"department_name": "理学部"})
        assert result is None

    # --- delete_department（論理削除） ---

    def test_delete_department(self):
        conn = _make_conn(rows_one={"id": "dept-1"})
        repo = DepartmentRepository(conn)
        result = repo.delete_department("dept-1")
        assert result is True

    def test_delete_department_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = DepartmentRepository(conn)
        result = repo.delete_department("nonexistent")
        assert result is False

    # --- get_departments_by_campus ---

    def test_get_departments_by_campus(self):
        conn = _make_conn(rows_all=[self.data])
        repo = DepartmentRepository(conn)
        result = repo.get_departments_by_campus("メインキャンパス")
        assert result == [self.data]

    def test_get_departments_by_campus_empty(self):
        conn = _make_conn(rows_all=[])
        repo = DepartmentRepository(conn)
        result = repo.get_departments_by_campus("存在しない")
        assert result == []

    # --- get_department_count ---

    def test_get_department_count(self):
        conn = _make_conn(rows_one={"cnt": 8})
        repo = DepartmentRepository(conn)
        result = repo.get_department_count()
        assert result == 8

    def test_get_department_count_zero(self):
        conn = _make_conn(rows_one={"cnt": 0})
        repo = DepartmentRepository(conn)
        result = repo.get_department_count()
        assert result == 0
