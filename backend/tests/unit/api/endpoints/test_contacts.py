"""
お問い合わせエンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_contact_service
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
    override_auth_as_member,
)
from tests.helpers.factories import make_contact


class TestCreateContact:
    """POST /api/v1/contacts/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_contact_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_contact_service, None)

    def test_create_contact_returns_200(self):
        contact_data = make_contact()
        self.mock_service.create_contact.return_value = contact_data
        payload = {
            "category": "question",
            "content": "テスト用お問い合わせ内容です。",
        }
        response = self.client.post("/api/v1/contacts/", json=payload)
        assert response.status_code == 200

    def test_create_contact_sets_user_id_from_auth(self):
        """user_idは認証ユーザーから自動設定される"""
        contact_data = make_contact()
        self.mock_service.create_contact.return_value = contact_data
        payload = {
            "category": "bug",
            "content": "バグ報告テスト",
        }
        response = self.client.post("/api/v1/contacts/", json=payload)
        assert response.status_code == 200
        # サービスが呼ばれた際のデータにuser_idが含まれていることを確認
        call_args = self.mock_service.create_contact.call_args[0][0]
        assert "user_id" in call_args

    def test_create_contact_as_member(self):
        """メンバーでもお問い合わせを作成できる"""
        clear_auth_overrides()
        override_auth_as_member()
        contact_data = make_contact()
        self.mock_service.create_contact.return_value = contact_data
        payload = {
            "category": "feature",
            "content": "機能要望テスト",
        }
        response = self.client.post("/api/v1/contacts/", json=payload)
        assert response.status_code == 200

    def test_create_contact_invalid_category(self):
        """無効なカテゴリの場合はバリデーションエラー"""
        payload = {
            "category": "invalid_category",
            "content": "テスト",
        }
        response = self.client.post("/api/v1/contacts/", json=payload)
        assert response.status_code == 422

    def test_create_contact_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_contact_service, None)
        client = TestClient(app)
        payload = {
            "category": "question",
            "content": "テスト",
        }
        response = client.post("/api/v1/contacts/", json=payload)
        assert response.status_code in [401, 403]
