"""
ユーザ作成とトークン取得の統合テスト
TDDに従って、期待される入出力を定義するテスト
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestUserCreationAndToken:
    """ユーザ作成とトークン取得の統合テスト"""

    @pytest.fixture
    def test_user_data(self):
        """テスト用ユーザデータ"""
        import uuid
        return {
            "email": f"newuser-{uuid.uuid4()}@example.com",
            "password": "SecurePassword123!",
            "name": "New Test User"
        }

    @pytest.fixture
    def client(self):
        """テストクライアント"""
        return TestClient(app)

    def test_create_user_and_get_token_flow(self, client, test_user_data):
        """
        ユーザ作成からトークン取得までの一連のフロー
        
        期待される動作:
        1. 新しいユーザを作成
        2. 作成されたユーザでサインイン
        3. JWTトークンを取得
        4. トークンを使ってユーザ情報にアクセス
        """
        # Step 1: ユーザ作成
        # 期待される入力: email, password, name
        # 期待される出力: 201 Created, ユーザ情報（パスワードなし）
        create_response = client.post(
            "/api/users/register",
            json=test_user_data
        )
        
        assert create_response.status_code == 201
        created_user = create_response.json()
        assert created_user["email"] == test_user_data["email"]
        assert created_user["name"] == test_user_data["name"]
        assert "id" in created_user
        assert "password" not in created_user  # パスワードは返されない
        assert "created_at" in created_user
        
        # Step 2: 認証エンドポイントでサインイン
        # 期待される入力: email, password
        # 期待される出力: 200 OK, access_token, user情報
        signin_response = client.post(
            "/api/auth/signin",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        
        assert signin_response.status_code == 200
        signin_data = signin_response.json()
        assert "access_token" in signin_data
        assert "user" in signin_data
        assert signin_data["user"]["email"] == test_user_data["email"]
        
        access_token = signin_data["access_token"]
        
        # Step 3: トークンを使ってユーザ情報にアクセス
        # 期待される入力: Authorization Bearer token
        # 期待される出力: 200 OK, ユーザ情報
        user_info_response = client.get(
            "/api/users/me/",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert user_info_response.status_code == 200
        user_info = user_info_response.json()
        assert user_info["email"] == test_user_data["email"]
        assert user_info["name"] == test_user_data["name"]
        assert user_info["id"] == created_user["id"]

    def test_create_user_with_duplicate_email_fails(self, client, test_user_data):
        """
        重複メールアドレスでのユーザ作成は失敗する
        
        期待される動作:
        1. ユーザを作成
        2. 同じメールアドレスで再度作成を試行
        3. 409 Conflict エラーが返される
        """
        # 最初のユーザ作成
        client.post(
            "/api/users/register",
            json=test_user_data
        )
        
        # 重複メールアドレスでの作成試行
        duplicate_response = client.post(
            "/api/users/register",
            json=test_user_data
        )
        
        assert duplicate_response.status_code == 409
        error_data = duplicate_response.json()
        assert "already exists" in str(error_data["detail"]).lower()

    def test_signin_with_invalid_credentials_fails(self, client):
        """
        不正な認証情報でのサインインは失敗する
        
        期待される動作:
        1. 存在しないユーザでサインイン試行
        2. 401 Unauthorized エラーが返される
        """
        signin_response = client.post(
            "/api/auth/signin",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert signin_response.status_code == 401
        error_data = signin_response.json()
        assert "invalid" in str(error_data["detail"]).lower()

    def test_access_protected_endpoint_without_token_fails(self, client):
        """
        トークンなしでの保護されたエンドポイントアクセスは失敗する
        
        期待される動作:
        1. Authorization ヘッダーなしでユーザ情報取得を試行
        2. 401 Unauthorized エラーが返される
        """
        response = client.get("/api/users/me/")
        
        assert response.status_code == 401
        error_data = response.json()
        assert "authorization" in str(error_data["detail"]).lower()

    def test_access_protected_endpoint_with_invalid_token_fails(self, client):
        """
        不正なトークンでの保護されたエンドポイントアクセスは失敗する
        
        期待される動作:
        1. 不正なトークンでユーザ情報取得を試行
        2. 401 Unauthorized エラーが返される
        """
        response = client.get(
            "/api/users/me/",
            headers={"Authorization": "Bearer invalid.jwt.token"}
        )
        
        assert response.status_code == 401
        error_data = response.json()
        assert "invalid" in str(error_data["detail"]).lower()

    def test_user_creation_requires_valid_email_format(self, client):
        """
        ユーザ作成時は有効なメールアドレス形式が必要
        
        期待される動作:
        1. 不正なメールアドレス形式でユーザ作成を試行
        2. 422 Validation Error が返される
        """
        invalid_email_data = {
            "email": "invalid-email-format-unique",
            "password": "SecurePassword123!",
            "name": "Test User"
        }
        
        response = client.post(
            "/api/users/register",
            json=invalid_email_data
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "email" in str(error_data["detail"]).lower()

    def test_user_creation_requires_strong_password(self, client):
        """
        ユーザ作成時は強力なパスワードが必要
        
        期待される動作:
        1. 弱いパスワードでユーザ作成を試行
        2. 422 Validation Error が返される
        """
        import uuid
        weak_password_data = {
            "email": f"weakpassword-{uuid.uuid4()}@example.com",
            "password": "123",  # 弱いパスワード
            "name": "Test User"
        }
        
        response = client.post(
            "/api/users/register",
            json=weak_password_data
        )
        
        assert response.status_code == 422
        error_data = response.json()
        assert "password" in str(error_data["detail"]).lower()