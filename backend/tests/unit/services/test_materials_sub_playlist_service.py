"""
MaterialsSubPlaylistService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from app.services.materials_youtube_service import MaterialsSubPlaylistService
from app.core.exceptions import APIException
from tests.helpers.factories import make_materials_sub_playlist


class TestMaterialsSubPlaylistService:
    """MaterialsSubPlaylistService のテスト"""

    def setup_method(self):
        self.mock_sub_playlist_repo = AsyncMock()
        self.mock_video_repo = AsyncMock()
        self.mock_playlist_repo = AsyncMock()
        self.mock_supabase_client = Mock()
        self.service = MaterialsSubPlaylistService(
            materials_sub_playlist_repository=self.mock_sub_playlist_repo,
            materials_video_repository=self.mock_video_repo,
            materials_playlist_repository=self.mock_playlist_repo,
            supabase_client=self.mock_supabase_client,
        )

    # ===== get_all_materials_sub_playlists =====

    @pytest.mark.asyncio
    async def test_get_all_sub_playlists(self):
        """サブプレイリスト一覧取得"""
        playlist_id = uuid4()
        sub_playlists = [make_materials_sub_playlist(playlist_id=str(playlist_id))]
        self.mock_sub_playlist_repo.find_all.return_value = sub_playlists

        result = await self.service.get_all_materials_sub_playlists(playlist_id)

        assert result == sub_playlists

    # ===== get_materials_sub_playlist_by_id =====

    @pytest.mark.asyncio
    async def test_get_sub_playlist_by_id(self):
        """ID指定でサブプレイリスト取得"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        sub_playlist = make_materials_sub_playlist(id=str(sub_playlist_id))
        self.mock_sub_playlist_repo.find_by_id.return_value = sub_playlist

        result = await self.service.get_materials_sub_playlist_by_id(
            playlist_id, sub_playlist_id
        )

        assert result == sub_playlist

    # ===== create_materials_sub_playlist =====

    @pytest.mark.asyncio
    async def test_create_sub_playlist_without_url(self):
        """サブプレイリスト作成 - URL なし（動画インポートしない）"""
        playlist_id = uuid4()
        data = {"title": "テストサブPL", "phase": "稽古"}
        created = make_materials_sub_playlist(title="テストサブPL")
        self.mock_sub_playlist_repo.create.return_value = created

        result = await self.service.create_materials_sub_playlist(
            playlist_id, data, auto_import_videos=True
        )

        assert result == created
        self.mock_sub_playlist_repo.create.assert_called_once_with(playlist_id, data)

    @pytest.mark.asyncio
    async def test_create_sub_playlist_auto_import_disabled(self):
        """サブプレイリスト作成 - auto_import_videos=False"""
        playlist_id = uuid4()
        data = {
            "title": "テストサブPL",
            "playlist_url": "https://www.youtube.com/playlist?list=PLtest",
        }
        created = make_materials_sub_playlist(title="テストサブPL")
        self.mock_sub_playlist_repo.create.return_value = created

        result = await self.service.create_materials_sub_playlist(
            playlist_id, data, auto_import_videos=False
        )

        assert result == created

    # ===== update_materials_sub_playlist =====

    @pytest.mark.asyncio
    async def test_update_sub_playlist_success(self):
        """サブプレイリスト更新 - 正常（URL変更なし）"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        existing = make_materials_sub_playlist(
            id=str(sub_playlist_id),
            playlist_url="https://www.youtube.com/playlist?list=PLold",
        )
        update_data = {"title": "更新タイトル"}
        updated = make_materials_sub_playlist(title="更新タイトル")

        self.mock_sub_playlist_repo.find_by_id.return_value = existing
        self.mock_sub_playlist_repo.update.return_value = updated
        self.mock_video_repo.find_all.return_value = []
        self.mock_sub_playlist_repo.find_all.return_value = []

        result = await self.service.update_materials_sub_playlist(
            playlist_id, sub_playlist_id, update_data
        )

        assert result["title"] == "更新タイトル"

    @pytest.mark.asyncio
    async def test_update_sub_playlist_not_found(self):
        """サブプレイリスト更新 - 存在しない"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()

        self.mock_sub_playlist_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.update_materials_sub_playlist(
                playlist_id, sub_playlist_id, {"title": "更新"}
            )

    # ===== delete_materials_sub_playlist =====

    @pytest.mark.asyncio
    async def test_delete_sub_playlist(self):
        """サブプレイリスト削除"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        self.mock_sub_playlist_repo.delete.return_value = True

        result = await self.service.delete_materials_sub_playlist(
            playlist_id, sub_playlist_id
        )

        assert result is True

    # ===== _extract_playlist_id =====

    def test_extract_playlist_id_standard_url(self):
        """再生リストID抽出 - 標準URL"""
        url = "https://www.youtube.com/playlist?list=PLtest123"

        result = self.service._extract_playlist_id(url)

        assert result == "PLtest123"

    def test_extract_playlist_id_with_params(self):
        """再生リストID抽出 - 追加パラメータ付きURL"""
        url = "https://www.youtube.com/watch?v=abc&list=PLtest456"

        result = self.service._extract_playlist_id(url)

        assert result == "PLtest456"

    def test_extract_playlist_id_invalid_url(self):
        """再生リストID抽出 - 無効なURL"""
        with pytest.raises(APIException):
            self.service._extract_playlist_id("https://www.example.com/")
