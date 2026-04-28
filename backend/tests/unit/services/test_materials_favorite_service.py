"""
MaterialsFavoriteService のユニットテスト
"""
import pytest
from unittest.mock import Mock
from uuid import uuid4

from app.services.materials_youtube_service import MaterialsFavoriteService
from app.core.exceptions import APIException
from tests.helpers.factories import make_materials_favorite


class TestMaterialsFavoriteService:
    """MaterialsFavoriteService のテスト"""

    def setup_method(self):
        self.mock_repo = Mock()
        self.service = MaterialsFavoriteService(
            materials_favorite_repository=self.mock_repo,
        )

    # ===== get_all_materials_favorites =====

    def test_get_all_favorites(self):
        """全お気に入り取得"""
        favorites = [make_materials_favorite(), make_materials_favorite()]
        self.mock_repo.find_all.return_value = favorites

        result = self.service.get_all_materials_favorites()

        assert result == favorites

    # ===== get_materials_favorite_by_id =====

    def test_get_favorite_by_id(self):
        """ID指定でお気に入り取得"""
        favorite_id = uuid4()
        favorite = make_materials_favorite(id=str(favorite_id))
        self.mock_repo.find_by_id.return_value = favorite

        result = self.service.get_materials_favorite_by_id(favorite_id)

        assert result == favorite

    # ===== get_favorites_by_user_id =====

    def test_get_favorites_by_user_id(self):
        """ユーザーID指定でお気に入り取得"""
        user_id = uuid4()
        favorites = [make_materials_favorite(user_id=str(user_id))]
        self.mock_repo.find_by_user_id.return_value = favorites

        result = self.service.get_favorites_by_user_id(user_id)

        assert result == favorites

    # ===== is_favorited =====

    def test_is_favorited_true(self):
        """お気に入りチェック - 登録済み"""
        user_id = uuid4()
        video_id = uuid4()
        self.mock_repo.find_by_user_id_and_video_id.return_value = make_materials_favorite()

        result = self.service.is_favorited(user_id, video_id)

        assert result is True

    def test_is_favorited_false(self):
        """お気に入りチェック - 未登録"""
        self.mock_repo.find_by_user_id_and_video_id.return_value = None

        result = self.service.is_favorited(uuid4(), uuid4())

        assert result is False

    # ===== create_materials_favorite =====

    def test_create_favorite_success(self):
        """お気に入り作成 - 正常"""
        user_id = str(uuid4())
        video_id = str(uuid4())
        data = {"user_id": user_id, "video_id": video_id}
        created = make_materials_favorite(**data)

        self.mock_repo.find_by_user_id_and_video_id.return_value = None
        self.mock_repo.create.return_value = created

        result = self.service.create_materials_favorite(data)

        assert result == created

    def test_create_favorite_already_exists(self):
        """お気に入り作成 - 既に存在"""
        user_id = str(uuid4())
        video_id = str(uuid4())
        data = {"user_id": user_id, "video_id": video_id}

        self.mock_repo.find_by_user_id_and_video_id.return_value = make_materials_favorite()

        with pytest.raises(APIException):
            self.service.create_materials_favorite(data)

    # ===== toggle_favorite =====

    def test_toggle_favorite_add(self):
        """お気に入り切り替え - 追加"""
        user_id = uuid4()
        video_id = uuid4()

        self.mock_repo.find_by_user_id_and_video_id.return_value = None
        self.mock_repo.create.return_value = make_materials_favorite()

        result = self.service.toggle_favorite(user_id, video_id)

        assert result["is_favorited"] is True

    def test_toggle_favorite_remove(self):
        """お気に入り切り替え - 削除"""
        user_id = uuid4()
        video_id = uuid4()

        self.mock_repo.find_by_user_id_and_video_id.return_value = make_materials_favorite()
        self.mock_repo.delete_by_user_id_and_video_id.return_value = True

        result = self.service.toggle_favorite(user_id, video_id)

        assert result["is_favorited"] is False

    # ===== delete_materials_favorite =====

    def test_delete_favorite(self):
        """お気に入り削除"""
        user_id = uuid4()
        video_id = uuid4()
        self.mock_repo.delete_by_user_id_and_video_id.return_value = True

        result = self.service.delete_materials_favorite(user_id, video_id)

        assert result is True

    # ===== get_favorite_videos_with_details =====

    def test_get_favorite_videos_with_details(self):
        """お気に入り動画詳細取得"""
        user_id = uuid4()
        details = [{"id": str(uuid4()), "title": "お気に入り動画"}]
        self.mock_repo.find_favorite_videos_with_details.return_value = details

        result = self.service.get_favorite_videos_with_details(user_id)

        assert result == details
