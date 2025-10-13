"""
出席登録エンドポイントのユニットテスト
TDDに従って、期待される入出力を定義するテスト
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app


class TestAttendanceEndpoints:
    """出席登録エンドポイントのテスト"""

    @pytest.fixture
    def client(self):
        """テストクライアント"""
        return TestClient(app)

    @pytest.fixture
    def admin_token(self):
        """管理者トークン"""
        return "Bearer admin.jwt.token"

    @pytest.fixture
    def general_token(self):
        """一般ユーザートークン"""
        return "Bearer general.jwt.token"

    @pytest.fixture
    def valid_attendance_data(self):
        """有効な出席データ"""
        return {
            "practice_schedule_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": "550e8400-e29b-41d4-a716-446655440001",
            "status": "present",
            "notes": "テスト出席"
        }

    @pytest.fixture
    def mock_admin_user(self):
        """管理者ユーザー"""
        return {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "email": "admin@example.com"
        }

    @pytest.fixture
    def mock_general_user(self):
        """一般ユーザー"""
        return {
            "id": "550e8400-e29b-41d4-a716-446655440011",
            "email": "general@example.com"
        }

    @pytest.fixture
    def mock_admin_role(self):
        """管理者ロール"""
        return {
            "id": "role-123",
            "user_id": "admin-123",
            "role_type": "admin",
            "is_visible_to_general": True
        }

    @pytest.fixture
    def mock_general_role(self):
        """一般ユーザーロール"""
        return {
            "id": "role-456",
            "user_id": "general-123",
            "role_type": "general",
            "is_visible_to_general": True
        }

    def test_create_attendance_with_admin_success(
        self, client, admin_token, valid_attendance_data, mock_admin_user, mock_admin_role
    ):
        """
        管理者は出席記録を作成できる

        期待される動作:
        1. 管理者権限を持つユーザーで出席記録作成
        2. 201 Createdが返される
        3. 作成された出席記録が返される
        """
        with patch('app.api.deps.UserService') as MockUserService, \
             patch('app.api.deps.UserRoleRepository') as MockUserRoleRepository, \
             patch('app.services.attendance_service.AttendanceService.create_attendance') as mock_create:

            mock_user_service = MockUserService.return_value
            mock_user_service.verify_jwt_token = AsyncMock(return_value=mock_admin_user)

            mock_role_repo = MockUserRoleRepository.return_value
            mock_role_repo.get_role_by_user_id = AsyncMock(return_value=mock_admin_role)

            mock_create.return_value = {
                "id": "550e8400-e29b-41d4-a716-446655440002",
                **valid_attendance_data,
                "created_by": mock_admin_user["id"],
                "updated_by": mock_admin_user["id"]
            }

            response = client.post(
                "/api/v1/attendance/",
                json=valid_attendance_data,
                headers={"Authorization": admin_token}
            )

            assert response.status_code == 200
            response_data = response.json()
            assert response_data["id"] == "550e8400-e29b-41d4-a716-446655440002"
            assert response_data["status"] == "present"

    def test_create_attendance_with_general_user_fails(
        self, client, general_token, valid_attendance_data, mock_general_user, mock_general_role
    ):
        """
        一般ユーザーは出席記録を作成できない

        期待される動作:
        1. 一般ユーザー権限で出席記録作成を試みる
        2. 403 Forbiddenが返される
        """
        with patch('app.services.user_service.UserService.verify_jwt_token') as mock_verify, \
             patch('app.repositories.user_role_repository.UserRoleRepository.get_role_by_user_id') as mock_get_role:

            mock_verify.return_value = mock_general_user
            mock_get_role.return_value = mock_general_role

            response = client.post(
                "/api/v1/attendance/",
                json=valid_attendance_data,
                headers={"Authorization": general_token}
            )

            assert response.status_code == 403
            error_data = response.json()
            assert "detail" in error_data
            assert "管理者権限" in error_data["detail"] or "permission" in error_data["detail"].lower()

    def test_update_attendance_with_admin_success(
        self, client, admin_token, mock_admin_user, mock_admin_role
    ):
        """
        管理者は出席記録を更新できる

        期待される動作:
        1. 管理者権限を持つユーザーで出席記録更新
        2. 200 OKが返される
        3. 更新された出席記録が返される
        """
        attendance_id = "550e8400-e29b-41d4-a716-446655440003"
        update_data = {"status": "absent", "notes": "欠席に変更"}

        with patch('app.api.deps.UserService') as MockUserService, \
             patch('app.api.deps.UserRoleRepository') as MockUserRoleRepository, \
             patch('app.services.attendance_service.AttendanceService.update_attendance') as mock_update:

            mock_user_service = MockUserService.return_value
            mock_user_service.verify_jwt_token = AsyncMock(return_value=mock_admin_user)

            mock_role_repo = MockUserRoleRepository.return_value
            mock_role_repo.get_role_by_user_id = AsyncMock(return_value=mock_admin_role)

            mock_update.return_value = {
                "id": attendance_id,
                "practice_schedule_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                **update_data,
                "updated_by": mock_admin_user["id"]
            }

            response = client.put(
                f"/api/v1/attendance/{attendance_id}",
                json=update_data,
                headers={"Authorization": admin_token}
            )

            assert response.status_code == 200
            response_data = response.json()
            assert response_data["status"] == "absent"

    def test_update_attendance_with_general_user_fails(
        self, client, general_token, mock_general_user, mock_general_role
    ):
        """
        一般ユーザーは出席記録を更新できない

        期待される動作:
        1. 一般ユーザー権限で出席記録更新を試みる
        2. 403 Forbiddenが返される
        """
        attendance_id = "550e8400-e29b-41d4-a716-446655440003"
        update_data = {"status": "absent"}

        with patch('app.services.user_service.UserService.verify_jwt_token') as mock_verify, \
             patch('app.repositories.user_role_repository.UserRoleRepository.get_role_by_user_id') as mock_get_role:

            mock_verify.return_value = mock_general_user
            mock_get_role.return_value = mock_general_role

            response = client.put(
                f"/api/v1/attendance/{attendance_id}",
                json=update_data,
                headers={"Authorization": general_token}
            )

            assert response.status_code == 403

    def test_delete_attendance_with_admin_success(
        self, client, admin_token, mock_admin_user, mock_admin_role
    ):
        """
        管理者は出席記録を削除できる

        期待される動作:
        1. 管理者権限を持つユーザーで出席記録削除
        2. 200 OKが返される
        """
        attendance_id = "550e8400-e29b-41d4-a716-446655440003"

        with patch('app.api.deps.UserService') as MockUserService, \
             patch('app.api.deps.UserRoleRepository') as MockUserRoleRepository, \
             patch('app.services.attendance_service.AttendanceService.remove_attendance') as mock_delete:

            mock_user_service = MockUserService.return_value
            mock_user_service.verify_jwt_token = AsyncMock(return_value=mock_admin_user)

            mock_role_repo = MockUserRoleRepository.return_value
            mock_role_repo.get_role_by_user_id = AsyncMock(return_value=mock_admin_role)

            mock_delete.return_value = True

            response = client.delete(
                f"/api/v1/attendance/{attendance_id}",
                headers={"Authorization": admin_token}
            )

            assert response.status_code == 200

    def test_delete_attendance_with_general_user_fails(
        self, client, general_token, mock_general_user, mock_general_role
    ):
        """
        一般ユーザーは出席記録を削除できない

        期待される動作:
        1. 一般ユーザー権限で出席記録削除を試みる
        2. 403 Forbiddenが返される
        """
        attendance_id = "550e8400-e29b-41d4-a716-446655440003"

        with patch('app.services.user_service.UserService.verify_jwt_token') as mock_verify, \
             patch('app.repositories.user_role_repository.UserRoleRepository.get_role_by_user_id') as mock_get_role:

            mock_verify.return_value = mock_general_user
            mock_get_role.return_value = mock_general_role

            response = client.delete(
                f"/api/v1/attendance/{attendance_id}",
                headers={"Authorization": general_token}
            )

            assert response.status_code == 403

    def test_bulk_update_with_admin_success(
        self, client, admin_token, mock_admin_user, mock_admin_role
    ):
        """
        管理者は出席記録を一括更新できる

        期待される動作:
        1. 管理者権限を持つユーザーで一括更新
        2. 200 OKが返される
        """
        practice_schedule_id = "550e8400-e29b-41d4-a716-446655440007"
        bulk_data = [
            {"practice_schedule_id": practice_schedule_id, "user_id": "550e8400-e29b-41d4-a716-446655440008", "status": "present"},
            {"practice_schedule_id": practice_schedule_id, "user_id": "550e8400-e29b-41d4-a716-446655440009", "status": "absent"}
        ]

        with patch('app.api.deps.UserService') as MockUserService, \
             patch('app.api.deps.UserRoleRepository') as MockUserRoleRepository, \
             patch('app.services.attendance_service.AttendanceService.bulk_update_attendances') as mock_bulk:

            mock_user_service = MockUserService.return_value
            mock_user_service.verify_jwt_token = AsyncMock(return_value=mock_admin_user)

            mock_role_repo = MockUserRoleRepository.return_value
            mock_role_repo.get_role_by_user_id = AsyncMock(return_value=mock_admin_role)

            mock_bulk.return_value = [{"id": "550e8400-e29b-41d4-a716-446655440005", **bulk_data[0]}, {"id": "550e8400-e29b-41d4-a716-446655440006", **bulk_data[1]}]

            response = client.post(
                f"/api/v1/attendance/bulk/{practice_schedule_id}",
                json=bulk_data,
                headers={"Authorization": admin_token}
            )

            assert response.status_code == 200

    def test_bulk_update_with_general_user_fails(
        self, client, general_token, mock_general_user, mock_general_role
    ):
        """
        一般ユーザーは出席記録を一括更新できない

        期待される動作:
        1. 一般ユーザー権限で一括更新を試みる
        2. 403 Forbiddenが返される
        """
        practice_schedule_id = "550e8400-e29b-41d4-a716-446655440007"
        bulk_data = [{"user_id": "user-1", "status": "present"}]

        with patch('app.services.user_service.UserService.verify_jwt_token') as mock_verify, \
             patch('app.repositories.user_role_repository.UserRoleRepository.get_role_by_user_id') as mock_get_role:

            mock_verify.return_value = mock_general_user
            mock_get_role.return_value = mock_general_role

            response = client.post(
                f"/api/v1/attendance/bulk/{practice_schedule_id}",
                json=bulk_data,
                headers={"Authorization": general_token}
            )

            assert response.status_code == 403

    def test_upsert_with_admin_success(
        self, client, admin_token, valid_attendance_data, mock_admin_user, mock_admin_role
    ):
        """
        管理者は出席記録をupsertできる

        期待される動作:
        1. 管理者権限を持つユーザーでupsert
        2. 200 OKが返される
        """
        with patch('app.api.deps.UserService') as MockUserService, \
             patch('app.api.deps.UserRoleRepository') as MockUserRoleRepository, \
             patch('app.services.attendance_service.AttendanceService.upsert_attendance') as mock_upsert:

            mock_user_service = MockUserService.return_value
            mock_user_service.verify_jwt_token = AsyncMock(return_value=mock_admin_user)

            mock_role_repo = MockUserRoleRepository.return_value
            mock_role_repo.get_role_by_user_id = AsyncMock(return_value=mock_admin_role)

            mock_upsert.return_value = {
                "id": "550e8400-e29b-41d4-a716-446655440004",
                **valid_attendance_data
            }

            response = client.post(
                "/api/v1/attendance/upsert",
                json=valid_attendance_data,
                headers={"Authorization": admin_token}
            )

            assert response.status_code == 200

    def test_upsert_with_general_user_fails(
        self, client, general_token, valid_attendance_data, mock_general_user, mock_general_role
    ):
        """
        一般ユーザーは出席記録をupsertできない

        期待される動作:
        1. 一般ユーザー権限でupsertを試みる
        2. 403 Forbiddenが返される
        """
        with patch('app.services.user_service.UserService.verify_jwt_token') as mock_verify, \
             patch('app.repositories.user_role_repository.UserRoleRepository.get_role_by_user_id') as mock_get_role:

            mock_verify.return_value = mock_general_user
            mock_get_role.return_value = mock_general_role

            response = client.post(
                "/api/v1/attendance/upsert",
                json=valid_attendance_data,
                headers={"Authorization": general_token}
            )

            assert response.status_code == 403