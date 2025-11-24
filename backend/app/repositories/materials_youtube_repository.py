from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import date, datetime

from app.core.exceptions import handle_supabase_errors
from supabase import Client


def _serialize_date_fields(data: Dict[str, Any]) -> Dict[str, Any]:
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
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, playlist_id: UUID) -> Dict[str, Any]:
        """指定したIDのプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(playlist_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, playlist_data: Dict[str, Any]) -> Dict[str, Any]:
        """プレイリストを作成"""
        response = self.client.table(self.table_name).insert(playlist_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, playlist_id: UUID, playlist_data: Dict[str, Any]) -> Dict[str, Any]:
        """プレイリストを更新"""
        response = self.client.table(self.table_name).update(playlist_data).eq("id", str(playlist_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, playlist_id: UUID) -> bool:
        """プレイリストを削除"""
        self.client.table(self.table_name).delete().eq("id", str(playlist_id)).execute()
        return True


class MaterialsSubPlaylistRepository:
    """サブプレイリストの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "sub_playlists"

    @handle_supabase_errors("find_all")
    async def find_all(self, playlist_id: UUID) -> List[Dict[str, Any]]:
        """指定されたプレイリストのサブプレイリストを取得"""
        response = self.client.table(self.table_name).select("*").eq("playlist_id", str(playlist_id)).execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, playlist_id: UUID, sub_playlist_id: UUID) -> Dict[str, Any]:
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
    async def create(self, playlist_id: UUID, sub_playlist_data: Dict[str, Any]) -> Dict[str, Any]:
        """サブプレイリストを作成"""
        sub_playlist_data["playlist_id"] = str(playlist_id)
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(sub_playlist_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, playlist_id: UUID, sub_playlist_id: UUID, sub_playlist_data: Dict[str, Any]) -> Dict[str, Any]:
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


class MaterialsVideoRepository:
    """ビデオの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "videos"

    @handle_supabase_errors("find_all")
    async def find_all(self, sub_playlist_id: UUID) -> List[Dict[str, Any]]:
        """指定されたサブプレイリストのビデオを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("sub_playlist_id", str(sub_playlist_id))
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, sub_playlist_id: UUID, video_id: UUID) -> Dict[str, Any]:
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
    async def create(self, sub_playlist_id: UUID, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """ビデオを作成"""
        video_data["sub_playlist_id"] = str(sub_playlist_id)
        # date/datetimeオブジェクトを文字列に変換
        serialized_data = _serialize_date_fields(video_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("update")
    async def update(self, sub_playlist_id: UUID, video_id: UUID, video_data: Dict[str, Any]) -> Dict[str, Any]:
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


class MaterialsFavoriteRepository:
    """お気に入りの関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "favorites"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのお気に入りを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, favorite_id: UUID) -> Dict[str, Any]:
        """指定したIDのお気に入りを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(favorite_id)).execute()
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("create")
    async def create(self, favorite_data: Dict[str, Any]) -> Dict[str, Any]:
        """お気に入りを作成"""
        response = self.client.table(self.table_name).insert(favorite_data).execute()
        return response.data[0] if response.data else None
    
    @handle_supabase_errors("update")
    async def update(self, favorite_id: UUID, favorite_data: Dict[str, Any]) -> Dict[str, Any]:
        """お気に入りを更新"""
        response = self.client.table(self.table_name).update(favorite_data).eq("id", str(favorite_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("delete")
    async def delete(self, favorite_id: UUID) -> bool:
        """お気に入りを削除"""
        self.client.table(self.table_name).delete().eq("id", str(favorite_id)).execute()
        return True

    @handle_supabase_errors("find_by_user_id")
    async def find_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーIDのお気に入り一覧を取得"""
        response = self.client.table(self.table_name).select("*").eq("user_id", str(user_id)).execute()
        return response.data

    @handle_supabase_errors("find_by_user_id_and_video_id")
    async def find_by_user_id_and_video_id(self, user_id: UUID, video_id: UUID) -> Dict[str, Any]:
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