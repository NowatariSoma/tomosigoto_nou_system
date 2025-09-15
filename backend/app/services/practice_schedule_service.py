from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.practice_schedule_repository import (
    PracticeScheduleRepository,
    ScheduleAvailableVenueRepository,
    SessionRepository,
    SessionInstructorRepository,
)


class PracticeScheduleService:
    """練習スケジュール関連の機能を実装するクラス"""

    def __init__(
        self,
        practice_schedule_repository: PracticeScheduleRepository,
        schedule_available_venue_repository: ScheduleAvailableVenueRepository,
        session_repository: SessionRepository,
        session_instructor_repository: SessionInstructorRepository,
        auth_client,
    ):
        self.practice_schedule_repository = practice_schedule_repository
        self.schedule_available_venue_repository = schedule_available_venue_repository
        self.session_repository = session_repository
        self.session_instructor_repository = session_instructor_repository
        self.auth_client = auth_client

    # ===== 練習スケジュール CRUD =====

    async def get_all_practice_schedules(self) -> List[Dict[str, Any]]:
        """すべての練習スケジュールを取得"""
        return await self.practice_schedule_repository.find_all()

    async def get_practice_schedule(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定した練習スケジュール情報を取得"""
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        return schedule

    async def get_practice_schedule_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定した日付の練習スケジュール情報を取得"""
        schedule = await self.practice_schedule_repository.find_by_date(target_date)
        return schedule  # None を返すことで、エンドポイント側で404を返す

    async def get_practice_schedule_with_details(self, schedule_id: UUID) -> Dict[str, Any]:
        """練習スケジュールの詳細情報（利用可能会場、セッション含む）を取得"""
        schedule = await self.practice_schedule_repository.find_with_details(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        return schedule

    async def get_practice_schedule_for_display(self, schedule_id: UUID) -> Dict[str, Any]:
        """練習表表示用の練習スケジュール情報を取得（名前情報含む）"""
        schedule = await self.practice_schedule_repository.find_for_display(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)
        return schedule

    async def create_practice_schedule(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """練習スケジュールを作成"""
        return await self.practice_schedule_repository.create(schedule_data)

    async def update_practice_schedule(
        self, schedule_id: UUID, schedule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """指定した練習スケジュール情報を更新"""
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

        return await self.practice_schedule_repository.update(schedule_id, schedule_data)

    async def remove_practice_schedule(self, schedule_id: UUID) -> bool:
        """指定した練習スケジュールを削除"""
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

        # 関連データを削除
        await self.session_instructor_repository.delete_by_schedule(schedule_id)
        await self.session_repository.delete_by_schedule(schedule_id)
        await self.schedule_available_venue_repository.delete_by_schedule(schedule_id)

        # 練習スケジュール本体を削除
        await self.practice_schedule_repository.delete(schedule_id)

        return True

    # ===== スケジュール利用可能会場 CRUD =====

    async def get_schedule_available_venues(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールの利用可能会場を取得"""
        return await self.schedule_available_venue_repository.find_by_schedule(schedule_id)

    async def add_schedule_available_venue(
        self, venue_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """スケジュールに利用可能会場を追加"""
        return await self.schedule_available_venue_repository.create(venue_data)

    async def update_schedule_available_venue(
        self, venue_id: UUID, venue_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """スケジュール利用可能会場を更新"""
        return await self.schedule_available_venue_repository.update(venue_id, venue_data)

    async def remove_schedule_available_venue(self, venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        await self.schedule_available_venue_repository.delete(venue_id)
        return True

    # ===== セッション CRUD =====

    async def get_sessions_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールのセッション一覧を取得"""
        sessions = await self.session_repository.find_by_schedule(schedule_id)

        # 各セッションに指導者情報を追加
        for session in sessions:
            instructors = await self.session_instructor_repository.find_by_session(
                session["id"]
            )
            session["instructors"] = instructors

        return sessions

    async def get_session(self, session_id: UUID) -> Dict[str, Any]:
        """指定したセッション情報を取得"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        # 指導者情報を追加
        instructors = await self.session_instructor_repository.find_by_session(session_id)
        session["instructors"] = instructors

        return session

    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッションを作成"""
        return await self.session_repository.create(session_data)

    async def update_session(
        self, session_id: UUID, session_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """指定したセッション情報を更新"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        return await self.session_repository.update(session_id, session_data)

    async def remove_session(self, session_id: UUID) -> bool:
        """指定したセッションを削除"""
        session = await self.session_repository.find_by_id(session_id)
        if not session:
            raise APIException(ErrorMessage.SESSION_NOT_FOUND)

        # 関連する指導者情報を削除
        await self.session_instructor_repository.delete_by_session(session_id)

        # セッション本体を削除
        await self.session_repository.delete(session_id)

        return True

    # ===== セッション指導者 CRUD =====

    async def get_session_instructors(self, session_id: UUID) -> List[Dict[str, Any]]:
        """指定したセッションの指導者一覧を取得"""
        return await self.session_instructor_repository.find_by_session(session_id)

    async def add_session_instructor(
        self, instructor_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """セッションに指導者を追加"""
        return await self.session_instructor_repository.create(instructor_data)

    async def remove_session_instructor(self, instructor_id: UUID) -> bool:
        """セッション指導者を削除"""
        await self.session_instructor_repository.delete(instructor_id)
        return True

    # ===== 複合操作 =====

    async def create_practice_schedule_with_details(
        self, schedule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """練習スケジュールを関連データと一緒に作成"""
        # 練習スケジュール本体を作成
        base_schedule_data = {
            "schedule_date": schedule_data["schedule_date"],
            "start_time": schedule_data["start_time"],
            "end_time": schedule_data["end_time"],
            "description": schedule_data.get("description"),
            "schedule_type": schedule_data.get("schedule_type"),
            "status": schedule_data.get("status", "active"),
            "created_by": schedule_data.get("created_by"),
            "updated_by": schedule_data.get("updated_by"),
        }

        created_schedule = await self.practice_schedule_repository.create(base_schedule_data)
        schedule_id = created_schedule["id"]

        # 利用可能会場を追加
        if "available_venues" in schedule_data:
            for venue_data in schedule_data["available_venues"]:
                venue_data["schedule_id"] = schedule_id
                await self.schedule_available_venue_repository.create(venue_data)

        # セッションを追加
        if "sessions" in schedule_data:
            for session_data in schedule_data["sessions"]:
                session_data["schedule_id"] = schedule_id
                instructors_data = session_data.pop("instructors", [])

                created_session = await self.session_repository.create(session_data)
                session_id = created_session["id"]

                # 指導者を追加
                for instructor_data in instructors_data:
                    instructor_data["session_id"] = session_id
                    await self.session_instructor_repository.create(instructor_data)

        # 作成された詳細情報を返す
        return await self.get_practice_schedule_with_details(schedule_id)

    async def update_practice_schedule_with_details(
        self, schedule_id: UUID, schedule_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """練習スケジュールを関連データと一緒に更新"""
        # 練習スケジュール存在確認
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            raise APIException(ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND)

        # 練習スケジュール本体を更新
        base_schedule_data = {
            k: v
            for k, v in schedule_data.items()
            if k in ["schedule_date", "start_time", "end_time", "description", "schedule_type", "status", "updated_by"]
        }

        if base_schedule_data:
            await self.practice_schedule_repository.update(schedule_id, base_schedule_data)

        # 利用可能会場を更新（既存を削除して再作成）
        if "available_venues" in schedule_data:
            await self.schedule_available_venue_repository.delete_by_schedule(schedule_id)
            for venue_data in schedule_data["available_venues"]:
                venue_data["schedule_id"] = schedule_id
                await self.schedule_available_venue_repository.create(venue_data)

        # セッションを更新（既存を削除して再作成）
        if "sessions" in schedule_data:
            await self.session_instructor_repository.delete_by_schedule(schedule_id)
            await self.session_repository.delete_by_schedule(schedule_id)

            for session_data in schedule_data["sessions"]:
                session_data["schedule_id"] = schedule_id
                instructors_data = session_data.pop("instructors", [])

                created_session = await self.session_repository.create(session_data)
                session_id = created_session["id"]

                # 指導者を追加
                for instructor_data in instructors_data:
                    instructor_data["session_id"] = session_id
                    await self.session_instructor_repository.create(instructor_data)

        # 更新された詳細情報を返す
        return await self.get_practice_schedule_with_details(schedule_id)