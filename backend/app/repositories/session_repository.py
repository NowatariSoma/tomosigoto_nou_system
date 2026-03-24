"""
セッションのデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.database import Conn


class SessionRepository:
    """セッションのデータアクセス層"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "sessions"

    def _serialize_uuid_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """UUID型とEnum型を文字列に変換"""
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            elif isinstance(value, Enum):
                serialized_data[key] = value.value
            else:
                serialized_data[key] = value
        return serialized_data

    def find_all(self) -> list[dict[str, Any]]:
        """すべてのセッションを取得"""
        rows = self.conn.execute("SELECT * FROM sessions").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, session_id: UUID) -> dict[str, Any] | None:
        """指定されたIDのセッションを取得"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        row = self.conn.execute(
            """
            SELECT s.*, p.name AS part_name
            FROM sessions s
            LEFT JOIN parts p ON s.part_id = p.id
            WHERE s.id = %s
            """,
            (session_id_str,),
        ).fetchone()
        return dict(row) if row else None

    def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定されたスケジュールのセッションを取得（N+1問題を解決）"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        rows = self.conn.execute(
            """
            SELECT s.*, p.name AS part_name
            FROM sessions s
            LEFT JOIN parts p ON s.part_id = p.id
            WHERE s.schedule_id = %s
            ORDER BY s.slot_order
            """,
            (schedule_id_str,),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_with_details(
        self,
        limit: int = 100,
        offset: int = 0,
        schedule_id: UUID | None = None,
        part_id: UUID | None = None,
    ) -> list[dict[str, Any]]:
        """詳細情報付きでセッションを取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("s.schedule_id = %s")
            params.append(str(schedule_id))
        if part_id:
            conditions.append("s.part_id = %s")
            params.append(str(part_id))

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        params.extend([limit, offset])

        rows = self.conn.execute(
            f"""
            SELECT s.*,
                   p.name AS part_name,
                   v.name AS venue_name, v.address AS venue_address,
                   ps.schedule_date, ps.title AS schedule_title,
                   ps.start_time AS schedule_start_time, ps.end_time AS schedule_end_time
            FROM sessions s
            LEFT JOIN parts p ON s.part_id = p.id
            LEFT JOIN schedule_available_venues sav ON s.schedule_available_venue_id = sav.id
            LEFT JOIN venues v ON sav.venue_id = v.id
            LEFT JOIN practice_schedules ps ON s.schedule_id = ps.id
            {where_clause}
            ORDER BY s.slot_order, s.created_at
            LIMIT %s OFFSET %s
            """,
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def count_all(
        self,
        schedule_id: UUID | None = None,
        part_id: UUID | None = None,
    ) -> int:
        """セッションの総件数を取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("schedule_id = %s")
            params.append(str(schedule_id))
        if part_id:
            conditions.append("part_id = %s")
            params.append(str(part_id))

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        row = self.conn.execute(
            f"SELECT COUNT(*) AS cnt FROM sessions {where_clause}",
            params,
        ).fetchone()
        return row["cnt"] if row else 0

    def create(self, session_data: dict[str, Any]) -> dict[str, Any]:
        """新しいセッションを作成"""
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])
        if "schedule_id" in session_data and session_data["schedule_id"] is not None:
            session_data["schedule_id"] = str(session_data["schedule_id"])

        serialized_data = self._serialize_uuid_fields(session_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO sessions ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(self, session_id: UUID, session_data: dict[str, Any]) -> dict[str, Any] | None:
        """セッションを更新"""
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])
        if "schedule_id" in session_data and session_data["schedule_id"] is not None:
            session_data["schedule_id"] = str(session_data["schedule_id"])

        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        serialized_data = self._serialize_uuid_fields(session_data)
        if not serialized_data:
            return self.find_by_id(session_id_str)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [session_id_str]
        cur = self.conn.execute(
            f"UPDATE sessions SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, session_id: UUID) -> bool:
        """セッションを削除"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        cur = self.conn.execute(
            "DELETE FROM sessions WHERE id = %s RETURNING id",
            (session_id_str,),
        )
        self.conn.commit()
        return cur.fetchone() is not None

    def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定されたスケジュールのセッションをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        cur = self.conn.execute(
            "DELETE FROM sessions WHERE schedule_id = %s RETURNING id",
            (schedule_id_str,),
        )
        self.conn.commit()
        return len(cur.fetchall())

    def delete_by_part(self, part_id: UUID) -> int:
        """指定した部署のセッションをすべて削除"""
        cur = self.conn.execute(
            "DELETE FROM sessions WHERE part_id = %s RETURNING id",
            (str(part_id),),
        )
        self.conn.commit()
        return len(cur.fetchall())

    def find_schedule_by_id(self, schedule_id: UUID) -> dict[str, Any] | None:
        """スケジュールの存在確認"""
        row = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE id = %s",
            (str(schedule_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_part_by_id(self, part_id: UUID) -> dict[str, Any] | None:
        """部署の存在確認"""
        row = self.conn.execute(
            "SELECT * FROM parts WHERE id = %s",
            (str(part_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_venue_by_id(self, venue_id: UUID) -> dict[str, Any] | None:
        """会場の存在確認"""
        row = self.conn.execute(
            "SELECT * FROM schedule_available_venues WHERE id = %s",
            (str(venue_id),),
        ).fetchone()
        return dict(row) if row else None
