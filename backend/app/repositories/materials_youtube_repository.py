from typing import Any
from uuid import UUID
from datetime import date, datetime

from app.core.database import Conn


def _serialize_date_fields(data: dict[str, Any]) -> dict[str, Any]:
    """辞書内のdate/datetimeオブジェクトを文字列に変換"""
    serialized = {}
    for key, value in data.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, date):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


class MaterialsPlaylistRepository:
    """プレイリストの関連のリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "playlists"

    def find_all(self) -> list[dict[str, Any]]:
        """すべてのプレイリストを取得"""
        rows = self.conn.execute("SELECT * FROM playlists").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, playlist_id: UUID) -> dict[str, Any] | None:
        """指定したIDのプレイリストを取得"""
        row = self.conn.execute(
            "SELECT * FROM playlists WHERE id = %s",
            (str(playlist_id),),
        ).fetchone()
        return dict(row) if row else None

    def create(self, playlist_data: dict[str, Any]) -> dict[str, Any] | None:
        """プレイリストを作成"""
        columns = list(playlist_data.keys())
        values = [playlist_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO playlists ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def update(self, playlist_id: UUID, playlist_data: dict[str, Any]) -> dict[str, Any] | None:
        """プレイリストを更新"""
        if not playlist_data:
            return self.find_by_id(playlist_id)
        set_clause = ", ".join([f"{k} = %s" for k in playlist_data.keys()])
        values = list(playlist_data.values()) + [str(playlist_id)]
        cur = self.conn.execute(
            f"UPDATE playlists SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, playlist_id: UUID) -> bool:
        """プレイリストを削除"""
        self.conn.execute("DELETE FROM playlists WHERE id = %s", (str(playlist_id),))
        self.conn.commit()
        return True

    def search(
        self,
        title: str | None = None,
        name: str | None = None,
        year: int | None = None,
    ) -> list[dict[str, Any]]:
        """プレイリストを検索"""
        conditions = []
        params: list[Any] = []

        if title:
            conditions.append("title ILIKE %s")
            params.append(f"%{title}%")
        if name:
            conditions.append("name ILIKE %s")
            params.append(f"%{name}%")
        if year is not None:
            conditions.append("year = %s")
            params.append(year)

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        rows = self.conn.execute(
            f"SELECT * FROM playlists {where_clause}",
            params,
        ).fetchall()
        return [dict(r) for r in rows]


class MaterialsSubPlaylistRepository:
    """サブプレイリストの関連のリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "sub_playlists"

    def find_all(self, playlist_id: UUID) -> list[dict[str, Any]]:
        """指定されたプレイリストのサブプレイリストを取得"""
        rows = self.conn.execute(
            "SELECT * FROM sub_playlists WHERE playlist_id = %s",
            (str(playlist_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, playlist_id: UUID, sub_playlist_id: UUID) -> dict[str, Any] | None:
        """指定したIDのサブプレイリストを取得"""
        row = self.conn.execute(
            "SELECT * FROM sub_playlists WHERE playlist_id = %s AND id = %s",
            (str(playlist_id), str(sub_playlist_id)),
        ).fetchone()
        return dict(row) if row else None

    def create(self, playlist_id: UUID, sub_playlist_data: dict[str, Any]) -> dict[str, Any] | None:
        """サブプレイリストを作成"""
        sub_playlist_data["playlist_id"] = str(playlist_id)
        serialized_data = _serialize_date_fields(sub_playlist_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO sub_playlists ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def update(
        self, playlist_id: UUID, sub_playlist_id: UUID, sub_playlist_data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """サブプレイリストを更新"""
        serialized_data = _serialize_date_fields(sub_playlist_data)
        if not serialized_data:
            return self.find_by_id(playlist_id, sub_playlist_id)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [str(playlist_id), str(sub_playlist_id)]
        cur = self.conn.execute(
            f"UPDATE sub_playlists SET {set_clause} WHERE playlist_id = %s AND id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, playlist_id: UUID, sub_playlist_id: UUID) -> bool:
        """サブプレイリストを削除"""
        self.conn.execute(
            "DELETE FROM sub_playlists WHERE playlist_id = %s AND id = %s",
            (str(playlist_id), str(sub_playlist_id)),
        )
        self.conn.commit()
        return True

    def search(
        self,
        playlist_id: UUID,
        title: str | None = None,
        phase: str | None = None,
        recorded_date_from: date | None = None,
        recorded_date_to: date | None = None,
    ) -> list[dict[str, Any]]:
        """サブプレイリストを検索"""
        conditions = ["playlist_id = %s"]
        params: list[Any] = [str(playlist_id)]

        if title:
            conditions.append("title ILIKE %s")
            params.append(f"%{title}%")
        if phase:
            conditions.append("phase = %s")
            params.append(phase)
        if recorded_date_from:
            conditions.append("recorded_date >= %s")
            params.append(recorded_date_from.isoformat())
        if recorded_date_to:
            conditions.append("recorded_date <= %s")
            params.append(recorded_date_to.isoformat())

        where_clause = "WHERE " + " AND ".join(conditions)
        rows = self.conn.execute(
            f"SELECT * FROM sub_playlists {where_clause}",
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def find_playlist_id_by_sub_playlist(self, sub_playlist_id: UUID) -> dict[str, Any] | None:
        """サブプレイリストIDからplaylist_idを取得"""
        row = self.conn.execute(
            "SELECT id, playlist_id FROM sub_playlists WHERE id = %s",
            (str(sub_playlist_id),),
        ).fetchone()
        return dict(row) if row else None


class MaterialsVideoRepository:
    """ビデオの関連のリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "videos"

    def find_all(self, sub_playlist_id: UUID) -> list[dict[str, Any]]:
        """指定されたサブプレイリストのビデオを取得"""
        rows = self.conn.execute(
            "SELECT * FROM videos WHERE sub_playlist_id = %s",
            (str(sub_playlist_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, sub_playlist_id: UUID, video_id: UUID) -> dict[str, Any] | None:
        """指定したIDのビデオを取得"""
        row = self.conn.execute(
            "SELECT * FROM videos WHERE sub_playlist_id = %s AND id = %s",
            (str(sub_playlist_id), str(video_id)),
        ).fetchone()
        return dict(row) if row else None

    def create(self, sub_playlist_id: UUID, video_data: dict[str, Any]) -> dict[str, Any] | None:
        """ビデオを作成"""
        video_data["sub_playlist_id"] = str(sub_playlist_id)
        serialized_data = _serialize_date_fields(video_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO videos ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def update(
        self, sub_playlist_id: UUID, video_id: UUID, video_data: dict[str, Any]
    ) -> dict[str, Any] | None:
        """ビデオを更新"""
        serialized_data = _serialize_date_fields(video_data)
        if not serialized_data:
            return self.find_by_id(sub_playlist_id, video_id)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [str(sub_playlist_id), str(video_id)]
        cur = self.conn.execute(
            f"UPDATE videos SET {set_clause} WHERE sub_playlist_id = %s AND id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, sub_playlist_id: UUID, video_id: UUID) -> bool:
        """ビデオを削除"""
        self.conn.execute(
            "DELETE FROM videos WHERE sub_playlist_id = %s AND id = %s",
            (str(sub_playlist_id), str(video_id)),
        )
        self.conn.commit()
        return True

    def search(
        self,
        sub_playlist_id: UUID,
        title: str | None = None,
        recorded_date_from: date | None = None,
        recorded_date_to: date | None = None,
    ) -> list[dict[str, Any]]:
        """ビデオを検索"""
        conditions = ["sub_playlist_id = %s"]
        params: list[Any] = [str(sub_playlist_id)]

        if title:
            conditions.append("title ILIKE %s")
            params.append(f"%{title}%")
        if recorded_date_from:
            conditions.append("recorded_date >= %s")
            params.append(recorded_date_from.isoformat())
        if recorded_date_to:
            conditions.append("recorded_date <= %s")
            params.append(recorded_date_to.isoformat())

        where_clause = "WHERE " + " AND ".join(conditions)
        rows = self.conn.execute(
            f"SELECT * FROM videos {where_clause}",
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_sub_playlist_and_url(self, sub_playlist_id: UUID, video_url: str) -> dict[str, Any] | None:
        """サブプレイリストIDとURLでビデオを検索"""
        row = self.conn.execute(
            "SELECT * FROM videos WHERE sub_playlist_id = %s AND youtube_url = %s",
            (str(sub_playlist_id), video_url),
        ).fetchone()
        return dict(row) if row else None


class MaterialsFavoriteRepository:
    """お気に入りの関連のリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "favorites"

    def find_all(self) -> list[dict[str, Any]]:
        """すべてのお気に入りを取得"""
        rows = self.conn.execute("SELECT * FROM favorites").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, favorite_id: UUID) -> dict[str, Any] | None:
        """指定したIDのお気に入りを取得"""
        row = self.conn.execute(
            "SELECT * FROM favorites WHERE id = %s",
            (str(favorite_id),),
        ).fetchone()
        return dict(row) if row else None

    def create(self, favorite_data: dict[str, Any]) -> dict[str, Any] | None:
        """お気に入りを作成"""
        columns = list(favorite_data.keys())
        values = [favorite_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO favorites ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def update(self, favorite_id: UUID, favorite_data: dict[str, Any]) -> dict[str, Any] | None:
        """お気に入りを更新"""
        if not favorite_data:
            return self.find_by_id(favorite_id)
        set_clause = ", ".join([f"{k} = %s" for k in favorite_data.keys()])
        values = list(favorite_data.values()) + [str(favorite_id)]
        cur = self.conn.execute(
            f"UPDATE favorites SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, favorite_id: UUID) -> bool:
        """お気に入りを削除"""
        self.conn.execute("DELETE FROM favorites WHERE id = %s", (str(favorite_id),))
        self.conn.commit()
        return True

    def find_by_user_id(self, user_id: UUID) -> list[dict[str, Any]]:
        """指定したユーザーIDのお気に入り一覧を取得"""
        rows = self.conn.execute(
            "SELECT * FROM favorites WHERE user_id = %s",
            (str(user_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_user_id_and_video_id(self, user_id: UUID, video_id: UUID) -> dict[str, Any] | None:
        """指定したユーザーIDとビデオIDのお気に入りを取得"""
        row = self.conn.execute(
            "SELECT * FROM favorites WHERE user_id = %s AND video_id = %s",
            (str(user_id), str(video_id)),
        ).fetchone()
        return dict(row) if row else None

    def delete_by_user_id_and_video_id(self, user_id: UUID, video_id: UUID) -> bool:
        """指定したユーザーIDとビデオIDのお気に入りを削除"""
        self.conn.execute(
            "DELETE FROM favorites WHERE user_id = %s AND video_id = %s",
            (str(user_id), str(video_id)),
        )
        self.conn.commit()
        return True

    def find_favorite_videos_with_details(self, user_id: UUID) -> list[dict[str, Any]]:
        """指定したユーザーIDのお気に入り動画とその関連情報（プレイリスト、サブプレイリスト）を取得"""
        rows = self.conn.execute(
            """
            SELECT f.*,
                   vid.id AS vid_id, vid.title AS vid_title, vid.youtube_url, vid.recorded_date,
                   vid.sub_playlist_id AS vid_sub_playlist_id,
                   sp.id AS sp_id, sp.title AS sp_title, sp.phase, sp.playlist_id AS sp_playlist_id,
                   pl.id AS pl_id, pl.title AS pl_title, pl.name AS pl_name, pl.year AS pl_year
            FROM favorites f
            LEFT JOIN videos vid ON f.video_id = vid.id
            LEFT JOIN sub_playlists sp ON vid.sub_playlist_id = sp.id
            LEFT JOIN playlists pl ON sp.playlist_id = pl.id
            WHERE f.user_id = %s
            """,
            (str(user_id),),
        ).fetchall()

        result = []
        for r in rows:
            item = dict(r)
            video = {
                "id": item.pop("vid_id", None),
                "title": item.pop("vid_title", None),
                "youtube_url": item.pop("youtube_url", None),
                "recorded_date": item.pop("recorded_date", None),
                "sub_playlist_id": item.pop("vid_sub_playlist_id", None),
                "sub_playlists": {
                    "id": item.pop("sp_id", None),
                    "title": item.pop("sp_title", None),
                    "phase": item.pop("phase", None),
                    "playlist_id": item.pop("sp_playlist_id", None),
                    "playlists": {
                        "id": item.pop("pl_id", None),
                        "title": item.pop("pl_title", None),
                        "name": item.pop("pl_name", None),
                        "year": item.pop("pl_year", None),
                    },
                },
            }
            item["videos"] = video
            result.append(item)

        return result


class YoutubeOauthTokenRepository:
    """YouTube OAuthトークンのリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn

    def find_system_token(self) -> dict[str, Any] | None:
        """システムアカウントのトークンを取得"""
        row = self.conn.execute(
            "SELECT * FROM youtube_oauth_tokens WHERE account_type = 'system' LIMIT 1",
        ).fetchone()
        return dict(row) if row else None

    def find_oauth_state(self, state: str) -> dict[str, Any] | None:
        """OAuth stateを取得"""
        row = self.conn.execute(
            "SELECT * FROM youtube_oauth_states WHERE state = %s LIMIT 1",
            (state,),
        ).fetchone()
        return dict(row) if row else None

    def save_oauth_state(self, state: str, expires_at: str) -> None:
        """OAuth stateを保存"""
        self.conn.execute(
            "INSERT INTO youtube_oauth_states (state, expires_at) VALUES (%s, %s)",
            (state, expires_at),
        )
        self.conn.commit()

    def delete_oauth_state(self, state_id: str) -> None:
        """OAuth stateを削除"""
        self.conn.execute(
            "DELETE FROM youtube_oauth_states WHERE id = %s",
            (state_id,),
        )
        self.conn.commit()

    def create_token(self, token_data: dict[str, Any]) -> dict[str, Any]:
        """トークンを作成"""
        # scopesはリストなので配列変換
        if "scopes" in token_data and isinstance(token_data["scopes"], list):
            token_data = {**token_data, "scopes": token_data["scopes"]}
        columns = list(token_data.keys())
        values = [token_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO youtube_oauth_tokens ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else {}

    def update_token(self, token_id: str, token_data: dict[str, Any]) -> dict[str, Any]:
        """トークンを更新"""
        if not token_data:
            row = self.conn.execute(
                "SELECT * FROM youtube_oauth_tokens WHERE id = %s",
                (token_id,),
            ).fetchone()
            return dict(row) if row else {}
        set_clause = ", ".join([f"{k} = %s" for k in token_data.keys()])
        values = list(token_data.values()) + [token_id]
        cur = self.conn.execute(
            f"UPDATE youtube_oauth_tokens SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else {}
