from typing import Any
from uuid import UUID
from enum import Enum
from datetime import time

from app.core.database import Conn


class AttendanceRepository:
    """出欠記録のデータアクセス層"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "practice_user_attendance"

    def _serialize_uuid_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        """UUID型、Enum型、time型を文字列に変換、空文字列をNoneに変換"""
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            elif isinstance(value, Enum):
                serialized_data[key] = value.value
            elif isinstance(value, time):
                serialized_data[key] = value.strftime("%H:%M:%S")
            elif value == "":
                serialized_data[key] = None
            else:
                serialized_data[key] = value
        return serialized_data

    def _format_attendance_with_user_info(self, item: dict[str, Any]) -> dict[str, Any]:
        """出欠記録にユーザー情報（user_name, user_email, user_year）を追加"""
        formatted_item = item.copy()

        first_name = item.get("first_name_kanji") or ""
        last_name = item.get("last_name_kanji") or ""
        user_year = item.get("grade")
        user_email = item.get("email") or ""

        user_name = None
        if first_name and last_name:
            user_name = f"{last_name} {first_name}"
        elif first_name:
            user_name = first_name
        elif last_name:
            user_name = last_name

        if not user_name:
            raw_meta = item.get("raw_user_meta_data")
            if isinstance(raw_meta, dict):
                user_name = raw_meta.get("name")
            if not user_name and user_email:
                user_name = user_email.split("@")[0]

        formatted_item["user_name"] = user_name or f"User {str(item.get('user_id', ''))[:8]}"
        formatted_item["user_email"] = user_email
        formatted_item["user_year"] = user_year

        return formatted_item

    def find_all(self) -> list[dict[str, Any]]:
        """すべての出欠記録を取得（ユーザー情報とプロフィール情報を含む）"""
        rows = self.conn.execute(
            """
            SELECT a.*,
                   up.first_name_kanji, up.last_name_kanji, up.grade,
                   u.email, u.raw_user_meta_data
            FROM practice_user_attendance a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN users u ON a.user_id = u.id
            """
        ).fetchall()
        return [self._format_attendance_with_user_info(dict(r)) for r in rows]

    def find_by_id(self, attendance_id: UUID) -> dict[str, Any]:
        """指定したIDの出欠記録を取得（ユーザー情報とプロフィール情報を含む）"""
        row = self.conn.execute(
            """
            SELECT a.*,
                   up.first_name_kanji, up.last_name_kanji, up.grade,
                   u.email, u.raw_user_meta_data
            FROM practice_user_attendance a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = %s
            """,
            (str(attendance_id),),
        ).fetchone()

        if not row:
            raise ValueError(f"Attendance with id {attendance_id} not found")

        return self._format_attendance_with_user_info(dict(row))

    def find_by_practice_schedule(self, practice_schedule_id: UUID) -> list[dict[str, Any]]:
        """指定した練習スケジュールの出欠記録を取得（ユーザー情報とプロフィール情報を含む）"""
        rows = self.conn.execute(
            """
            SELECT a.*,
                   up.first_name_kanji, up.last_name_kanji, up.grade,
                   u.email, u.raw_user_meta_data
            FROM practice_user_attendance a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.practice_schedule_id = %s
            """,
            (str(practice_schedule_id),),
        ).fetchall()
        return [self._format_attendance_with_user_info(dict(r)) for r in rows]

    def find_by_user(self, user_id: UUID) -> list[dict[str, Any]]:
        """指定したユーザーの出欠記録を取得（ユーザー情報とプロフィール情報を含む）"""
        rows = self.conn.execute(
            """
            SELECT a.*,
                   up.first_name_kanji, up.last_name_kanji, up.grade,
                   u.email, u.raw_user_meta_data
            FROM practice_user_attendance a
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.user_id = %s
            """,
            (str(user_id),),
        ).fetchall()
        return [self._format_attendance_with_user_info(dict(r)) for r in rows]

    def find_by_practice_and_user(
        self, practice_schedule_id: UUID, user_id: UUID
    ) -> dict[str, Any] | None:
        """指定した練習とユーザーの組み合わせの出欠記録を取得"""
        row = self.conn.execute(
            "SELECT * FROM practice_user_attendance WHERE practice_schedule_id = %s AND user_id = %s",
            (str(practice_schedule_id), str(user_id)),
        ).fetchone()
        return dict(row) if row else None

    def create(self, attendance_data: dict[str, Any]) -> dict[str, Any]:
        """出欠記録を作成"""
        serialized_data = self._serialize_uuid_fields(attendance_data)
        serialized_data.pop("created_by", None)
        serialized_data.pop("updated_by", None)

        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO practice_user_attendance ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(self, attendance_id: UUID, attendance_data: dict[str, Any]) -> dict[str, Any]:
        """出欠記録を更新"""
        serialized_data = self._serialize_uuid_fields(attendance_data)
        serialized_data.pop("created_by", None)
        serialized_data.pop("updated_by", None)

        if not serialized_data:
            return self.find_by_id(attendance_id)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [str(attendance_id)]
        cur = self.conn.execute(
            f"UPDATE practice_user_attendance SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def upsert(self, attendance_data: dict[str, Any]) -> dict[str, Any]:
        """出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）"""
        serialized_data = self._serialize_uuid_fields(attendance_data)
        serialized_data.pop("created_by", None)
        serialized_data.pop("updated_by", None)

        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)

        # ON CONFLICT で更新対象カラムを決定（practice_schedule_id, user_id 以外）
        conflict_columns = ["practice_schedule_id", "user_id"]
        update_columns = [c for c in columns if c not in conflict_columns]
        if update_columns:
            update_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_columns])
        else:
            update_clause = f"{columns[0]} = EXCLUDED.{columns[0]}"

        cur = self.conn.execute(
            f"""
            INSERT INTO practice_user_attendance ({col_str})
            VALUES ({placeholders})
            ON CONFLICT (practice_schedule_id, user_id) DO UPDATE SET {update_clause}
            RETURNING *
            """,
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def delete(self, attendance_id: UUID) -> bool:
        """出欠記録を削除"""
        self.conn.execute(
            "DELETE FROM practice_user_attendance WHERE id = %s",
            (str(attendance_id),),
        )
        self.conn.commit()
        return True

    def get_attendance_summary(self) -> list[dict[str, Any]]:
        """練習別の出欠サマリーを取得（ビューから）"""
        rows = self.conn.execute("SELECT * FROM practice_user_attendance_summary").fetchall()
        return [dict(r) for r in rows]

    def get_user_attendance_history(self) -> list[dict[str, Any]]:
        """ユーザー別の出欠履歴を取得（ビューから）"""
        rows = self.conn.execute("SELECT * FROM practice_user_attendance_history").fetchall()
        return [dict(r) for r in rows]
