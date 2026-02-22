"""MaterialsYouTubeリポジトリ群のユニットテスト

MaterialsPlaylistRepository, MaterialsSubPlaylistRepository,
MaterialsVideoRepository, MaterialsFavoriteRepositoryをテストする。
"""

import pytest

from app.repositories.materials_youtube_repository import (
    MaterialsFavoriteRepository,
    MaterialsPlaylistRepository,
    MaterialsSubPlaylistRepository,
    MaterialsVideoRepository,
)
from tests.helpers.factories import (
    make_materials_favorite,
    make_materials_playlist,
    make_materials_sub_playlist,
    make_materials_video,
)
from tests.helpers.supabase_mock import SupabaseMockBuilder


# =====================================================
# MaterialsPlaylistRepository
# =====================================================


class TestMaterialsPlaylistRepository:
    """MaterialsPlaylistRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_playlist(id="pl-1", title="テストプレイリスト")
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = MaterialsPlaylistRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("playlists")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsPlaylistRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("pl-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsPlaylistRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("pl-1", {"title": "更新プレイリスト"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("pl-1")
        assert result is True

    # --- search ---

    @pytest.mark.asyncio
    async def test_search_by_title(self):
        result = await self.repo.search(title="テスト")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_search_by_year(self):
        result = await self.repo.search(year=2024)
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_search_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsPlaylistRepository(self.mock_client)
        result = await self.repo.search(title="存在しない")
        assert result == []


# =====================================================
# MaterialsSubPlaylistRepository
# =====================================================


class TestMaterialsSubPlaylistRepository:
    """MaterialsSubPlaylistRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_sub_playlist(
            id="spl-1", playlist_id="pl-1", title="テストサブプレイリスト"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = MaterialsSubPlaylistRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all("pl-1")
        assert result == [self.data]
        self.mock_client.table.assert_called_with("sub_playlists")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsSubPlaylistRepository(self.mock_client)
        result = await self.repo.find_all("pl-1")
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("pl-1", "spl-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsSubPlaylistRepository(self.mock_client)
        result = await self.repo.find_by_id("pl-1", "nonexistent")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create("pl-1", self.data.copy())
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("pl-1", "spl-1", {"title": "更新サブPL"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("pl-1", "spl-1")
        assert result is True

    # --- search ---

    @pytest.mark.asyncio
    async def test_search(self):
        result = await self.repo.search("pl-1", title="テスト")
        assert result == [self.data]


# =====================================================
# MaterialsVideoRepository
# =====================================================


class TestMaterialsVideoRepository:
    """MaterialsVideoRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_video(
            id="video-1", title="テスト動画"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = MaterialsVideoRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all("spl-1")
        assert result == [self.data]
        self.mock_client.table.assert_called_with("videos")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsVideoRepository(self.mock_client)
        result = await self.repo.find_all("spl-1")
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("spl-1", "video-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsVideoRepository(self.mock_client)
        result = await self.repo.find_by_id("spl-1", "nonexistent")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create("spl-1", self.data.copy())
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("spl-1", "video-1", {"title": "更新動画"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("spl-1", "video-1")
        assert result is True

    # --- search ---

    @pytest.mark.asyncio
    async def test_search(self):
        result = await self.repo.search("spl-1", title="テスト")
        assert result == [self.data]


# =====================================================
# MaterialsFavoriteRepository
# =====================================================


class TestMaterialsFavoriteRepository:
    """MaterialsFavoriteRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_favorite(
            id="fav-1", user_id="user-1", video_id="video-1"
        )
        self.mock_client = SupabaseMockBuilder().with_response(data=[self.data]).build()
        self.repo = MaterialsFavoriteRepository(self.mock_client)

    # --- find_all ---

    @pytest.mark.asyncio
    async def test_find_all(self):
        result = await self.repo.find_all()
        assert result == [self.data]
        self.mock_client.table.assert_called_with("favorites")

    @pytest.mark.asyncio
    async def test_find_all_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsFavoriteRepository(self.mock_client)
        result = await self.repo.find_all()
        assert result == []

    # --- find_by_id ---

    @pytest.mark.asyncio
    async def test_find_by_id(self):
        result = await self.repo.find_by_id("fav-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsFavoriteRepository(self.mock_client)
        result = await self.repo.find_by_id("nonexistent")
        assert result is None

    # --- create ---

    @pytest.mark.asyncio
    async def test_create(self):
        result = await self.repo.create(self.data)
        assert result == self.data

    # --- update ---

    @pytest.mark.asyncio
    async def test_update(self):
        result = await self.repo.update("fav-1", {"video_id": "video-2"})
        assert result == self.data

    # --- delete ---

    @pytest.mark.asyncio
    async def test_delete(self):
        result = await self.repo.delete("fav-1")
        assert result is True

    # --- find_by_user_id ---

    @pytest.mark.asyncio
    async def test_find_by_user_id(self):
        result = await self.repo.find_by_user_id("user-1")
        assert result == [self.data]

    @pytest.mark.asyncio
    async def test_find_by_user_id_empty(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsFavoriteRepository(self.mock_client)
        result = await self.repo.find_by_user_id("user-1")
        assert result == []

    # --- find_by_user_id_and_video_id ---

    @pytest.mark.asyncio
    async def test_find_by_user_id_and_video_id(self):
        result = await self.repo.find_by_user_id_and_video_id("user-1", "video-1")
        assert result == self.data

    @pytest.mark.asyncio
    async def test_find_by_user_id_and_video_id_not_found(self):
        self.mock_client = SupabaseMockBuilder().with_response(data=[]).build()
        self.repo = MaterialsFavoriteRepository(self.mock_client)
        result = await self.repo.find_by_user_id_and_video_id("user-1", "video-1")
        assert result is None

    # --- delete_by_user_id_and_video_id ---

    @pytest.mark.asyncio
    async def test_delete_by_user_id_and_video_id(self):
        result = await self.repo.delete_by_user_id_and_video_id("user-1", "video-1")
        assert result is True
