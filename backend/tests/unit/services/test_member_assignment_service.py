"""
MemberAssignmentService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import UUID, uuid4

from app.services.member_assignment_service import MemberAssignmentService
from app.core.exceptions import APIException
from tests.helpers.factories import make_member_assignment, make_part, make_user


class TestMemberAssignmentService:
    """MemberAssignmentService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.mock_part_repo = Mock()
        self.mock_user_repo = Mock()
        self.service = MemberAssignmentService(
            member_assignment_repository=self.mock_repo,
            part_repository=self.mock_part_repo,
            user_repository=self.mock_user_repo,
        )

    # ===== get_all_assignments =====

    def test_get_all_assignments(self):
        """全メンバー所属取得"""
        assignments = [make_member_assignment(), make_member_assignment()]
        self.mock_repo.find_all.return_value = assignments

        result = self.service.get_all_assignments()

        assert result == assignments

    # ===== get_assignment_by_id =====

    def test_get_assignment_by_id_success(self):
        """ID指定でメンバー所属取得 - 正常"""
        assignment_id = uuid4()
        assignment = make_member_assignment(id=str(assignment_id))
        self.mock_repo.find_by_id.return_value = assignment

        result = self.service.get_assignment_by_id(assignment_id)

        assert result == assignment

    def test_get_assignment_by_id_not_found(self):
        """ID指定でメンバー所属取得 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_assignment_by_id(uuid4())

    # ===== get_assignments_by_part =====

    def test_get_assignments_by_part_success(self):
        """パートIDで取得 - 正常"""
        part_id = uuid4()
        self.mock_part_repo.find_by_id.return_value = make_part(id=str(part_id))
        assignments = [make_member_assignment(part_id=str(part_id))]
        self.mock_repo.find_by_part_id.return_value = assignments

        result = self.service.get_assignments_by_part(part_id)

        assert result == assignments

    def test_get_assignments_by_part_not_found(self):
        """パートIDで取得 - パートが存在しない"""
        self.mock_part_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_assignments_by_part(uuid4())

    # ===== get_assignments_by_user =====

    def test_get_assignments_by_user_success(self):
        """ユーザーIDで取得 - 正常"""
        user_id = str(uuid4())
        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        assignments = [make_member_assignment(user_id=user_id)]
        self.mock_repo.find_by_user_id.return_value = assignments

        result = self.service.get_assignments_by_user(user_id)

        assert result == assignments

    def test_get_assignments_by_user_not_found(self):
        """ユーザーIDで取得 - ユーザーが存在しない"""
        self.mock_user_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.get_assignments_by_user(str(uuid4()))

    # ===== create_assignment =====

    def test_create_assignment_success(self):
        """メンバー所属作成 - 正常"""
        user_id = str(uuid4())
        part_id = str(uuid4())
        assignment_data = {
            "user_id": user_id,
            "part_id": part_id,
            "category": "utai",
        }
        created = make_member_assignment(**assignment_data)

        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        self.mock_part_repo.find_by_id.return_value = make_part(id=part_id)
        self.mock_repo.find_by_user_and_part.return_value = None
        self.mock_repo.create.return_value = created

        result = self.service.create_assignment(assignment_data)

        assert result == created

    def test_create_assignment_user_not_found(self):
        """メンバー所属作成 - ユーザーが存在しない"""
        assignment_data = {
            "user_id": str(uuid4()),
            "part_id": str(uuid4()),
            "category": "utai",
        }
        self.mock_user_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.create_assignment(assignment_data)

    def test_create_assignment_part_not_found(self):
        """メンバー所属作成 - パートが存在しない"""
        user_id = str(uuid4())
        assignment_data = {
            "user_id": user_id,
            "part_id": str(uuid4()),
            "category": "utai",
        }
        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        self.mock_part_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.create_assignment(assignment_data)

    def test_create_assignment_duplicate(self):
        """メンバー所属作成 - 重複"""
        user_id = str(uuid4())
        part_id = str(uuid4())
        assignment_data = {
            "user_id": user_id,
            "part_id": part_id,
            "category": "utai",
        }

        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        self.mock_part_repo.find_by_id.return_value = make_part(id=part_id)
        self.mock_repo.find_by_user_and_part.return_value = make_member_assignment()

        with pytest.raises(APIException):
            self.service.create_assignment(assignment_data)

    def test_create_assignment_invalid_category(self):
        """メンバー所属作成 - 無効なカテゴリ"""
        user_id = str(uuid4())
        part_id = str(uuid4())
        assignment_data = {
            "user_id": user_id,
            "part_id": part_id,
            "category": "invalid",
        }

        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        self.mock_part_repo.find_by_id.return_value = make_part(id=part_id)
        self.mock_repo.find_by_user_and_part.return_value = None

        with pytest.raises(APIException):
            self.service.create_assignment(assignment_data)

    # ===== update_assignment =====

    def test_update_assignment_success(self):
        """メンバー所属更新 - 正常"""
        assignment_id = uuid4()
        existing = make_member_assignment(id=str(assignment_id))
        update_data = {"category": "mai"}
        updated = make_member_assignment(id=str(assignment_id), category="mai")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.update.return_value = updated

        result = self.service.update_assignment(assignment_id, update_data)

        assert result == updated

    def test_update_assignment_not_found(self):
        """メンバー所属更新 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.update_assignment(uuid4(), {"category": "mai"})

    def test_update_assignment_empty_data(self):
        """メンバー所属更新 - 空データ"""
        assignment_id = uuid4()
        existing = make_member_assignment(id=str(assignment_id))
        self.mock_repo.find_by_id.return_value = existing

        result = self.service.update_assignment(assignment_id, {"category": None})

        assert result == existing
        self.mock_repo.update.assert_not_called()

    def test_update_assignment_invalid_category(self):
        """メンバー所属更新 - 無効なカテゴリ"""
        assignment_id = uuid4()
        existing = make_member_assignment(id=str(assignment_id))
        self.mock_repo.find_by_id.return_value = existing

        with pytest.raises(APIException):
            self.service.update_assignment(assignment_id, {"category": "invalid"})

    # ===== remove_assignment =====

    def test_remove_assignment_success(self):
        """メンバー所属削除 - 正常"""
        assignment_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_member_assignment(
            id=str(assignment_id)
        )
        self.mock_repo.delete.return_value = None

        result = self.service.remove_assignment(assignment_id)

        assert result is True

    def test_remove_assignment_not_found(self):
        """メンバー所属削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.remove_assignment(uuid4())

    # ===== remove_assignment_by_user_and_part =====

    def test_remove_assignment_by_user_and_part_success(self):
        """ユーザーとパートでメンバー所属削除 - 正常"""
        user_id = str(uuid4())
        part_id = uuid4()

        self.mock_user_repo.find_by_id.return_value = make_user(id=user_id)
        self.mock_part_repo.find_by_id.return_value = make_part(id=str(part_id))
        self.mock_repo.find_by_user_and_part.return_value = make_member_assignment()
        self.mock_repo.delete_by_user_and_part.return_value = None

        result = self.service.remove_assignment_by_user_and_part(
            user_id, part_id
        )

        assert result is True

    def test_remove_assignment_by_user_and_part_user_not_found(self):
        """ユーザーとパートで削除 - ユーザーが存在しない"""
        self.mock_user_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.remove_assignment_by_user_and_part(
                str(uuid4()), uuid4()
            )

    # ===== get_assignment_count =====

    def test_get_assignment_count(self):
        """メンバー所属数取得"""
        self.mock_repo.count.return_value = 10

        result = self.service.get_assignment_count()

        assert result == 10

    # ===== bulk_assign_to_part =====

    def test_bulk_assign_to_part_success(self):
        """一括所属 - 正常"""
        part_id = uuid4()
        user_id_1 = str(uuid4())
        user_id_2 = str(uuid4())
        user_assignments = [
            {"user_id": user_id_1, "category": "utai"},
            {"user_id": user_id_2, "category": "mai"},
        ]

        self.mock_part_repo.find_by_id.return_value = make_part(id=str(part_id))
        self.mock_user_repo.find_by_id.return_value = make_user()
        self.mock_part_repo.find_by_id.return_value = make_part(id=str(part_id))
        self.mock_repo.find_by_user_and_part.return_value = None
        self.mock_repo.create.side_effect = [
            make_member_assignment(),
            make_member_assignment(),
        ]

        result = self.service.bulk_assign_to_part(part_id, user_assignments)

        assert len(result) == 2

    def test_bulk_assign_to_part_part_not_found(self):
        """一括所属 - パートが存在しない"""
        self.mock_part_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            self.service.bulk_assign_to_part(uuid4(), [{"user_id": str(uuid4())}])
