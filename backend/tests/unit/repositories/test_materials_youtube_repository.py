"""MaterialsYouTubeリポジトリ群のユニットテスト（psycopg2ベース）

MaterialsPlaylistRepository, MaterialsSubPlaylistRepository,
MaterialsVideoRepository, MaterialsFavoriteRepositoryをテストする。
"""

import pytest
from unittest.mock import Mock
from uuid import uuid4

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


def _make_conn(rows_one=None, rows_all=None):
    conn = Mock()
    cursor = Mock()
    cursor.fetchone.return_value = rows_one
    cursor.fetchall.return_value = rows_all if rows_all is not None else []
    conn.execute.return_value = cursor
    return conn


# =====================================================
# MaterialsPlaylistRepository
# =====================================================


class TestMaterialsPlaylistRepository:
    """MaterialsPlaylistRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_playlist(id="pl-1", title="テストプレイリスト")

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsPlaylistRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsPlaylistRepository(conn)
        result = repo.find_all()
        assert result == []

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsPlaylistRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MaterialsPlaylistRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsPlaylistRepository(conn)
        result = repo.create(self.data)
        assert result == self.data
        conn.commit.assert_called()

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsPlaylistRepository(conn)
        result = repo.update(uuid4(), {"title": "更新プレイリスト"})
        assert result == self.data

    def test_delete(self):
        conn = _make_conn()
        repo = MaterialsPlaylistRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_search_by_title(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsPlaylistRepository(conn)
        result = repo.search(title="テスト")
        assert result == [self.data]

    def test_search_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsPlaylistRepository(conn)
        result = repo.search(title="存在しない")
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

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.find_all(uuid4())
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.find_all(uuid4())
        assert result == []

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.find_by_id(uuid4(), uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.find_by_id(uuid4(), uuid4())
        assert result is None

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.create(uuid4(), self.data.copy())
        assert result == self.data

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.update(uuid4(), uuid4(), {"title": "更新サブPL"})
        assert result == self.data

    def test_delete(self):
        conn = _make_conn()
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.delete(uuid4(), uuid4())
        assert result is True

    def test_search(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsSubPlaylistRepository(conn)
        result = repo.search(uuid4(), title="テスト")
        assert result == [self.data]


# =====================================================
# MaterialsVideoRepository
# =====================================================


class TestMaterialsVideoRepository:
    """MaterialsVideoRepositoryのユニットテスト"""

    def setup_method(self):
        self.data = make_materials_video(id="video-1", title="テスト動画")

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsVideoRepository(conn)
        result = repo.find_all(uuid4())
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsVideoRepository(conn)
        result = repo.find_all(uuid4())
        assert result == []

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsVideoRepository(conn)
        result = repo.find_by_id(uuid4(), uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MaterialsVideoRepository(conn)
        result = repo.find_by_id(uuid4(), uuid4())
        assert result is None

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsVideoRepository(conn)
        result = repo.create(uuid4(), self.data.copy())
        assert result == self.data

    def test_update(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsVideoRepository(conn)
        result = repo.update(uuid4(), uuid4(), {"title": "更新動画"})
        assert result == self.data

    def test_delete(self):
        conn = _make_conn()
        repo = MaterialsVideoRepository(conn)
        result = repo.delete(uuid4(), uuid4())
        assert result is True

    def test_search(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsVideoRepository(conn)
        result = repo.search(uuid4(), title="テスト")
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

    def test_find_all(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_all()
        assert result == [self.data]

    def test_find_all_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_all()
        assert result == []

    def test_find_by_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result == self.data

    def test_find_by_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_id(uuid4())
        assert result is None

    def test_create(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsFavoriteRepository(conn)
        result = repo.create(self.data)
        assert result == self.data

    def test_delete(self):
        conn = _make_conn()
        repo = MaterialsFavoriteRepository(conn)
        result = repo.delete(uuid4())
        assert result is True

    def test_find_by_user_id(self):
        conn = _make_conn(rows_all=[self.data])
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_user_id(uuid4())
        assert result == [self.data]

    def test_find_by_user_id_empty(self):
        conn = _make_conn(rows_all=[])
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_user_id(uuid4())
        assert result == []

    def test_find_by_user_id_and_video_id(self):
        conn = _make_conn(rows_one=self.data)
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_user_id_and_video_id(uuid4(), uuid4())
        assert result == self.data

    def test_find_by_user_id_and_video_id_not_found(self):
        conn = _make_conn(rows_one=None)
        repo = MaterialsFavoriteRepository(conn)
        result = repo.find_by_user_id_and_video_id(uuid4(), uuid4())
        assert result is None

    def test_delete_by_user_id_and_video_id(self):
        conn = _make_conn()
        repo = MaterialsFavoriteRepository(conn)
        result = repo.delete_by_user_id_and_video_id(uuid4(), uuid4())
        assert result is True
