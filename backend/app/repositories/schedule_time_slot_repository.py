"""
スケジュール時間スロットのデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.database import Conn


class ScheduleTimeSlotRepository:
    """スケジュール時間スロットのデータアクセス層"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "schedule_time_slots"

    def _serialize_uuid_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """UUID型、Enum型、time型を文字列に変換"""
        from datetime import time
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            elif isinstance(value, Enum):
                serialized_data[key] = value.value
            elif isinstance(value, time):
                serialized_data[key] = value.strftime("%H:%M:%S")
            else:
                serialized_data[key] = value
        return serialized_data

    def find_all(self) -> list[dict[str, Any]]:
        """すべてのスケジュール時間スロットを取得"""
        rows = self.conn.execute("SELECT * FROM schedule_time_slots").fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, time_slot_id: UUID) -> dict[str, Any] | None:
        """指定したIDのスケジュール時間スロットを取得"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        row = self.conn.execute(
            "SELECT * FROM schedule_time_slots WHERE id = %s",
            (time_slot_id_str,),
        ).fetchone()
        return dict(row) if row else None

    def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの時間スロット一覧を取得（slot_order順）"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        rows = self.conn.execute(
            "SELECT * FROM schedule_time_slots WHERE schedule_id = %s ORDER BY slot_order",
            (schedule_id_str,),
        ).fetchall()
        return [dict(r) for r in rows]

    def count_all(self, schedule_id: UUID | None = None) -> int:
        """スケジュール時間スロットの総件数を取得"""
        if schedule_id:
            row = self.conn.execute(
                "SELECT COUNT(*) AS cnt FROM schedule_time_slots WHERE schedule_id = %s",
                (str(schedule_id),),
            ).fetchone()
        else:
            row = self.conn.execute(
                "SELECT COUNT(*) AS cnt FROM schedule_time_slots"
            ).fetchone()
        return row["cnt"] if row else 0

    def create(self, time_slot_data: dict[str, Any]) -> dict[str, Any]:
        """スケジュール時間スロットを作成"""
        serialized_data = self._serialize_uuid_fields(time_slot_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO schedule_time_slots ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(
        self,
        time_slot_id: UUID,
        update_data: dict[str, Any],
    ) -> dict[str, Any]:
        """スケジュール時間スロットを更新"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        serialized_data = self._serialize_uuid_fields(update_data)
        if not serialized_data:
            row = self.conn.execute(
                "SELECT * FROM schedule_time_slots WHERE id = %s",
                (time_slot_id_str,),
            ).fetchone()
            if not row:
                raise ValueError(f"時間スロット {time_slot_id} が見つかりません")
            return dict(row)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [time_slot_id_str]
        cur = self.conn.execute(
            f"UPDATE schedule_time_slots SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        if not row:
            raise ValueError(f"時間スロット {time_slot_id} が見つかりません")
        return dict(row)

    def delete(self, time_slot_id: UUID) -> bool:
        """スケジュール時間スロットを削除"""
        time_slot_id_str = str(time_slot_id) if isinstance(time_slot_id, UUID) else time_slot_id
        cur = self.conn.execute(
            "DELETE FROM schedule_time_slots WHERE id = %s RETURNING id",
            (time_slot_id_str,),
        )
        self.conn.commit()
        return cur.fetchone() is not None

    def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの時間スロットをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        cur = self.conn.execute(
            "DELETE FROM schedule_time_slots WHERE schedule_id = %s RETURNING id",
            (schedule_id_str,),
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
