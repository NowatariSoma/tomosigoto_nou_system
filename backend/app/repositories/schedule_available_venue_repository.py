"""
スケジュール利用可能会場のデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.database import Conn


class ScheduleAvailableVenueRepository:
    """スケジュール利用可能会場のデータアクセス層"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "schedule_available_venues"

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
        """すべてのスケジュール利用可能会場を取得"""
        rows = self.conn.execute("SELECT * FROM schedule_available_venues").fetchall()
        return [dict(r) for r in rows]

    def find_all_with_details(
        self,
        limit: int = 100,
        offset: int = 0,
        schedule_id: UUID | None = None,
        venue_id: UUID | None = None,
    ) -> list[dict[str, Any]]:
        """詳細情報付きでスケジュール利用可能会場を取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("sav.schedule_id = %s")
            params.append(str(schedule_id))
        if venue_id:
            conditions.append("sav.venue_id = %s")
            params.append(str(venue_id))

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        params.extend([limit, offset])

        rows = self.conn.execute(
            f"""
            SELECT sav.*,
                   v.name AS venue_name, v.address AS venue_address,
                   v.capacity AS venue_capacity, v.phone AS venue_phone,
                   v.email AS venue_email, v.website AS venue_website,
                   ps.schedule_date, ps.title AS schedule_title,
                   ps.start_time AS schedule_start_time, ps.end_time AS schedule_end_time
            FROM schedule_available_venues sav
            LEFT JOIN venues v ON sav.venue_id = v.id
            LEFT JOIN practice_schedules ps ON sav.schedule_id = ps.id
            {where_clause}
            ORDER BY sav.priority DESC, sav.created_at
            LIMIT %s OFFSET %s
            """,
            params,
        ).fetchall()
        return [dict(r) for r in rows]

    def count_all(
        self,
        schedule_id: UUID | None = None,
        venue_id: UUID | None = None,
    ) -> int:
        """スケジュール利用可能会場の総件数を取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("schedule_id = %s")
            params.append(str(schedule_id))
        if venue_id:
            conditions.append("venue_id = %s")
            params.append(str(venue_id))

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        row = self.conn.execute(
            f"SELECT COUNT(*) AS cnt FROM schedule_available_venues {where_clause}",
            params,
        ).fetchone()
        return row["cnt"] if row else 0

    def find_by_id(self, schedule_venue_id: UUID) -> dict[str, Any] | None:
        """指定したIDのスケジュール利用可能会場を取得"""
        row = self.conn.execute(
            "SELECT * FROM schedule_available_venues WHERE id = %s",
            (str(schedule_venue_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの利用可能会場一覧を取得"""
        rows = self.conn.execute(
            """
            SELECT sav.*,
                   v.name AS venue_name_join, v.campus AS venue_campus_join, v.address AS venue_address_join
            FROM schedule_available_venues sav
            LEFT JOIN venues v ON sav.venue_id = v.id
            WHERE sav.schedule_id = %s
            ORDER BY sav.priority DESC, sav.created_at
            """,
            (str(schedule_id),),
        ).fetchall()
        formatted_data = []
        for r in rows:
            item = dict(r)
            item["name"] = item.pop("venue_name_join", None)
            item["campus"] = item.pop("venue_campus_join", None)
            item["address"] = item.pop("venue_address_join", None)
            formatted_data.append(item)
        return formatted_data

    def find_by_venue(self, venue_id: UUID) -> list[dict[str, Any]]:
        """指定した会場のスケジュール利用可能性一覧を取得"""
        rows = self.conn.execute(
            "SELECT * FROM schedule_available_venues WHERE venue_id = %s ORDER BY created_at DESC",
            (str(venue_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_schedule_and_venue(
        self,
        schedule_id: UUID,
        venue_id: UUID,
    ) -> dict[str, Any] | None:
        """指定したスケジュールと会場の組み合わせを取得"""
        row = self.conn.execute(
            "SELECT * FROM schedule_available_venues WHERE schedule_id = %s AND venue_id = %s",
            (str(schedule_id), str(venue_id)),
        ).fetchone()
        return dict(row) if row else None

    def create(self, schedule_venue_data: dict[str, Any]) -> dict[str, Any]:
        """スケジュール利用可能会場を作成"""
        serialized_data = self._serialize_uuid_fields(schedule_venue_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO schedule_available_venues ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(
        self,
        schedule_venue_id: UUID,
        update_data: dict[str, Any],
    ) -> dict[str, Any] | None:
        """スケジュール利用可能会場を更新"""
        serialized_data = self._serialize_uuid_fields(update_data)
        if not serialized_data:
            return self.find_by_id(schedule_venue_id)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [str(schedule_venue_id)]
        cur = self.conn.execute(
            f"UPDATE schedule_available_venues SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, schedule_venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        cur = self.conn.execute(
            "DELETE FROM schedule_available_venues WHERE id = %s RETURNING id",
            (str(schedule_venue_id),),
        )
        self.conn.commit()
        return cur.fetchone() is not None

    def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの利用可能会場をすべて削除"""
        cur = self.conn.execute(
            "DELETE FROM schedule_available_venues WHERE schedule_id = %s RETURNING id",
            (str(schedule_id),),
        )
        self.conn.commit()
        return len(cur.fetchall())

    def delete_by_venue(self, venue_id: UUID) -> int:
        """指定した会場の利用可能性をすべて削除"""
        cur = self.conn.execute(
            "DELETE FROM schedule_available_venues WHERE venue_id = %s RETURNING id",
            (str(venue_id),),
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

    def find_venue_by_id(self, venue_id: UUID) -> dict[str, Any] | None:
        """会場の存在確認"""
        row = self.conn.execute(
            "SELECT * FROM venues WHERE id = %s",
            (str(venue_id),),
        ).fetchone()
        return dict(row) if row else None
