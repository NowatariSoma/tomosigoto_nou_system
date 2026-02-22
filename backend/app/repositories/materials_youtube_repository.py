from typing import Any
from uuid import UUID
from datetime import date, datetime

from app.core.exceptions import handle_supabase_errors
from supabase import Client


def _serialize_date_fields(data: dict[str, Any]) -> dict[str, Any]:
    """辞書内のdate/datetimeオブジェクトを文字列に変換"""
    serialized = {}
    for key, value in data.items():
        if isinstance(value, date):
            serialized[key] = value.isoformat()
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized

class MaterialsPlaylistRepository:
    """プレイリストの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "playlists"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """すべてのプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, playlist_id: UUID) -> dict[str, Any]:
        """指定したIDのプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(playlist_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, playlist_data: dict[str, Any]) -> dict[str, Any]:
        """プレイリストを作成"""
        response = self.client.table(self.table_name).insert(playlist_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, playlist_id: UUID, playlist_data: dict[str, Any]) -> dict[str, Any]:
        """プレイリストを更新"""
        response = self.client.table(self.table_name).update(playlist_data).eq("id", str(playlist_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, playlist_id: UUID) -> bool:
        """プレイリストを削除"""
        self.client.table(self.table_name).delete().eq("id", str(playlist_id)).execute()
        return True

    @handle_supabase_errors("search")
    async def search(
        self,
        title: str | None = None,
        name: str | None = None,
        year: int | None = None
    ) -> list[dict[str, Any]]:
        """プレイリストを検索"""
        query = self.client.table(self.table_name).select("*")
        
        if title:
            query = query.ilike("title", f"%{title}%")
        if name:
            query = query.ilike("name", f"%{name}%")
        if year is not None:
            query = query.eq("year", year)
        
        response = query.execute()
        return response.data


class MaterialsSubPlaylistRepository:
    """サブプレイリストの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "sub_playlists"

    @handle_supabase_errors("find_all")
    async def find_all(self, playlist_id: UUID) -> list[dict[str, Any]]:
        """指定されたプレイリストのサブプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").eq("playlist_id", str(playlist_id)).execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, playlist_id: UUID, sub_playlist_id: UUID) -> dict[str, Any]:
        """指定したIDのサブプレイリストを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("playlist_id", str(playlist_id))
            .eq("id", str(sub_playlist_id))
            .execute()
        )
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("create")
    async def create(self, playlist_id: UUID, sub_playlist_data: dict[str, Any]) -> dict[str, Any]:
        """サブプレイリストを作成"""
        sub_playlist_data["playlist_id"] = str(playlist_id)
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(sub_playlist_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, playlist_id: UUID, sub_playlist_id: UUID, sub_playlist_data: dict[str, Any]) -> dict[str, Any]:
        """サブプレイリストを更新"""
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(sub_playlist_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("playlist_id", str(playlist_id))
            .eq("id", str(sub_playlist_id))
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, playlist_id: UUID, sub_playlist_id: UUID) -> bool:
        """サブプレイリストを削除"""
        self.client.table(self.table_name).delete().eq("playlist_id", str(playlist_id)).eq("id", str(sub_playlist_id)).execute()
        return True

    @handle_supabase_errors("search")
    async def search(
        self,
        playlist_id: UUID,
        title: str | None = None,
        phase: str | None = None,
        recorded_date_from: date | None = None,
        recorded_date_to: date | None = None
    ) -> list[dict[str, Any]]:
        """サブプレイリストを検索"""
        query = self.client.table(self.table_name).select("*").eq("playlist_id", str(playlist_id))
        
        if title:
            query = query.ilike("title", f"%{title}%")
        if phase:
            query = query.eq("phase", phase)
        if recorded_date_from:
            query = query.gte("recorded_date", recorded_date_from.isoformat())
        if recorded_date_to:
            query = query.lte("recorded_date", recorded_date_to.isoformat())
        
        response = query.execute()
        return response.data


class MaterialsVideoRepository:
    """ビデオの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "videos"

    @handle_supabase_errors("find_all")
    async def find_all(self, sub_playlist_id: UUID) -> list[dict[str, Any]]:
        """指定されたサブプレイリストのビデオを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("sub_playlist_id", str(sub_playlist_id))
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, sub_playlist_id: UUID, video_id: UUID) -> dict[str, Any]:
        """指定したIDのビデオを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("sub_playlist_id", str(sub_playlist_id))
            .eq("id", str(video_id))
            .execute()
        )
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("create")
    async def create(self, sub_playlist_id: UUID, video_data: dict[str, Any]) -> dict[str, Any]:
        """ビデオを作成"""
        video_data["sub_playlist_id"] = str(sub_playlist_id)
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(video_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, sub_playlist_id: UUID, video_id: UUID, video_data: dict[str, Any]) -> dict[str, Any]:
        """ビデオを更新"""
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(video_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("sub_playlist_id", str(sub_playlist_id))
            .eq("id", str(video_id))
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, sub_playlist_id: UUID, video_id: UUID) -> bool:
        """ビデオを削除"""
        self.client.table(self.table_name).delete().eq("sub_playlist_id", str(sub_playlist_id)).eq("id", str(video_id)).execute()
        return True

    @handle_supabase_errors("search")
    async def search(
        self,
        sub_playlist_id: UUID,
        title: str | None = None,
        recorded_date_from: date | None = None,
        recorded_date_to: date | None = None
    ) -> list[dict[str, Any]]:
        """ビデオを検索"""
        query = self.client.table(self.table_name).select("*").eq("sub_playlist_id", str(sub_playlist_id))
        
        if title:
            query = query.ilike("title", f"%{title}%")
        if recorded_date_from:
            query = query.gte("recorded_date", recorded_date_from.isoformat())
        if recorded_date_to:
            query = query.lte("recorded_date", recorded_date_to.isoformat())
        
        response = query.execute()
        return response.data


class MaterialsFavoriteRepository:
    """お気に入りの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "favorites"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """すべてのお気に入りを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, favorite_id: UUID) -> dict[str, Any]:
        """指定したIDのお気に入りを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(favorite_id)).execute()
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("create")
    async def create(self, favorite_data: dict[str, Any]) -> dict[str, Any]:
        """お気に入りを作成"""
        response = self.client.table(self.table_name).insert(favorite_data).execute()
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("update")
    async def update(self, favorite_id: UUID, favorite_data: dict[str, Any]) -> dict[str, Any]:
        """お気に入りを更新"""
        response = self.client.table(self.table_name).update(favorite_data).eq("id", str(favorite_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, favorite_id: UUID) -> bool:
        """お気に入りを削除"""
        self.client.table(self.table_name).delete().eq("id", str(favorite_id)).execute()
        return True

    @handle_supabase_errors("find_by_user_id")
    async def find_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        """指定したユーザーIDのお気に入り一覧を取得"""
        response = self.client.table(self.table_name).select("*").eq("user_id", str(user_id)).execute()
        return response.data

    @handle_supabase_errors("find_by_user_id_and_video_id")
    async def find_by_user_id_and_video_id(self, user_id: UUID, video_id: UUID) -> dict[str, Any]:
        """指定したユーザーIDとビデオIDのお気に入りを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", str(user_id))
            .eq("video_id", str(video_id))
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete_by_user_id_and_video_id")
    async def delete_by_user_id_and_video_id(self, user_id: UUID, video_id: UUID) -> bool:
        """指定したユーザーIDとビデオIDのお気に入りを削除"""
        self.client.table(self.table_name).delete().eq("user_id", str(user_id)).eq("video_id", str(video_id)).execute()
        return True

    @handle_supabase_errors("find_favorite_videos_with_details")
    async def find_favorite_videos_with_details(self, user_id: UUID) -> list[dict[str, Any]]:
        """指定したユーザーIDのお気に入り動画とその関連情報（プレイリスト、サブプレイリスト）を取得"""
        # SupabaseのPostgRESTでネストされたリレーションを取得
        # favorites -> videos -> sub_playlists -> playlists の順にJOIN
        response = (
            self.client.table(self.table_name)
            .select(
                "*,videos(*,sub_playlists(*,playlists(*)))"
            )
            .eq("user_id", str(user_id))
            .execute()
        )
        return response.data