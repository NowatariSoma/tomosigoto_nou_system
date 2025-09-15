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
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定されたIDの練習スケジュールを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", schedule_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_date")
    async def find_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定された日付の練習スケジュールを取得"""
        response = self.client.table(self.table_name).select("*").eq("schedule_date", target_date).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しい練習スケジュールを作成"""
        response = self.client.table(self.table_name).insert(schedule_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, schedule_id: UUID, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習スケジュールを更新"""
        response = (
            self.client.table(self.table_name)
            .update(schedule_data)
            .eq("id", schedule_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, schedule_id: UUID) -> bool:
        """練習スケジュールを削除"""
        self.client.table(self.table_name).delete().eq("id", schedule_id).execute()
        return True

    @handle_supabase_errors("find_with_details")
    async def find_with_details(self, schedule_id: UUID) -> Dict[str, Any]:
        """スケジュール詳細（利用可能会場、セッション含む）を取得"""
        # 練習スケジュール本体
        schedule_response = self.client.table(self.table_name).select("*").eq("id", schedule_id).execute()

        if not schedule_response.data:
            return None

        schedule = schedule_response.data[0]

        # 利用可能会場を取得
        venues_response = (
            self.client.table("schedule_available_venues")
            .select("*, venues(*)")
            .eq("schedule_id", schedule_id)
            .execute()
        )
        schedule["available_venues"] = venues_response.data

        # セッション情報を取得
        sessions_response = (
            self.client.table("sessions")
            .select("*")
            .eq("schedule_id", schedule_id)
            .execute()
        )

        sessions = sessions_response.data

        # 各セッションに指導者情報を追加
        for session in sessions:
            instructors_response = (
                self.client.table("session_instructors")
                .select("*, users(*)")
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
        schedule_response = self.client.table(self.table_name).select("*").eq("id", schedule_id).execute()

        if not schedule_response.data:
            return None

        schedule = schedule_response.data[0]

        # 利用可能会場を取得（会場名含む）
        venues_response = (
            self.client.table("schedule_available_venues")
            .select("id, is_preferred, priority, notes, venues(id, name)")
            .eq("schedule_id", schedule_id)
            .order("priority")
            .execute()
        )

        # 会場データを整形
        available_venues = []
        for venue_data in venues_response.data:
            venue_info = venue_data.get("venues", {})
            available_venues.append({
                "id": venue_data["id"],
                "venue_id": venue_info.get("id"),
                "name": venue_info.get("name", "不明な会場"),
                "is_preferred": venue_data.get("is_preferred", False),
                "priority": venue_data.get("priority", 0),
                "notes": venue_data.get("notes")
            })

        schedule["available_venues"] = available_venues

        # セッション情報を取得（部署名、会場名、指導者名含む）
        sessions_response = (
            self.client.table("sessions")
            .select("""
                id, title, start_time, end_time, priority, part_id,
                schedule_available_venues,
                parts(id, name),
                session_instructors(
                    id, user_id,
                    users(id, name, email)
                )
            """)
            .eq("schedule_id", schedule_id)
            .order("priority")
            .execute()
        )

        # セッションデータを整形
        sessions = []
        for session_data in sessions_response.data:
            # 部署名を取得
            part_info = session_data.get("parts", {})
            part_name = part_info.get("name") if part_info else None

            # 会場名を取得（schedule_available_venuesから）
            venue_name = None
            if session_data.get("schedule_available_venues"):
                for venue in available_venues:
                    if venue["id"] == session_data["schedule_available_venues"]:
                        venue_name = venue["name"]
                        break

            # 指導者情報を整形
            instructors = []
            for instructor_data in session_data.get("session_instructors", []):
                user_info = instructor_data.get("users", {})
                instructors.append({
                    "id": instructor_data["user_id"],
                    "name": user_info.get("name", "不明なユーザー"),
                    "email": user_info.get("email")
                })

            sessions.append({
                "id": session_data["id"],
                "title": session_data["title"],
                "start_time": session_data["start_time"],
                "end_time": session_data["end_time"],
                "priority": session_data["priority"],
                "part_name": part_name,
                "venue_name": venue_name,
                "instructors": instructors
            })

        schedule["sessions"] = sessions
        return schedule


class ScheduleAvailableVenueRepository:
    """スケジュール利用可能会場のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "schedule_available_venues"

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定されたスケジュールの利用可能会場を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*, venues(*)")
            .eq("schedule_id", schedule_id)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, venue_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいスケジュール利用可能会場を作成"""
        response = self.client.table(self.table_name).insert(venue_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, venue_id: UUID, venue_data: Dict[str, Any]) -> Dict[str, Any]:
        """スケジュール利用可能会場を更新"""
        response = (
            self.client.table(self.table_name)
            .update(venue_data)
            .eq("id", venue_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        self.client.table(self.table_name).delete().eq("id", venue_id).execute()
        return True

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> bool:
        """指定されたスケジュールの利用可能会場をすべて削除"""
        self.client.table(self.table_name).delete().eq("schedule_id", schedule_id).execute()
        return True


class SessionRepository:
    """セッションのリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "sessions"

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定されたスケジュールのセッションを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", schedule_id)
            .order("priority", desc=False)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, session_id: UUID) -> Dict[str, Any]:
        """指定されたIDのセッションを取得"""
        response = self.client.table(self.table_name).select("*").eq("id", session_id).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッションを作成"""
        response = self.client.table(self.table_name).insert(session_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, session_id: UUID, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッションを更新"""
        response = (
            self.client.table(self.table_name)
            .update(session_data)
            .eq("id", session_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, session_id: UUID) -> bool:
        """セッションを削除"""
        self.client.table(self.table_name).delete().eq("id", session_id).execute()
        return True

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> bool:
        """指定されたスケジュールのセッションをすべて削除"""
        self.client.table(self.table_name).delete().eq("schedule_id", schedule_id).execute()
        return True


class SessionInstructorRepository:
    """セッション指導者のリポジトリクラス"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "session_instructors"

    @handle_supabase_errors("find_by_session")
    async def find_by_session(self, session_id: UUID) -> List[Dict[str, Any]]:
        """指定されたセッションの指導者を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*, users(*)")
            .eq("session_id", session_id)
            .execute()
        )
        return response.data

    @handle_supabase_errors("create")
    async def create(self, instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッション指導者を作成"""
        response = self.client.table(self.table_name).insert(instructor_data).execute()
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, instructor_id: UUID) -> bool:
        """セッション指導者を削除"""
        self.client.table(self.table_name).delete().eq("id", instructor_id).execute()
        return True

    @handle_supabase_errors("delete_by_session")
    async def delete_by_session(self, session_id: UUID) -> bool:
        """指定されたセッションの指導者をすべて削除"""
        self.client.table(self.table_name).delete().eq("session_id", session_id).execute()
        return True

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> bool:
        """指定されたスケジュールの全セッションの指導者を削除"""
        # セッションIDを取得してから削除
        sessions_response = (
            self.client.table("sessions")
            .select("id")
            .eq("schedule_id", schedule_id)
            .execute()
        )

        session_ids = [session["id"] for session in sessions_response.data]

        if session_ids:
            self.client.table(self.table_name).delete().in_("session_id", session_ids).execute()

        return True