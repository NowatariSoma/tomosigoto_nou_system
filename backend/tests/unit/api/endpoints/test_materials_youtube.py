"""
YouTube教材エンドポイントのユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.deps import (
    get_materials_playlist_service,
    get_materials_sub_playlist_service,
    get_materials_video_service,
    get_materials_favorite_service,
)
from app.main import app
from tests.helpers.auth_helpers import (
    clear_auth_overrides,
    override_auth_as_admin,
)
from tests.helpers.factories import (
    make_materials_playlist,
    make_materials_sub_playlist,
    make_materials_video,
    make_materials_favorite,
)


class TestGetMaterialsPlaylists:
    """GET /api/v1/materials-youtube/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_playlist_service] = lambda: self.mock_service
        # materials_youtube endpoints do not require auth for GET playlists
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_playlist_service, None)

    def test_get_playlists_returns_200(self):
        data = [make_materials_playlist()]
        self.mock_service.get_all_materials_playlists.return_value = data
        response = self.client.get("/api/v1/materials-youtube/")
        assert response.status_code == 200

    def test_get_playlists_with_search_params(self):
        data = [make_materials_playlist()]
        self.mock_service.search_materials_playlists.return_value = data
        response = self.client.get("/api/v1/materials-youtube/?title=テスト")
        assert response.status_code == 200
        self.mock_service.search_materials_playlists.assert_called_once()

    def test_get_playlists_empty(self):
        self.mock_service.get_all_materials_playlists.return_value = []
        response = self.client.get("/api/v1/materials-youtube/")
        assert response.status_code == 200
        assert response.json() == []


class TestGetMaterialsPlaylistById:
    """GET /api/v1/materials-youtube/{playlist_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_playlist_service, None)

    def test_get_by_id_returns_200(self):
        playlist_id = str(uuid4())
        data = make_materials_playlist(id=playlist_id)
        self.mock_service.get_materials_playlist_by_id.return_value = data
        response = self.client.get(f"/api/v1/materials-youtube/{playlist_id}")
        assert response.status_code == 200

    def test_get_by_id_not_found(self):
        playlist_id = str(uuid4())
        self.mock_service.get_materials_playlist_by_id.return_value = None
        response = self.client.get(f"/api/v1/materials-youtube/{playlist_id}")
        assert response.status_code == 404


class TestCreateMaterialsPlaylist:
    """POST /api/v1/materials-youtube/ のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_playlist_service, None)

    def test_create_returns_200(self):
        data = make_materials_playlist()
        self.mock_service.create_materials_playlist.return_value = data
        payload = {
            "title": "テストプレイリスト",
            "name": "テスト舞台名",
            "year": 2024,
        }
        response = self.client.post("/api/v1/materials-youtube/", json=payload)
        assert response.status_code == 200


class TestUpdateMaterialsPlaylist:
    """PUT /api/v1/materials-youtube/{playlist_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_playlist_service, None)

    def test_update_returns_200(self):
        playlist_id = str(uuid4())
        updated_data = make_materials_playlist(id=playlist_id, title="更新プレイリスト")
        self.mock_service.update_materials_playlist.return_value = updated_data
        payload = {"title": "更新プレイリスト"}
        response = self.client.put(f"/api/v1/materials-youtube/{playlist_id}", json=payload)
        assert response.status_code == 200


class TestDeleteMaterialsPlaylist:
    """DELETE /api/v1/materials-youtube/{playlist_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_playlist_service, None)

    def test_delete_returns_200(self):
        playlist_id = str(uuid4())
        self.mock_service.delete_materials_playlist.return_value = True
        response = self.client.delete(f"/api/v1/materials-youtube/{playlist_id}")
        assert response.status_code == 200

    def test_delete_failure_returns_500(self):
        playlist_id = str(uuid4())
        self.mock_service.delete_materials_playlist.return_value = False
        response = self.client.delete(f"/api/v1/materials-youtube/{playlist_id}")
        assert response.status_code == 500


class TestGetMaterialsSubPlaylists:
    """GET /api/v1/materials-youtube/{playlist_id}/sub-playlists のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_sub_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_sub_playlist_service, None)

    def test_get_sub_playlists_returns_200(self):
        playlist_id = str(uuid4())
        data = [make_materials_sub_playlist(playlist_id=playlist_id)]
        self.mock_service.get_all_materials_sub_playlists.return_value = data
        response = self.client.get(f"/api/v1/materials-youtube/{playlist_id}/sub-playlists")
        assert response.status_code == 200

    def test_get_sub_playlists_with_search(self):
        playlist_id = str(uuid4())
        data = [make_materials_sub_playlist()]
        self.mock_service.search_materials_sub_playlists.return_value = data
        response = self.client.get(f"/api/v1/materials-youtube/{playlist_id}/sub-playlists?title=テスト")
        assert response.status_code == 200


class TestCreateMaterialsSubPlaylist:
    """POST /api/v1/materials-youtube/{playlist_id}/sub-playlists のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_sub_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_sub_playlist_service, None)

    def test_create_sub_playlist_returns_200(self):
        playlist_id = str(uuid4())
        data = make_materials_sub_playlist(playlist_id=playlist_id)
        self.mock_service.create_materials_sub_playlist.return_value = data
        payload = {
            "title": "テストサブプレイリスト",
            "recorded_date": "2024-03-01",
            "phase": "稽古",
            "playlist_url": "https://www.youtube.com/playlist?list=TEST",
        }
        response = self.client.post(f"/api/v1/materials-youtube/{playlist_id}/sub-playlists", json=payload)
        assert response.status_code == 200


class TestDeleteMaterialsSubPlaylist:
    """DELETE /api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_sub_playlist_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_sub_playlist_service, None)

    def test_delete_sub_playlist_returns_200(self):
        playlist_id = str(uuid4())
        sub_playlist_id = str(uuid4())
        self.mock_service.delete_materials_sub_playlist.return_value = True
        response = self.client.delete(f"/api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}")
        assert response.status_code == 200


class TestGetMaterialsVideos:
    """GET /api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_video_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_video_service, None)

    def test_get_videos_returns_200(self):
        playlist_id = str(uuid4())
        sub_playlist_id = str(uuid4())
        data = [make_materials_video()]
        self.mock_service.get_all_materials_videos.return_value = data
        response = self.client.get(
            f"/api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos"
        )
        assert response.status_code == 200


class TestCreateMaterialsVideo:
    """POST /api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_video_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_video_service, None)

    def test_create_video_returns_200(self):
        playlist_id = str(uuid4())
        sub_playlist_id = str(uuid4())
        data = make_materials_video()
        self.mock_service.create_materials_video.return_value = data
        payload = {
            "title": "テスト動画",
            "video_url": "https://www.youtube.com/watch?v=TEST",
            "recorded_date": "2024-03-01",
        }
        response = self.client.post(
            f"/api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos",
            json=payload,
        )
        assert response.status_code == 200


class TestDeleteMaterialsVideo:
    """DELETE /api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos/{video_id} のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_video_service] = lambda: self.mock_service
        self.client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.pop(get_materials_video_service, None)

    def test_delete_video_returns_200(self):
        playlist_id = str(uuid4())
        sub_playlist_id = str(uuid4())
        video_id = str(uuid4())
        self.mock_service.delete_materials_video.return_value = True
        response = self.client.delete(
            f"/api/v1/materials-youtube/{playlist_id}/sub-playlists/{sub_playlist_id}/videos/{video_id}"
        )
        assert response.status_code == 200


class TestGetUserFavorites:
    """GET /api/v1/materials-youtube/favorites のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_favorite_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)

    def test_get_favorites_returns_200(self):
        self.mock_service.get_favorites_by_user_id.return_value = []
        response = self.client.get("/api/v1/materials-youtube/favorites")
        assert response.status_code == 200

    def test_get_favorites_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)
        client = TestClient(app)
        response = client.get("/api/v1/materials-youtube/favorites")
        assert response.status_code in [401, 403]


class TestToggleFavorite:
    """POST /api/v1/materials-youtube/videos/{video_id}/favorites/toggle のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_favorite_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)

    def test_toggle_favorite_returns_200(self):
        video_id = str(uuid4())
        self.mock_service.toggle_favorite.return_value = {"action": "added", "video_id": video_id}
        response = self.client.post(f"/api/v1/materials-youtube/videos/{video_id}/favorites/toggle")
        assert response.status_code == 200

    def test_toggle_favorite_unauthenticated(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)
        client = TestClient(app)
        video_id = str(uuid4())
        response = client.post(f"/api/v1/materials-youtube/videos/{video_id}/favorites/toggle")
        assert response.status_code in [401, 403]


class TestGetFavoriteStatus:
    """GET /api/v1/materials-youtube/videos/{video_id}/favorites/status のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_favorite_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)

    def test_get_status_returns_200(self):
        video_id = str(uuid4())
        self.mock_service.is_favorited.return_value = True
        response = self.client.get(f"/api/v1/materials-youtube/videos/{video_id}/favorites/status")
        assert response.status_code == 200
        assert response.json()["is_favorited"] is True


class TestDeleteFavorite:
    """DELETE /api/v1/materials-youtube/videos/{video_id}/favorites のテスト"""

    def setup_method(self):
        self.mock_service = AsyncMock()
        app.dependency_overrides[get_materials_favorite_service] = lambda: self.mock_service
        override_auth_as_admin()
        self.client = TestClient(app)

    def teardown_method(self):
        clear_auth_overrides()
        app.dependency_overrides.pop(get_materials_favorite_service, None)

    def test_delete_favorite_returns_200(self):
        video_id = str(uuid4())
        self.mock_service.delete_materials_favorite.return_value = True
        response = self.client.delete(f"/api/v1/materials-youtube/videos/{video_id}/favorites")
        assert response.status_code == 200

    def test_delete_favorite_not_found(self):
        video_id = str(uuid4())
        self.mock_service.delete_materials_favorite.return_value = False
        response = self.client.delete(f"/api/v1/materials-youtube/videos/{video_id}/favorites")
        assert response.status_code == 404
