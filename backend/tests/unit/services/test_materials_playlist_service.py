"""
MaterialsPlaylistService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.materials_youtube_service import MaterialsPlaylistService
from tests.helpers.factories import make_materials_playlist


class TestMaterialsPlaylistService:
    """MaterialsPlaylistService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.service = MaterialsPlaylistService(
            materials_playlist_repository=self.mock_repo,
        )

    # ===== get_all_materials_playlists =====

    def test_get_all_playlists(self):
        """全プレイリスト取得"""
        playlists = [make_materials_playlist(), make_materials_playlist(title="別のPL")]
        self.mock_repo.find_all.return_value = playlists

        result = self.service.get_all_materials_playlists()

        assert result == playlists
        self.mock_repo.find_all.assert_called_once()

    # ===== get_materials_playlist_by_id =====

    def test_get_playlist_by_id(self):
        """ID指定でプレイリスト取得"""
        playlist_id = uuid4()
        playlist = make_materials_playlist(id=str(playlist_id))
        self.mock_repo.find_by_id.return_value = playlist

        result = self.service.get_materials_playlist_by_id(playlist_id)

        assert result == playlist

    # ===== create_materials_playlist =====

    def test_create_playlist(self):
        """プレイリスト作成"""
        data = {"title": "新プレイリスト", "year": 2024}
        created = make_materials_playlist(**data)
        self.mock_repo.create.return_value = created

        result = self.service.create_materials_playlist(data)

        assert result == created
        self.mock_repo.create.assert_called_once_with(data)

    # ===== update_materials_playlist =====

    def test_update_playlist(self):
        """プレイリスト更新"""
        playlist_id = uuid4()
        data = {"title": "更新PL"}
        updated = make_materials_playlist(title="更新PL")
        self.mock_repo.update.return_value = updated

        result = self.service.update_materials_playlist(playlist_id, data)

        assert result == updated

    # ===== delete_materials_playlist =====

    def test_delete_playlist(self):
        """プレイリスト削除"""
        playlist_id = uuid4()
        self.mock_repo.delete.return_value = True

        result = self.service.delete_materials_playlist(playlist_id)

        assert result is True

    # ===== search_materials_playlists =====

    def test_search_playlists(self):
        """プレイリスト検索"""
        playlists = [make_materials_playlist(title="検索結果")]
        self.mock_repo.search.return_value = playlists

        result = self.service.search_materials_playlists(title="検索")

        assert result == playlists
        self.mock_repo.search.assert_called_once_with(title="検索", name=None, year=None)
