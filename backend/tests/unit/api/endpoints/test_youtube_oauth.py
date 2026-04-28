"""
YouTube OAuth認証エンドポイントのユニットテスト

OAuthフローは複雑なため、基本的なルーティングと
パラメータバリデーションのテストに留める。
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import get_youtube_oauth_token_repository
from app.main import app


class TestAuthorizeYouTube:
    """GET /api/v1/youtube/oauth/authorize のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        app.dependency_overrides[get_youtube_oauth_token_repository] = lambda: self.mock_repo
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_youtube_oauth_token_repository, None)

    @patch("app.api.endpoints.youtube_oauth.settings")
    @patch("app.api.endpoints.youtube_oauth._save_oauth_state")
    @patch("app.api.endpoints.youtube_oauth._create_oauth_flow")
    def test_authorize_returns_200(self, mock_flow_factory, mock_save_state, mock_settings):
        mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
        mock_settings.GOOGLE_CLIENT_SECRET = "test-secret"
        mock_settings.YOUTUBE_OAUTH_REDIRECT_URI = "http://localhost/callback"

        mock_flow = MagicMock()
        mock_flow.authorization_url.return_value = ("https://accounts.google.com/auth", "test-state")
        mock_flow_factory.return_value = mock_flow

        mock_save_state.return_value = None

        response = self.client.get("/api/v1/youtube/oauth/authorize")
        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data

    @patch("app.api.endpoints.youtube_oauth.settings")
    def test_authorize_missing_config_returns_500(self, mock_settings):
        mock_settings.GOOGLE_CLIENT_ID = ""
        mock_settings.GOOGLE_CLIENT_SECRET = ""
        response = self.client.get("/api/v1/youtube/oauth/authorize")
        assert response.status_code == 500


class TestYouTubeOAuthCallback:
    """GET /api/v1/youtube/oauth/callback のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        app.dependency_overrides[get_youtube_oauth_token_repository] = lambda: self.mock_repo
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_youtube_oauth_token_repository, None)

    def test_callback_no_params_returns_400(self):
        """パラメータなしでアクセスした場合は400"""
        response = self.client.get("/api/v1/youtube/oauth/callback")
        assert response.status_code == 400

    def test_callback_with_error_returns_400(self):
        """OAuthエラーがある場合は400"""
        response = self.client.get("/api/v1/youtube/oauth/callback?error=access_denied")
        assert response.status_code == 400

    def test_callback_missing_code_returns_400(self):
        """codeがない場合は400"""
        response = self.client.get("/api/v1/youtube/oauth/callback?state=test-state")
        assert response.status_code == 400

    def test_callback_missing_state_returns_400(self):
        """stateがない場合は400"""
        response = self.client.get("/api/v1/youtube/oauth/callback?code=test-code")
        assert response.status_code == 400


class TestYouTubeOAuthStatus:
    """GET /api/v1/youtube/oauth/status のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        app.dependency_overrides[get_youtube_oauth_token_repository] = lambda: self.mock_repo
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_youtube_oauth_token_repository, None)

    @patch("app.api.endpoints.youtube_oauth.settings")
    def test_status_not_authenticated(self, mock_settings):
        mock_settings.GOOGLE_CLIENT_ID = "test-id"
        mock_settings.GOOGLE_CLIENT_SECRET = "test-secret"
        mock_settings.YOUTUBE_OAUTH_REDIRECT_URI = "http://localhost/callback"
        mock_settings.API_V1_STR = "/api/v1"

        # リポジトリがトークンを返さない場合
        self.mock_repo.find_system_token.return_value = None

        response = self.client.get("/api/v1/youtube/oauth/status")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is False
