"""
セッション指導者のデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.database import Conn


class SessionInstructorRepository:
    """セッション指導者のデータアクセス層"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "session_instructors"

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
        """すべてのセッション指導者を取得"""
        rows = self.conn.execute("SELECT * FROM session_instructors").fetchall()
        return [dict(r) for r in rows]

    def find_all_with_details(
        self,
        limit: int = 20,
        offset: int = 0,
        schedule_id: UUID | None = None,
        slot_order: int | None = None,
    ) -> list[dict[str, Any]]:
        """詳細情報付きでセッション指導者を取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("si.schedule_id = %s")
            params.append(str(schedule_id))
        if slot_order is not None:
            conditions.append("si.slot_order = %s")
            params.append(slot_order)

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        params.extend([limit, offset])

        rows = self.conn.execute(
            f"""
            SELECT si.*,
                   a.status AS attendance_status,
                   u.email AS user_email,
                   up.first_name_kanji, up.last_name_kanji,
                   ps.schedule_date, ps.title AS schedule_title,
                   ps.start_time AS schedule_start_time, ps.end_time AS schedule_end_time,
                   v.name AS venue_name, v.address AS venue_address,
                   p.name AS part_name
            FROM session_instructors si
            LEFT JOIN practice_user_attendance a ON si.attendance_id = a.id
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN practice_schedules ps ON si.schedule_id = ps.id
            LEFT JOIN schedule_available_venues sav ON si.schedule_available_venue_id = sav.id
            LEFT JOIN venues v ON sav.venue_id = v.id
            LEFT JOIN sessions s ON s.schedule_id = si.schedule_id AND s.slot_order = si.slot_order
            LEFT JOIN parts p ON s.part_id = p.id
            {where_clause}
            LIMIT %s OFFSET %s
            """,
            params,
        ).fetchall()

        formatted_data = []
        for r in rows:
            item = dict(r)
            first_name = item.pop("first_name_kanji", None) or ""
            last_name = item.pop("last_name_kanji", None) or ""
            if first_name and last_name:
                item["user_name"] = f"{last_name} {first_name}"
            elif first_name:
                item["user_name"] = first_name
            elif last_name:
                item["user_name"] = last_name
            else:
                item["user_name"] = None
            formatted_data.append(item)

        return formatted_data

    def count_all(
        self,
        schedule_id: UUID | None = None,
        slot_order: int | None = None,
    ) -> int:
        """セッション指導者の総件数を取得"""
        conditions = []
        params: list[Any] = []

        if schedule_id:
            conditions.append("schedule_id = %s")
            params.append(str(schedule_id))
        if slot_order is not None:
            conditions.append("slot_order = %s")
            params.append(slot_order)

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        row = self.conn.execute(
            f"SELECT COUNT(*) AS cnt FROM session_instructors {where_clause}",
            params,
        ).fetchone()
        return row["cnt"] if row else 0

    def find_by_id(self, session_instructor_id: UUID) -> dict[str, Any] | None:
        """指定したIDのセッション指導者を取得"""
        row = self.conn.execute(
            "SELECT * FROM session_instructors WHERE id = %s",
            (str(session_instructor_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの指導者一覧を取得"""
        rows = self.conn.execute(
            "SELECT * FROM session_instructors WHERE schedule_id = %s",
            (str(schedule_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> list[dict[str, Any]]:
        """指定したスケジュールとコマの指導者一覧を取得（詳細情報付き）"""
        rows = self.conn.execute(
            """
            SELECT si.*,
                   a.status AS attendance_status,
                   u.email AS user_email,
                   up.first_name_kanji, up.last_name_kanji,
                   p.name AS part_name
            FROM session_instructors si
            LEFT JOIN practice_user_attendance a ON si.attendance_id = a.id
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            LEFT JOIN sessions s ON s.schedule_id = si.schedule_id AND s.slot_order = si.slot_order
            LEFT JOIN parts p ON s.part_id = p.id
            WHERE si.schedule_id = %s AND si.slot_order = %s
            """,
            (str(schedule_id), slot_order),
        ).fetchall()

        formatted_data = []
        for r in rows:
            item = dict(r)
            first_name = item.pop("first_name_kanji", None) or ""
            last_name = item.pop("last_name_kanji", None) or ""
            if first_name and last_name:
                item["user_name"] = f"{last_name} {first_name}"
            elif first_name:
                item["user_name"] = first_name
            elif last_name:
                item["user_name"] = last_name
            else:
                item["user_name"] = None
            formatted_data.append(item)

        return formatted_data

    def find_by_attendance_id(self, attendance_id: UUID) -> list[dict[str, Any]]:
        """指定した出席IDの指導者割り当て一覧を取得"""
        rows = self.conn.execute(
            "SELECT * FROM session_instructors WHERE attendance_id = %s",
            (str(attendance_id),),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_schedule_slot_and_attendance(
        self,
        schedule_id: UUID,
        slot_order: int,
        attendance_id: UUID,
    ) -> dict[str, Any] | None:
        """指定したスケジュール、コマ、出席IDの組み合わせを取得"""
        row = self.conn.execute(
            "SELECT * FROM session_instructors WHERE schedule_id = %s AND slot_order = %s AND attendance_id = %s",
            (str(schedule_id), slot_order, str(attendance_id)),
        ).fetchone()
        return dict(row) if row else None

    def create(self, session_instructor_data: dict[str, Any]) -> dict[str, Any]:
        """セッション指導者を作成"""
        serialized_data = self._serialize_uuid_fields(session_instructor_data)
        columns = list(serialized_data.keys())
        values = [serialized_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO session_instructors ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(
        self,
        session_instructor_id: UUID,
        update_data: dict[str, Any],
    ) -> dict[str, Any] | None:
        """セッション指導者を更新"""
        serialized_data = self._serialize_uuid_fields(update_data)
        if not serialized_data:
            return self.find_by_id(session_instructor_id)
        set_clause = ", ".join([f"{k} = %s" for k in serialized_data.keys()])
        values = list(serialized_data.values()) + [str(session_instructor_id)]
        cur = self.conn.execute(
            f"UPDATE session_instructors SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, session_instructor_id: UUID) -> bool:
        """セッション指導者を削除"""
        cur = self.conn.execute(
            "DELETE FROM session_instructors WHERE id = %s RETURNING id",
            (str(session_instructor_id),),
        )
        self.conn.commit()
        return cur.fetchone() is not None

    def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの指導者割り当てをすべて削除"""
        cur = self.conn.execute(
            "DELETE FROM session_instructors WHERE schedule_id = %s RETURNING id",
            (str(schedule_id),),
        )
        self.conn.commit()
        return len(cur.fetchall())

    def delete_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> int:
        """指定したスケジュールとコマの指導者割り当てをすべて削除"""
        cur = self.conn.execute(
            "DELETE FROM session_instructors WHERE schedule_id = %s AND slot_order = %s RETURNING id",
            (str(schedule_id), slot_order),
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

    def find_schedule_available_venue_by_id(self, venue_id: UUID) -> dict[str, Any] | None:
        """利用可能会場の存在確認"""
        row = self.conn.execute(
            "SELECT * FROM schedule_available_venues WHERE id = %s",
            (str(venue_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_attendance_by_id(self, attendance_id: UUID) -> dict[str, Any] | None:
        """出席記録の存在確認"""
        row = self.conn.execute(
            "SELECT * FROM practice_user_attendance WHERE id = %s",
            (str(attendance_id),),
        ).fetchone()
        return dict(row) if row else None

    def find_instructor_candidates(self, practice_schedule_id: UUID) -> list[dict[str, Any]]:
        """インストラクター候補を取得（出席記録ありかつis_instructorがtrueのユーザー）"""
        rows = self.conn.execute(
            """
            SELECT a.id AS attendance_id, a.user_id, a.status AS attendance_status,
                   u.email,
                   up.first_name_kanji, up.last_name_kanji, up.student_id, up.grade
            FROM practice_user_attendance a
            JOIN users u ON a.user_id = u.id
            JOIN user_roles ur ON a.user_id = ur.user_id AND ur.is_instructor = TRUE
            LEFT JOIN user_profiles up ON a.user_id = up.user_id
            WHERE a.practice_schedule_id = %s
              AND a.status IN ('present', 'late')
            """,
            (str(practice_schedule_id),),
        ).fetchall()

        candidates = []
        for r in rows:
            item = dict(r)
            candidates.append({
                "user_id": item["user_id"],
                "email": item["email"],
                "first_name_kanji": item.get("first_name_kanji"),
                "last_name_kanji": item.get("last_name_kanji"),
                "student_id": item.get("student_id"),
                "grade": item.get("grade"),
                "attendance_id": item["attendance_id"],
                "attendance_status": item["attendance_status"],
            })

        return candidates
