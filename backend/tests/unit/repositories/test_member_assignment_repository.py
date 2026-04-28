"""MemberAssignmentRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.repositories.member_assignment_repository import MemberAssignmentRepository
from tests.helpers.factories import make_member_assignment


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestMemberAssignmentRepository:
    """MemberAssignmentRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_member_assignment(
            id="assign-1", user_id="user-1", part_id="part-1"
        )

    # --- find_all ---

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_all()
        assert result == []

    # --- find_by_id ---

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    # --- find_by_part_id ---

    def test_find_by_part_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_part_id(uuid4())
        assert result == [self.data]

    def test_find_by_part_id_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_part_id(uuid4())
        assert result == []

    # --- find_by_user_id ---

    def test_find_by_user_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_user_id(uuid4())
        assert result == [self.data]

    def test_find_by_user_id_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_user_id(uuid4())
        assert result == []

    # --- find_by_user_and_part ---

    def test_find_by_user_and_part(self):
        conn = _make_conn(rows_one=self.data)
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_user_and_part(uuid4(), uuid4())
        assert result == self.data

    def test_find_by_user_and_part_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MemberAssignmentRepository(conn)
        result = repo.find_by_user_and_part(uuid4(), uuid4())
        assert result is None

    # --- create ---

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = MemberAssignmentRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    def test_create_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = MemberAssignmentRepository(conn)
        result = repo.create(self.data)
        assert result == {}

    # --- update ---

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = MemberAssignmentRepository(conn)
        result = repo.update(uuid4(), {"display_order": 5})
        assert result == self.data

    def test_update_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MemberAssignmentRepository(conn)
        result = repo.update(uuid4(), {"display_order": 5})
        assert result is None

    # --- delete ---

    def test_delete(self):
        conn = _make_conn()
        repo = MemberAssignmentRepository(conn)
        result = repo.delete(uuid4())
        assert result is True
        conn.commit.assert_called()

    # --- count ---

    def test_count(self):
        conn = _make_conn(rows_one={"cnt": 7})
        repo = MemberAssignmentRepository(conn)
        result = repo.count()
        assert result == 7

    def test_count_zero(self):
        conn = _make_conn(rows_one={"cnt": 0})
        repo = MemberAssignmentRepository(conn)
        result = repo.count()
        assert result == 0
