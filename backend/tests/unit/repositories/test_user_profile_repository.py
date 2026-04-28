"""UserProfileRepositoryのユニットテスト（psycopg2ベース）"""

import pytest
from unittest.mock import Mock

from app.repositories.user_profile_repository import UserProfileRepository
from tests.helpers.factories import make_user_profile


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


class TestUserProfileRepository:
    """UserProfileRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_user_profile(
            id="profile-1",
            user_id="user-1",
            student_id="S12345678",
            first_name_kanji="太郎",
            last_name_kanji="テスト",
        )
        # get_profile_by_user_id はJOINでdepartment_code/department_nameを付加する
        self.data_with_dept = {
            **self.data,
            "department_code": "LIT",
            "department_name": "文学部",
        }

    # --- get_profile_by_user_id ---

    def test_get_profile_by_user_id(self):
        conn = _make_conn(rows_one=self.data_with_dept)
        repo = UserProfileRepository(conn)
        result = repo.get_profile_by_user_id("user-1")
        assert result is not None
        assert result["user_id"] == "user-1"
        assert result["department_code"] == "LIT"

    def test_get_profile_by_user_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.get_profile_by_user_id("nonexistent")
        assert result is None

    # --- get_profiles_by_user_ids ---

    def test_get_profiles_by_user_ids(self):
        conn = _make_conn(rows_all=[self.data])
        repo = UserProfileRepository(conn)
        result = repo.get_profiles_by_user_ids(["user-1"])
        assert len(result) == 1

    def test_get_profiles_by_user_ids_empty_input(self):
        conn = _make_conn()
        repo = UserProfileRepository(conn)
        result = repo.get_profiles_by_user_ids([])
        assert result == []

    # --- get_profile_by_student_id ---

    def test_get_profile_by_student_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = UserProfileRepository(conn)
        result = repo.get_profile_by_student_id("S12345678")
        assert result is not None

    def test_get_profile_by_student_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.get_profile_by_student_id("NOTEXIST")
        assert result is None

    # --- create_profile ---

    def test_create_profile(self):
        conn = _make_conn(rows_one=self.data_with_dept)
        repo = UserProfileRepository(conn)
        result = repo.create_profile({"user_id": "user-1", "student_id": "S12345678"})
        assert result is not None

    def test_create_profile_empty_response(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.create_profile({"user_id": "user-1"})
        assert result == {}

    # --- update_profile ---

    def test_update_profile(self):
        conn = _make_conn(rows_one=self.data_with_dept)
        repo = UserProfileRepository(conn)
        result = repo.update_profile("user-1", {"first_name_kanji": "次郎"})
        assert result is not None

    def test_update_profile_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.update_profile("nonexistent", {"first_name_kanji": "次郎"})
        assert result is None

    # --- delete_profile ---

    def test_delete_profile(self):
        conn = _make_conn()
        repo = UserProfileRepository(conn)
        result = repo.delete_profile("user-1")
        assert result is True

    # --- check_student_id_exists ---

    def test_check_student_id_exists_true(self):
        conn = _make_conn(rows_one={"id": "profile-1"})
        repo = UserProfileRepository(conn)
        result = repo.check_student_id_exists("S12345678")
        assert result is True

    def test_check_student_id_exists_false(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.check_student_id_exists("NOTEXIST")
        assert result is False

    # --- get_profile_count ---

    def test_get_profile_count(self):
        conn = _make_conn(rows_one={"cnt": 15})
        repo = UserProfileRepository(conn)
        result = repo.get_profile_count()
        assert result == 15

    # --- check_email_exists ---

    def test_check_email_exists_true(self):
        conn = _make_conn(rows_one={"id": "profile-1"})
        repo = UserProfileRepository(conn)
        result = repo.check_email_exists("test@example.com")
        assert result is True

    def test_check_email_exists_false(self):
        conn = _make_conn(rows_one=None)
        repo = UserProfileRepository(conn)
        result = repo.check_email_exists("notfound@example.com")
        assert result is False
