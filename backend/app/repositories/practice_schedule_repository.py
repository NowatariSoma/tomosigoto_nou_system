import logging
from typing import Any
from uuid import UUID

from app.core.database import Conn

logger = logging.getLogger(__name__)


class PracticeScheduleRepository:
    """練習スケジュール関連のリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "practice_schedules"

    def find_all(self) -> list[dict[str, Any]]:
        """すべての練習スケジュールを取得"""
        rows = self.conn.execute("SELECT * FROM practice_schedules").fetchall()
        return [dict(r) for r in rows]

    def find_all_with_relations(self) -> list[dict[str, Any]]:
        """関連データ込みですべての練習スケジュールを取得"""
        rows = self.conn.execute(
            """
            SELECT ps.*,
                   json_agg(DISTINCT jsonb_build_object(
                       'id', sav.id, 'venue_id', sav.venue_id, 'is_preferred', sav.is_preferred,
                       'priority', sav.priority, 'venues', jsonb_build_object('id', v.id, 'name', v.name, 'campus', v.campus)
                   )) FILTER (WHERE sav.id IS NOT NULL) AS schedule_available_venues,
                   json_agg(DISTINCT jsonb_build_object(
                       'id', s.id, 'title', s.title, 'slot_order', s.slot_order,
                       'schedule_available_venue_id', s.schedule_available_venue_id,
                       'part_id', s.part_id,
                       'parts', jsonb_build_object('id', p.id, 'name', p.name)
                   )) FILTER (WHERE s.id IS NOT NULL) AS sessions
            FROM practice_schedules ps
            LEFT JOIN schedule_available_venues sav ON sav.schedule_id = ps.id
            LEFT JOIN venues v ON sav.venue_id = v.id
            LEFT JOIN sessions s ON s.schedule_id = ps.id
            LEFT JOIN parts p ON s.part_id = p.id
            GROUP BY ps.id
            ORDER BY ps.schedule_date
            """
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_id(self, schedule_id: UUID) -> dict[str, Any] | None:
        """指定されたIDの練習スケジュールを取得"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        row = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE id = %s",
            (schedule_id_str,),
        ).fetchone()
        return dict(row) if row else None

    def find_by_date(self, target_date: str) -> dict[str, Any] | None:
        """指定された日付の練習スケジュールを取得"""
        row = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE schedule_date = %s",
            (target_date,),
        ).fetchone()
        return dict(row) if row else None

    def find_by_date_range(self, start_date: str, end_date: str) -> list[dict[str, Any]]:
        """指定された日付範囲の練習スケジュールを取得"""
        rows = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE schedule_date >= %s AND schedule_date < %s ORDER BY schedule_date",
            (start_date, end_date),
        ).fetchall()
        return [dict(r) for r in rows]

    def find_by_date_range_with_relations(self, start_date: str, end_date: str) -> list[dict[str, Any]]:
        """日付範囲のスケジュールを関連データと一緒に取得（N+1問題を解決）"""
        rows = self.conn.execute(
            """
            SELECT ps.*,
                   json_agg(DISTINCT jsonb_build_object(
                       'id', sav.id, 'venue_id', sav.venue_id, 'is_preferred', sav.is_preferred,
                       'priority', sav.priority, 'venues', jsonb_build_object('id', v.id, 'name', v.name, 'campus', v.campus)
                   )) FILTER (WHERE sav.id IS NOT NULL) AS schedule_available_venues,
                   json_agg(DISTINCT jsonb_build_object(
                       'id', s.id, 'title', s.title, 'slot_order', s.slot_order,
                       'schedule_available_venue_id', s.schedule_available_venue_id,
                       'part_id', s.part_id,
                       'parts', jsonb_build_object('id', p.id, 'name', p.name)
                   )) FILTER (WHERE s.id IS NOT NULL) AS sessions
            FROM practice_schedules ps
            LEFT JOIN schedule_available_venues sav ON sav.schedule_id = ps.id
            LEFT JOIN venues v ON sav.venue_id = v.id
            LEFT JOIN sessions s ON s.schedule_id = ps.id
            LEFT JOIN parts p ON s.part_id = p.id
            WHERE ps.schedule_date >= %s AND ps.schedule_date < %s
            GROUP BY ps.id
            ORDER BY ps.schedule_date
            """,
            (start_date, end_date),
        ).fetchall()
        return [dict(r) for r in rows]

    def create(self, schedule_data: dict[str, Any]) -> dict[str, Any]:
        """新しい練習スケジュールを作成"""
        if "schedule_date" in schedule_data:
            schedule_data["schedule_date"] = str(schedule_data["schedule_date"])
        if "start_time" in schedule_data:
            schedule_data["start_time"] = str(schedule_data["start_time"])
        if "end_time" in schedule_data:
            schedule_data["end_time"] = str(schedule_data["end_time"])
        if "stage_id" in schedule_data and schedule_data["stage_id"] is not None:
            schedule_data["stage_id"] = str(schedule_data["stage_id"])

        schedule_data.pop("created_by", None)
        schedule_data.pop("updated_by", None)

        columns = list(schedule_data.keys())
        values = [schedule_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO practice_schedules ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        return dict(cur.fetchone())

    def update(self, schedule_id: UUID, schedule_data: dict[str, Any]) -> dict[str, Any] | None:
        """練習スケジュールを更新"""
        if "schedule_date" in schedule_data:
            schedule_data["schedule_date"] = str(schedule_data["schedule_date"])
        if "start_time" in schedule_data:
            schedule_data["start_time"] = str(schedule_data["start_time"])
        if "end_time" in schedule_data:
            schedule_data["end_time"] = str(schedule_data["end_time"])
        if "stage_id" in schedule_data and schedule_data["stage_id"] is not None:
            schedule_data["stage_id"] = str(schedule_data["stage_id"])

        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        if not schedule_data:
            return self.find_by_id(schedule_id_str)
        set_clause = ", ".join([f"{k} = %s" for k in schedule_data.keys()])
        values = list(schedule_data.values()) + [schedule_id_str]
        cur = self.conn.execute(
            f"UPDATE practice_schedules SET {set_clause} WHERE id = %s RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        return dict(row) if row else None

    def delete(self, schedule_id: UUID) -> bool:
        """練習スケジュールを削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        self.conn.execute("DELETE FROM practice_schedules WHERE id = %s", (schedule_id_str,))
        self.conn.commit()
        return True

    def find_with_details(self, schedule_id: UUID) -> dict[str, Any] | None:
        """スケジュール詳細（利用可能会場、セッション含む）を取得"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        row = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE id = %s",
            (schedule_id_str,),
        ).fetchone()
        if not row:
            return None

        schedule = dict(row)

        # 利用可能会場を取得
        venue_rows = self.conn.execute(
            """
            SELECT sav.*, v.id AS v_id, v.name AS v_name, v.campus AS v_campus,
                   v.address AS v_address
            FROM schedule_available_venues sav
            LEFT JOIN venues v ON sav.venue_id = v.id
            WHERE sav.schedule_id = %s
            """,
            (schedule_id_str,),
        ).fetchall()
        available_venues = []
        for vr in venue_rows:
            vd = dict(vr)
            vd["venues"] = {
                "id": vd.pop("v_id", None),
                "name": vd.pop("v_name", None),
                "campus": vd.pop("v_campus", None),
                "address": vd.pop("v_address", None),
            }
            available_venues.append(vd)
        schedule["available_venues"] = available_venues

        # セッション情報を取得
        session_rows = self.conn.execute(
            "SELECT * FROM sessions WHERE schedule_id = %s",
            (schedule_id_str,),
        ).fetchall()
        sessions = [dict(sr) for sr in session_rows]

        # 各セッションに指導者情報を追加
        for session in sessions:
            instr_rows = self.conn.execute(
                """
                SELECT si.*, a.status AS attendance_status, u.email AS user_email, u.id AS user_id_ref
                FROM session_instructors si
                LEFT JOIN practice_user_attendance a ON si.attendance_id = a.id
                LEFT JOIN users u ON a.user_id = u.id
                WHERE si.session_id = %s
                """,
                (str(session["id"]),),
            ).fetchall()
            session["instructors"] = [dict(ir) for ir in instr_rows]

        schedule["sessions"] = sessions
        return schedule

    def find_for_display(self, schedule_id: UUID) -> dict[str, Any] | None:
        """練習表表示用の詳細データを取得（名前情報を含む）"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        row = self.conn.execute(
            "SELECT * FROM practice_schedules WHERE id = %s",
            (schedule_id_str,),
        ).fetchone()
        if not row:
            return None

        schedule = dict(row)

        # 利用可能会場を取得（会場名含む）
        venue_rows = self.conn.execute(
            """
            SELECT sav.id, sav.is_preferred, sav.priority, sav.notes, sav.venue_id,
                   v.id AS v_id, v.name AS v_name
            FROM schedule_available_venues sav
            LEFT JOIN venues v ON sav.venue_id = v.id
            WHERE sav.schedule_id = %s
            ORDER BY sav.priority
            """,
            (schedule_id_str,),
        ).fetchall()
        available_venues = []
        for vr in venue_rows:
            vd = dict(vr)
            available_venues.append({
                "id": vd["id"],
                "venue_id": vd.get("v_id") or vd.get("venue_id"),
                "name": vd.get("v_name") or "不明な会場",
                "is_preferred": vd.get("is_preferred", False),
                "priority": vd.get("priority", 0),
                "notes": vd.get("notes"),
            })
        schedule["available_venues"] = available_venues

        # セッション情報を取得（部署名、会場名、含む）
        session_rows = self.conn.execute(
            """
            SELECT s.id, s.title, s.slot_order, s.priority, s.part_id,
                   s.schedule_available_venue_id,
                   p.id AS p_id, p.name AS p_name
            FROM sessions s
            LEFT JOIN parts p ON s.part_id = p.id
            WHERE s.schedule_id = %s
            ORDER BY s.slot_order
            """,
            (schedule_id_str,),
        ).fetchall()
        sessions = []
        for sr in session_rows:
            sd = dict(sr)
            part_name = sd.get("p_name")
            venue_name = None
            if sd.get("schedule_available_venue_id"):
                for venue in available_venues:
                    if str(venue["id"]) == str(sd["schedule_available_venue_id"]):
                        venue_name = venue["name"]
                        break
            sessions.append({
                "id": sd["id"],
                "title": sd["title"],
                "slot_order": sd["slot_order"],
                "priority": sd["priority"],
                "part_name": part_name,
                "venue_name": venue_name,
                "instructors": [],
            })

        schedule["sessions"] = sessions
        return schedule


class SessionRepository:
    """セッションのリポジトリクラス"""

    def __init__(self, conn: Conn):
        self.conn = conn
        self.table_name = "sessions"

    def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定されたスケジュールのセッションを取得（JOINでN+1問題を回避）"""
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

    def find_by_id(self, session_id: UUID) -> dict[str, Any] | None:
        """指定されたIDのセッションを取得"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        row = self.conn.execute(
            "SELECT * FROM sessions WHERE id = %s",
            (session_id_str,),
        ).fetchone()
        return dict(row) if row else None

    def create(self, session_data: dict[str, Any]) -> dict[str, Any]:
        """新しいセッションを作成"""
        logger.info(f"SessionRepository.create called with data: {session_data}")
        columns = list(session_data.keys())
        values = [session_data[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))
        col_str = ", ".join(columns)
        cur = self.conn.execute(
            f"INSERT INTO sessions ({col_str}) VALUES ({placeholders}) RETURNING *",
            values,
        )
        self.conn.commit()
        row = cur.fetchone()
        logger.info(f"Insert result: {dict(row) if row else None}")
        return dict(row)

    def update(self, session_id: UUID, session_data: dict[str, Any]) -> dict[str, Any] | None:
        """セッションを更新"""
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])

        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        if not session_data:
            return self.find_by_id(session_id_str)
        set_clause = ", ".join([f"{k} = %s" for k in session_data.keys()])
        values = list(session_data.values()) + [session_id_str]
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
        self.conn.execute("DELETE FROM sessions WHERE id = %s", (session_id_str,))
        self.conn.commit()
        return True

    def delete_by_schedule(self, schedule_id: UUID) -> bool:
        """指定されたスケジュールのセッションをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        self.conn.execute("DELETE FROM sessions WHERE schedule_id = %s", (schedule_id_str,))
        self.conn.commit()
        return True
