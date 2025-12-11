from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class PracticeScheduleRepository:
    """練習スケジュール関連のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "practice_schedules"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべての練習スケジュールを取得"""
        # Supabaseのデフォルトページネーション制限（1000件）を回避するため、
        # 明示的に大きなlimitを設定して全件取得する
        response = self.client.table(self.table_name).select("*").limit(10000).execute()
        return response.data

    @handle_supabase_errors("find_all_with_relations")
    async def find_all_with_relations(self) -> List[Dict[str, Any]]:
        """関連データ込みですべての練習スケジュールを取得"""
        response = (
            self.client.table(self.table_name)
            .select(
                """
                *,
                schedule_available_venues(
                    id,
                    venue_id,
                    is_preferred,
                    priority,
                    venues(id, name, campus)
                ),
                sessions(
                    id,
                    title,
                    slot_order,
                    schedule_available_venue_id,
                    part_id,
                    parts(id, name)
                )
                """
            )
            .order("schedule_date", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定されたIDの練習スケジュールを取得"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        print(f"DEBUG find_by_id: schedule_id={schedule_id}, schedule_id_str={schedule_id_str}")
        response = self.client.table(self.table_name).select("*").eq("id", schedule_id_str).execute()
        print(f"DEBUG find_by_id: response.data={response.data}")
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_date")
    async def find_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定された日付の練習スケジュールを取得"""
        response = self.client.table(self.table_name).select("*").eq("schedule_date", target_date).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_date_range")
    async def find_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """指定された日付範囲の練習スケジュールを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .gte("schedule_date", start_date)
            .lt("schedule_date", end_date)
            .order("schedule_date", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_date_range_with_relations")
    async def find_by_date_range_with_relations(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """日付範囲のスケジュールを関連データと一緒に取得（最適化版 - N+1問題を解決）

        このメソッドは1回のクエリで以下のデータを取得します：
        - 練習スケジュール本体
        - 会場情報（schedule_available_venues + venues）
        - セッション情報（sessions + parts）

        従来のfind_by_date_rangeの後に各スケジュールごとにループでクエリを実行していた
        N+1問題を解決します。
        """
        response = (
            self.client.table(self.table_name)
            .select("""
                *,
                schedule_available_venues(
                    id,
                    venue_id,
                    is_preferred,
                    priority,
                    venues(id, name, campus)
                ),
                sessions(
                    id,
                    title,
                    slot_order,
                    schedule_available_venue_id,
                    part_id,
                    parts(id, name)
                )
            """)
            .gte("schedule_date", start_date)
            .lt("schedule_date", end_date)
            .order("schedule_date", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しい練習スケジュールを作成"""
        # dateとtimeオブジェクトを文字列に変換
        if "schedule_date" in schedule_data:
            schedule_data["schedule_date"] = str(schedule_data["schedule_date"])
        if "start_time" in schedule_data:
            schedule_data["start_time"] = str(schedule_data["start_time"])
        if "end_time" in schedule_data:
            schedule_data["end_time"] = str(schedule_data["end_time"])
        # stage_idをUUIDから文字列に変換
        if "stage_id" in schedule_data and schedule_data["stage_id"] is not None:
            schedule_data["stage_id"] = str(schedule_data["stage_id"])

        # created_byとupdated_byを除外（データベースで自動設定される）
        schedule_data.pop("created_by", None)
        schedule_data.pop("updated_by", None)

        response = self.client.table(self.table_name).insert(schedule_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, schedule_id: UUID, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習スケジュールを更新"""
        # dateとtimeオブジェクトを文字列に変換
        if "schedule_date" in schedule_data:
            schedule_data["schedule_date"] = str(schedule_data["schedule_date"])
        if "start_time" in schedule_data:
            schedule_data["start_time"] = str(schedule_data["start_time"])
        if "end_time" in schedule_data:
            schedule_data["end_time"] = str(schedule_data["end_time"])
        # stage_idをUUIDから文字列に変換
        if "stage_id" in schedule_data and schedule_data["stage_id"] is not None:
            schedule_data["stage_id"] = str(schedule_data["stage_id"])

        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .update(schedule_data)
            .eq("id", schedule_id_str)
            .execute()
        )

        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, schedule_id: UUID) -> bool:
        """練習スケジュールを削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        self.client.table(self.table_name).delete().eq("id", schedule_id_str).execute()
        return True

    @handle_supabase_errors("find_with_details")
    async def find_with_details(self, schedule_id: UUID) -> Dict[str, Any]:
        """スケジュール詳細（利用可能会場、セッション含む）を取得"""
        # 練習スケジュール本体
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        schedule_response = self.client.table(self.table_name).select("*").eq("id", schedule_id_str).execute()

        if not schedule_response.data:
            return None

        schedule = schedule_response.data[0]

        # 利用可能会場を取得
        venues_response = (
            self.client.table("schedule_available_venues")
            .select("*, venues(*)")
            .eq("schedule_id", schedule_id_str)
            .execute()
        )
        schedule["available_venues"] = venues_response.data

        # セッション情報を取得
        sessions_response = (
            self.client.table("sessions")
            .select("*")
            .eq("schedule_id", schedule_id_str)
            .execute()
        )

        sessions = sessions_response.data

        # 各セッションに指導者情報を追加
        for session in sessions:
            instructors_response = (
                self.client.table("session_instructors")
                .select("*, practice_user_attendance(*, users(*))")
                .eq("session_id", session["id"])
                .execute()
            )
            session["instructors"] = instructors_response.data

        schedule["sessions"] = sessions
        return schedule

    @handle_supabase_errors("find_for_display")
    async def find_for_display(self, schedule_id: UUID) -> Dict[str, Any]:
        """練習表表示用の詳細データを取得（名前情報を含む）"""
        # 練習スケジュール本体
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        schedule_response = self.client.table(self.table_name).select("*").eq("id", schedule_id_str).execute()

        if not schedule_response.data:
            return None

        schedule = schedule_response.data[0]

        # 利用可能会場を取得（会場名含む）
        venues_response = (
            self.client.table("schedule_available_venues")
            .select("id, is_preferred, priority, notes, venues(id, name)")
            .eq("schedule_id", schedule_id_str)
            .order("priority")
            .execute()
        )

        # 会場データを整形
        available_venues = []
        for venue_data in venues_response.data:
            venue_info = venue_data.get("venues") or {}
            venue_id = venue_info.get("id") if venue_info else venue_data.get("venue_id")
            venue_name = venue_info.get("name") if venue_info else None
            available_venues.append({
                "id": venue_data["id"],
                "venue_id": venue_id,
                "name": venue_name or "不明な会場",
                "is_preferred": venue_data.get("is_preferred", False),
                "priority": venue_data.get("priority", 0),
                "notes": venue_data.get("notes")
            })

        schedule["available_venues"] = available_venues

        # セッション情報を取得（部署名、会場名、指導者名含む）
        sessions_response = (
            self.client.table("sessions")
            .select("""
                id, title, slot_order, priority, part_id,
                schedule_available_venue_id,
                parts(id, name)
            """)
            .eq("schedule_id", schedule_id_str)
            .order("slot_order")
            .execute()
        )

        # セッションデータを整形
        sessions = []
        for session_data in sessions_response.data:
            # 部署名を取得
            part_info = session_data.get("parts", {})
            part_name = part_info.get("name") if part_info else None

            # 会場名を取得（schedule_available_venue_idから）
            venue_name = None
            if session_data.get("schedule_available_venue_id"):
                for venue in available_venues:
                    if venue["id"] == session_data["schedule_available_venue_id"]:
                        venue_name = venue["name"]
                        break

            # 指導者情報は後で別途取得
            instructors = []

            sessions.append({
                "id": session_data["id"],
                "title": session_data["title"],
                "slot_order": session_data["slot_order"],
                "priority": session_data["priority"],
                "part_name": part_name,
                "venue_name": venue_name,
                "instructors": instructors
            })

        schedule["sessions"] = sessions
        return schedule


class SessionRepository:
    """セッションのリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "sessions"

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定されたスケジュールのセッションを取得（JOINでN+1問題を回避）"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .select(
                """
                *,
                parts(id, name)
                """
            )
            .eq("schedule_id", schedule_id_str)
            .order("slot_order", desc=False)
            .execute()
        )

        # パート名を取得して追加（JOIN済みデータを使用）
        formatted_data = []
        # JOINが失敗した場合のフォールバック用にパート情報をキャッシュ
        parts_cache = {}

        for item in response.data:
            formatted_item = dict(item)
            formatted_item["part_name"] = None

            # パート情報を取得（JOIN済みデータを使用）
            part_info = item.get("parts")
            if part_info and isinstance(part_info, dict):
                formatted_item["part_name"] = part_info.get("name")
            elif part_info and isinstance(part_info, list) and len(part_info) > 0:
                # リスト形式の場合（通常は発生しないが念のため）
                formatted_item["part_name"] = part_info[0].get("name")

            # JOINが失敗した場合のフォールバック: part_idから直接取得
            if formatted_item["part_name"] is None and item.get("part_id"):
                part_id = str(item["part_id"])
                if part_id not in parts_cache:
                    try:
                        part_response = self.client.table("parts").select("id, name").eq("id", part_id).execute()
                        if part_response.data:
                            parts_cache[part_id] = part_response.data[0].get("name")
                        else:
                            parts_cache[part_id] = None
                    except Exception as e:
                        print(f"Warning: Failed to fetch part {part_id}: {e}")
                        parts_cache[part_id] = None
                formatted_item["part_name"] = parts_cache.get(part_id)

            formatted_data.append(formatted_item)

        return formatted_data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, session_id: UUID) -> Dict[str, Any]:
        """指定されたIDのセッションを取得"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        response = self.client.table(self.table_name).select("*").eq("id", session_id_str).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッションを作成"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"SessionRepository.create called with data: {session_data}")
        logger.info(f"Table name: {self.table_name}")

        response = self.client.table(self.table_name).insert(session_data).execute()
        logger.info(f"Insert response: {response.data}")
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, session_id: UUID, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッションを更新"""
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])

        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        response = (
            self.client.table(self.table_name)
            .update(session_data)
            .eq("id", session_id_str)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, session_id: UUID) -> bool:
        """セッションを削除"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        self.client.table(self.table_name).delete().eq("id", session_id_str).execute()
        return True

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> bool:
        """指定されたスケジュールのセッションをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        self.client.table(self.table_name).delete().eq("schedule_id", schedule_id_str).execute()
        return True
