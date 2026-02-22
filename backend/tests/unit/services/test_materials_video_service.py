"""
MaterialsVideoService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from app.services.materials_youtube_service import MaterialsVideoService
from app.core.exceptions import APIException
from tests.helpers.factories import make_materials_video, make_materials_sub_playlist


class TestMaterialsVideoService:
    """MaterialsVideoService のテスト"""

    def setup_method(self):
        self.mock_video_repo = AsyncMock()
        self.mock_sub_playlist_repo = AsyncMock()
        self.service = MaterialsVideoService(
            materials_video_repository=self.mock_video_repo,
            materials_sub_playlist_repository=self.mock_sub_playlist_repo,
        )

    # ===== _validate_sub_playlist_belongs_to_playlist =====

    @pytest.mark.asyncio
    async def test_validate_sub_playlist_success(self):
        """サブプレイリスト所属検証 - 正常"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()

        # 例外が発生しなければ成功
        await self.service._validate_sub_playlist_belongs_to_playlist(
            playlist_id, sub_playlist_id
        )

    @pytest.mark.asyncio
    async def test_validate_sub_playlist_not_found(self):
        """サブプレイリスト所属検証 - 存在しない"""
        self.mock_sub_playlist_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service._validate_sub_playlist_belongs_to_playlist(
                uuid4(), uuid4()
            )

    # ===== get_all_materials_videos =====

    @pytest.mark.asyncio
    async def test_get_all_videos(self):
        """ビデオ一覧取得"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        videos = [make_materials_video(), make_materials_video(title="動画2")]

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.find_all.return_value = videos

        result = await self.service.get_all_materials_videos(
            playlist_id, sub_playlist_id
        )

        assert result == videos

    # ===== get_materials_video_by_id =====

    @pytest.mark.asyncio
    async def test_get_video_by_id(self):
        """ID指定でビデオ取得"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        video_id = uuid4()
        video = make_materials_video(id=str(video_id))

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.find_by_id.return_value = video

        result = await self.service.get_materials_video_by_id(
            playlist_id, sub_playlist_id, video_id
        )

        assert result == video

    # ===== create_materials_video =====

    @pytest.mark.asyncio
    async def test_create_video(self):
        """ビデオ作成"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        data = {"title": "新動画", "video_url": "https://youtube.com/watch?v=xxx"}
        created = make_materials_video(**data)

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.create.return_value = created

        result = await self.service.create_materials_video(
            playlist_id, sub_playlist_id, data
        )

        assert result == created

    # ===== update_materials_video =====

    @pytest.mark.asyncio
    async def test_update_video(self):
        """ビデオ更新"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        video_id = uuid4()
        data = {"title": "更新動画"}
        updated = make_materials_video(title="更新動画")

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.update.return_value = updated

        result = await self.service.update_materials_video(
            playlist_id, sub_playlist_id, video_id, data
        )

        assert result == updated

    # ===== delete_materials_video =====

    @pytest.mark.asyncio
    async def test_delete_video(self):
        """ビデオ削除"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        video_id = uuid4()

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.delete.return_value = True

        result = await self.service.delete_materials_video(
            playlist_id, sub_playlist_id, video_id
        )

        assert result is True

    # ===== search_materials_videos =====

    @pytest.mark.asyncio
    async def test_search_videos(self):
        """ビデオ検索"""
        playlist_id = uuid4()
        sub_playlist_id = uuid4()
        videos = [make_materials_video(title="検索結果")]

        self.mock_sub_playlist_repo.find_by_id.return_value = make_materials_sub_playlist()
        self.mock_video_repo.search.return_value = videos

        result = await self.service.search_materials_videos(
            playlist_id, sub_playlist_id, title="検索"
        )

        assert result == videos
