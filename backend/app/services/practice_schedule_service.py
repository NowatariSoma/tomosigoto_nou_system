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

    async def get_practice_schedule_ideal_format_by_date(self, target_date: str) -> Dict[str, Any]:
        """指定した日付の練習スケジュールを理想的な形式で取得"""
        # 基本スケジュール情報を取得
        schedule = await self.practice_schedule_repository.find_by_date(target_date)
        if not schedule:
            return None

        # セッション情報を安全に取得（エラーが発生した場合は空のリストを使用）
        sessions = []
        try:
            sessions = await self.session_repository.find_by_schedule(schedule["id"])
        except Exception as e:
            print(f"Warning: Could not fetch sessions for schedule {schedule['id']}: {e}")
            sessions = []

        # 基本スケジュール情報とセッション情報から理想形式を生成
        return self._convert_basic_to_ideal_format_with_sessions(schedule, sessions)

    def _convert_to_ideal_format(self, display_data: Dict[str, Any]) -> Dict[str, Any]:
        """表示用データを理想的な形式に変換"""
        # 基本情報
        schedule_info = {
            "id": display_data["id"],
            "schedule_date": str(display_data["schedule_date"]),
            "start_time": str(display_data["start_time"]),
            "end_time": str(display_data["end_time"]),
            "description": display_data.get("description", "")
        }

        # 会場情報を変換
        venues = []
        colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]
        for i, venue in enumerate(display_data.get("available_venues", [])):
            venues.append({
                "id": f"venue-{venue.get('id', i+1)}",
                "name": venue.get("name", f"会場{i+1}"),
                "priority": venue.get("priority", i+1),
                "color": colors[i % len(colors)]
            })

        # 時間スケジュールを生成
        time_schedule = {}
        
        # 9:00から17:00まで30分刻みで時間スロットを生成
        start_hour = 9
        end_hour = 17
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                time_schedule[time_str] = {}
                
                # 各会場を初期化
                for venue in venues:
                    time_schedule[time_str][venue["id"]] = []

        # セッションを時間スロットに配置
        part_colors = ["#FFD700", "#87CEEB", "#98FB98", "#DDA0DD", "#F7DC6F", "#BB8FCE"]
        part_counter = {}
        
        for session in display_data.get("sessions", []):
            session_start = str(session.get("start_time", "09:00"))[:5]  # HH:MM形式
            
            # パート名を生成（part_idベース）
            part_id = session.get("part_id", "unknown")
            if part_id not in part_counter:
                part_counter[part_id] = len(part_counter)
            
            part_index = part_counter[part_id]
            part_name = f"パート{part_index + 1}"
            
            # 指導者名を取得（実際のユーザー名または仮の名前）
            instructors = []
            for instructor in session.get("instructors", []):
                # 実際のユーザー名があれば使用、なければ仮の名前
                instructors.append(f"指導者{len(instructors) + 1}")

            # セッション情報を作成
            session_info = {
                "part_id": part_id,
                "part_name": part_name,
                "part_color": part_colors[part_index % len(part_colors)],
                "session_title": session.get("title", "練習"),
                "instructors": instructors if instructors else ["未割当"],
                "participants": 5,  # 仮の参加者数
                "status": "confirmed"
            }

            # 時間スロットが存在する場合に配置
            if session_start in time_schedule:
                # 最初の会場に配置（実際の会場割り当てロジックは将来実装）
                if venues:
                    venue_id = venues[part_index % len(venues)]["id"]
                    time_schedule[session_start][venue_id].append(session_info)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    def _convert_to_ideal_format_simple(self, schedule: Dict[str, Any], details_data: Dict[str, Any]) -> Dict[str, Any]:
        """実データを理想的な形式に変換（シンプル版）"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "description": schedule.get("description", "練習")
        }

        # 会場情報（実データから取得、なければデフォルト）
        venues = []
        colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]
        available_venues = details_data.get("available_venues", [])
        
        if available_venues:
            for i, venue in enumerate(available_venues):
                venues.append({
                    "id": f"venue-{i+1}",
                    "name": venue.get("venues", {}).get("name", f"会場{i+1}") if isinstance(venue.get("venues"), dict) else f"会場{i+1}",
                    "priority": venue.get("priority", i+1),
                    "color": colors[i % len(colors)]
                })
        else:
            # デフォルト会場
            venues = [
                {"id": "venue-1", "name": "メイン会場", "priority": 1, "color": "#FF6B6B"},
                {"id": "venue-2", "name": "サブ会場", "priority": 2, "color": "#4ECDC4"}
            ]

        # 時間スケジュールを生成
        time_schedule = {}
        start_hour = 9
        end_hour = 17
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                time_schedule[time_str] = {}
                for venue in venues:
                    time_schedule[time_str][venue["id"]] = []

        # セッションを配置
        part_colors = ["#FFD700", "#87CEEB", "#98FB98", "#DDA0DD", "#F7DC6F"]
        sessions = details_data.get("sessions", [])
        
        for i, session in enumerate(sessions):
            session_start = str(session.get("start_time", "09:00"))[:5]
            
            if session_start in time_schedule:
                venue_id = venues[i % len(venues)]["id"]
                
                session_info = {
                    "part_id": f"part-{i+1}",
                    "part_name": session.get("title", f"パート{i+1}"),
                    "part_color": part_colors[i % len(part_colors)],
                    "session_title": session.get("title", "練習"),
                    "instructors": [f"指導者{i+1}"],
                    "participants": 5,
                    "status": "confirmed"
                }
                
                time_schedule[session_start][venue_id].append(session_info)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    def _convert_basic_to_ideal_format(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        """基本スケジュールデータから理想的な形式に変換"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "description": schedule.get("description", "練習")
        }

        # デフォルト会場情報
        venues = [
            {
                "id": "venue-1",
                "name": "今出川キャンパス 良心館ｄ",
                "priority": 1,
                "color": "#FF6B6B"
            },
            {
                "id": "venue-2", 
                "name": "今出川キャンパス 至誠館",
                "priority": 2,
                "color": "#4ECDC4"
            }
        ]

        # 時間スケジュールを生成
        time_schedule = {}
        start_hour = 9
        end_hour = 17
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                time_schedule[time_str] = {}
                for venue in venues:
                    time_schedule[time_str][venue["id"]] = []

        # 実際のスケジュール時間に基づいてサンプルセッションを配置
        schedule_start = str(schedule.get("start_time", "09:00"))[:5]
        schedule_description = schedule.get("description", "練習")
        
        if schedule_start in time_schedule:
            # 実データに基づくセッション情報
            session_info_1 = {
                "part_id": "part-1",
                "part_name": f"{schedule_description} - 前半",
                "part_color": "#FFD700",
                "session_title": schedule_description,
                "instructors": ["指導者A"],
                "participants": 5,
                "status": "confirmed"
            }
            
            session_info_2 = {
                "part_id": "part-2",
                "part_name": f"{schedule_description} - 後半",
                "part_color": "#87CEEB",
                "session_title": schedule_description,
                "instructors": ["指導者B"],
                "participants": 8,
                "status": "confirmed"
            }
            
            time_schedule[schedule_start]["venue-1"].append(session_info_1)
            time_schedule[schedule_start]["venue-2"].append(session_info_2)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    def _convert_basic_to_ideal_format_with_sessions(self, schedule: Dict[str, Any], sessions: list) -> Dict[str, Any]:
        """基本スケジュールデータとセッション情報から理想的な形式に変換"""
        # 基本情報
        schedule_info = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "description": schedule.get("description", "練習")
        }

        # デフォルト会場情報
        venues = [
            {
                "id": "venue-1",
                "name": "今出川キャンパス 良心館ｄ",
                "priority": 1,
                "color": "#FF6B6B"
            },
            {
                "id": "venue-2", 
                "name": "今出川キャンパス 至誠館",
                "priority": 2,
                "color": "#4ECDC4"
            }
        ]

        # 時間スケジュールを生成
        time_schedule = {}
        start_hour = 9
        end_hour = 17
        
        for hour in range(start_hour, end_hour):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                time_schedule[time_str] = {}
                for venue in venues:
                    time_schedule[time_str][venue["id"]] = []

        # 実際のセッションデータを配置（slot_order順）
        part_colors = ["#FFD700", "#87CEEB", "#98FB98", "#DDA0DD", "#F7DC6F", "#BB8FCE"]
        
        if sessions:
            # slot_orderでソート済みのセッションを処理
            for session in sessions:
                slot_order = session.get("slot_order", 1)
                session_title = session.get("title", "練習")
                
                # slot_orderに基づいて時間スロットを決定
                # slot_order 1 = 09:00, 2 = 09:30, 3 = 10:00, etc.
                start_hour = 9 + ((slot_order - 1) // 2)
                start_minute = 30 * ((slot_order - 1) % 2)
                time_str = f"{start_hour:02d}:{start_minute:02d}"
                
                if time_str in time_schedule:
                    # 会場を循環的に割り当て
                    venue_index = (slot_order - 1) % len(venues)
                    venue_id = venues[venue_index]["id"]
                    
                    session_info = {
                        "part_id": str(session.get("id", f"part-{slot_order}")),
                        "part_name": session_title,
                        "part_color": part_colors[(slot_order - 1) % len(part_colors)],
                        "session_title": session_title,
                        "instructors": [f"指導者{slot_order}"],  # 実際の指導者データは後で実装
                        "participants": 5,
                        "status": "confirmed",
                        "slot_order": slot_order
                    }
                    
                    time_schedule[time_str][venue_id].append(session_info)
        else:
            # セッションデータがない場合、基本スケジュール情報から生成
            schedule_start = str(schedule.get("start_time", "09:00"))[:5]
            schedule_description = schedule.get("description", "練習")
            
            if schedule_start in time_schedule:
                session_info_1 = {
                    "part_id": "part-1",
                    "part_name": f"{schedule_description} - 前半",
                    "part_color": "#FFD700",
                    "session_title": schedule_description,
                    "instructors": ["指導者A"],
                    "participants": 5,
                    "status": "confirmed"
                }
                
                session_info_2 = {
                    "part_id": "part-2",
                    "part_name": f"{schedule_description} - 後半",
                    "part_color": "#87CEEB",
                    "session_title": schedule_description,
                    "instructors": ["指導者B"],
                    "participants": 8,
                    "status": "confirmed"
                }
                
                time_schedule[schedule_start]["venue-1"].append(session_info_1)
                time_schedule[schedule_start]["venue-2"].append(session_info_2)

        return {
            "schedule_info": schedule_info,
            "venues": venues,
            "time_schedule": time_schedule
        }

    async def get_practice_schedule_details_by_id(self, schedule_id: UUID) -> Dict[str, Any]:
        """指定したIDの練習スケジュールの詳細情報を取得"""
        # 基本スケジュール情報を取得
        schedule = await self.practice_schedule_repository.find_by_id(schedule_id)
        if not schedule:
            return None

        # セッション情報を安全に取得
        sessions = []
        try:
            sessions = await self.session_repository.find_by_schedule(schedule_id)
        except Exception as e:
            print(f"Warning: Could not fetch sessions for schedule {schedule_id}: {e}")
            sessions = []

        # 詳細形式に変換
        return self._convert_to_details_format(schedule, sessions)

    def _convert_to_details_format(self, schedule: Dict[str, Any], sessions: list) -> Dict[str, Any]:
        """基本スケジュールデータとセッション情報から詳細形式に変換"""
        # 基本情報
        result = {
            "id": str(schedule["id"]),
            "schedule_date": str(schedule["schedule_date"]),
            "start_time": str(schedule["start_time"]),
            "end_time": str(schedule["end_time"]),
            "description": schedule.get("description", "練習"),
            "schedule_type": schedule.get("schedule_type", "regular"),
            "status": schedule.get("status", "active"),
            "created_at": str(schedule.get("created_at", "")),
            "updated_at": str(schedule.get("updated_at", "")),
            "created_by": schedule.get("created_by"),
            "updated_by": schedule.get("updated_by")
        }

        # 利用可能会場情報（デフォルト）
        result["available_venues"] = [
            {
                "id": "venue-1",
                "schedule_id": str(schedule["id"]),
                "venue_id": "venue-1-id",
                "is_preferred": True,
                "priority": 1,
                "notes": "主要練習会場"
            },
            {
                "id": "venue-2",
                "schedule_id": str(schedule["id"]),
                "venue_id": "venue-2-id",
                "is_preferred": False,
                "priority": 2,
                "notes": "代替会場"
            }
        ]

        # セッション情報を変換
        result["sessions"] = []
        for session in sessions:
            session_info = {
                "id": str(session.get("id", "")),
                "schedule_id": str(schedule["id"]),
                "part_id": str(session.get("part_id", "")),
                "title": session.get("title", "練習"),
                "start_time": str(session.get("start_time", "09:00:00")),
                "end_time": str(session.get("end_time", "10:00:00")),
                "schedule_available_venues": None,
                "priority": session.get("priority", 0),
                "slot_order": session.get("slot_order", 1),
                "created_at": str(session.get("created_at", "")),
                "updated_at": str(session.get("updated_at", "")),
                "instructors": []  # 指導者情報は後で実装
            }
            result["sessions"].append(session_info)

        return result