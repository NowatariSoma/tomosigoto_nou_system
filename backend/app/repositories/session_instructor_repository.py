"""
セッション指導者のデータアクセス層
"""
from typing import Any
from uuid import UUID
from enum import Enum

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class SessionInstructorRepository:
    """セッション指導者のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
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

    @handle_supabase_errors("find_all")
    async def find_all(self) -> list[dict[str, Any]]:
        """すべてのセッション指導者を取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_all_with_details")
    async def find_all_with_details(
        self, 
        limit: int = 20, 
        offset: int = 0,
        schedule_id: UUID | None = None,
        slot_order: int | None = None
    ) -> list[dict[str, Any]]:
        """詳細情報付きでセッション指導者を取得（JOINクエリでN+1問題を解決）"""
        # JOINクエリで一度に全ての関連データを取得
        select_query = """
            *,
            practice_user_attendance!inner(
                status,
                users(
                    id,
                    email,
                    name,
                    user_profiles(
                        first_name_kanji,
                        last_name_kanji
                    )
                )
            ),
            practice_schedules!inner(
                schedule_date,
                title,
                start_time,
                end_time
            ),
            schedule_available_venues(
                venues(
                    name,
                    address
                )
            )
        """
        
        query = self.client.table(self.table_name).select(select_query)
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if slot_order:
            query = query.eq("slot_order", slot_order)
        
        # ページネーション
        query = query.range(offset, offset + limit - 1)
        
        import time
        start_time = time.time()
        try:
            response = query.execute()
            elapsed = time.time() - start_time
            print(f"DEBUG: JOINクエリ実行時間: {elapsed:.3f}秒, 取得件数: {len(response.data)}")
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"DEBUG: JOINクエリエラー ({elapsed:.3f}秒): {e}")
            raise
        
        # パート情報を一括取得（schedule_idとslot_orderの組み合わせで）
        schedule_slot_pairs = set()
        for item in response.data:
            schedule_slot_pairs.add((item["schedule_id"], item["slot_order"]))
        
        # sessionsとpartsを一括取得
        sessions_map = {}
        if schedule_slot_pairs:
            sessions_query = self.client.table("sessions").select("schedule_id, slot_order, part_id, parts(name)")
            if schedule_id:
                sessions_query = sessions_query.eq("schedule_id", str(schedule_id))
            sessions_response = sessions_query.execute()
            
            for session in sessions_response.data:
                key = (session["schedule_id"], session["slot_order"])
                if key in schedule_slot_pairs:
                    sessions_map[key] = session
        
        # データを整形
        formatted_data = []
        for item in response.data:
            formatted_item = {
                "id": item["id"],
                "attendance_id": item["attendance_id"],
                "schedule_id": item["schedule_id"],
                "schedule_available_venue_id": item.get("schedule_available_venue_id"),
                "slot_order": item["slot_order"],
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
                # デフォルト値
                "user_name": None,
                "user_email": None,
                "attendance_status": None,
                "schedule_date": None,
                "schedule_title": None,
                "schedule_start_time": None,
                "schedule_end_time": None,
                "venue_name": None,
                "venue_address": None,
                "part_name": None,
            }
            
            # 出席者情報を処理
            attendance_data = item.get("practice_user_attendance")
            if attendance_data:
                formatted_item["attendance_status"] = attendance_data.get("status")
                user_data = attendance_data.get("users")
                if user_data:
                    formatted_item["user_email"] = user_data.get("email")
                    
                    # ユーザー名を取得（プロフィール優先、なければ英語名）
                    profile_data = user_data.get("user_profiles")
                    if profile_data and isinstance(profile_data, list) and len(profile_data) > 0:
                        profile = profile_data[0]
                        first_name_kanji = profile.get("first_name_kanji")
                        last_name_kanji = profile.get("last_name_kanji")
                        if first_name_kanji and last_name_kanji:
                            formatted_item["user_name"] = f"{last_name_kanji} {first_name_kanji}"
                        elif first_name_kanji:
                            formatted_item["user_name"] = first_name_kanji
                        elif last_name_kanji:
                            formatted_item["user_name"] = last_name_kanji
                        else:
                            formatted_item["user_name"] = user_data.get("name")
                    else:
                        formatted_item["user_name"] = user_data.get("name")
            
            # スケジュール情報を処理
            schedule_data = item.get("practice_schedules")
            if schedule_data:
                formatted_item["schedule_date"] = schedule_data.get("schedule_date")
                formatted_item["schedule_title"] = schedule_data.get("title")
                formatted_item["schedule_start_time"] = schedule_data.get("start_time")
                formatted_item["schedule_end_time"] = schedule_data.get("end_time")
            
            # パート情報を処理（sessions_mapから取得）
            session_key = (item["schedule_id"], item["slot_order"])
            session_info = sessions_map.get(session_key)
            if session_info:
                parts_data = session_info.get("parts")
                if parts_data and isinstance(parts_data, list) and len(parts_data) > 0:
                    formatted_item["part_name"] = parts_data[0].get("name")
                elif isinstance(parts_data, dict):
                    formatted_item["part_name"] = parts_data.get("name")
            
            # 会場情報を処理
            venue_data = item.get("schedule_available_venues")
            if venue_data:
                venues_info = venue_data.get("venues") if isinstance(venue_data, dict) else None
                if not venues_info and isinstance(venue_data, list) and len(venue_data) > 0:
                    venues_info = venue_data[0].get("venues")
                
                if venues_info:
                    if isinstance(venues_info, list) and len(venues_info) > 0:
                        venue = venues_info[0]
                    elif isinstance(venues_info, dict):
                        venue = venues_info
                    else:
                        venue = None
                    
                    if venue:
                        formatted_item["venue_name"] = venue.get("name")
                        formatted_item["venue_address"] = venue.get("address")
            
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("count_all")
    async def count_all(
        self,
        schedule_id: UUID | None = None,
        slot_order: int | None = None
    ) -> int:
        """セッション指導者の総件数を取得"""
        query = self.client.table(self.table_name).select("id", count="exact")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if slot_order:
            query = query.eq("slot_order", slot_order)
        
        response = query.execute()
        return response.count

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, session_instructor_id: UUID) -> dict[str, Any] | None:
        """指定したIDのセッション指導者を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(session_instructor_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> list[dict[str, Any]]:
        """指定したスケジュールの指導者一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", str(schedule_id))
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_schedule_and_slot")
    async def find_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> list[dict[str, Any]]:
        """指定したスケジュールとコマの指導者一覧を取得（詳細情報付き）"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", str(schedule_id))
            .eq("slot_order", slot_order)
            .execute()
        )
        
        # データを整形し、関連データを個別に取得
        formatted_data = []
        for item in response.data:
            formatted_item = {
                "id": item["id"],
                "attendance_id": item["attendance_id"],
                "schedule_id": item["schedule_id"],
                "schedule_available_venue_id": item.get("schedule_available_venue_id"),
                "slot_order": item["slot_order"],
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
                # デフォルト値
                "user_name": None,
                "user_email": None,
                "attendance_status": None,
                "part_name": None,
            }
            
            # 出席者情報を取得
            try:
                attendance_response = self.client.table("practice_user_attendance").select("*, users(*)").eq("id", item["attendance_id"]).execute()
                if attendance_response.data:
                    attendance_data = attendance_response.data[0]
                    formatted_item["attendance_status"] = attendance_data.get("status")
                    if attendance_data.get("users"):
                        user_data = attendance_data["users"]
                        formatted_item["user_email"] = user_data.get("email")
                        
                        # ユーザープロフィールを個別に取得
                        try:
                            profile_response = self.client.table("user_profiles").select("first_name_kanji, last_name_kanji").eq("user_id", user_data["id"]).execute()
                            if profile_response.data:
                                profile_data = profile_response.data[0]
                                first_name_kanji = profile_data.get("first_name_kanji")
                                last_name_kanji = profile_data.get("last_name_kanji")
                                if first_name_kanji and last_name_kanji:
                                    formatted_item["user_name"] = f"{last_name_kanji} {first_name_kanji}"
                                elif first_name_kanji:
                                    formatted_item["user_name"] = first_name_kanji
                                elif last_name_kanji:
                                    formatted_item["user_name"] = last_name_kanji
                                else:
                                    # 漢字の名前がない場合は英語名を使用
                                    formatted_item["user_name"] = user_data.get("name")
                            else:
                                # プロフィールがない場合は英語名を使用
                                formatted_item["user_name"] = user_data.get("name")
                        except Exception as profile_error:
                            print(f"Error fetching profile data for user {user_data['id']}: {profile_error}")
                            # プロフィール取得に失敗した場合は英語名を使用
                            formatted_item["user_name"] = user_data.get("name")
            except Exception as e:
                print(f"Error fetching attendance data for {item['attendance_id']}: {e}")
                formatted_item["attendance_status"] = "unknown"
            
            # パート情報を取得（schedule_idとslot_orderからsessionsテーブルを経由）
            try:
                # まずsessionsテーブルからpart_idを取得
                session_response = self.client.table("sessions").select("part_id").eq("schedule_id", item["schedule_id"]).eq("slot_order", item["slot_order"]).execute()
                if session_response.data:
                    part_id = session_response.data[0].get("part_id")
                    if part_id:
                        # partsテーブルからパート名を取得
                        part_response = self.client.table("parts").select("name").eq("id", part_id).execute()
                        if part_response.data:
                            formatted_item["part_name"] = part_response.data[0].get("name")
            except Exception as e:
                print(f"Error fetching part data for schedule {item['schedule_id']} slot {item['slot_order']}: {e}")
            
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("find_by_attendance_id")
    async def find_by_attendance_id(self, attendance_id: UUID) -> list[dict[str, Any]]:
        """指定した出席IDの指導者割り当て一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("attendance_id", str(attendance_id))
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_schedule_slot_and_attendance")
    async def find_by_schedule_slot_and_attendance(
        self, 
        schedule_id: UUID,
        slot_order: int,
        attendance_id: UUID
    ) -> dict[str, Any] | None:
        """指定したスケジュール、コマ、出席IDの組み合わせを取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", str(schedule_id))
            .eq("slot_order", slot_order)
            .eq("attendance_id", str(attendance_id))
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, session_instructor_data: dict[str, Any]) -> dict[str, Any]:
        """セッション指導者を作成"""
        serialized_data = self._serialize_uuid_fields(session_instructor_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(
        self, 
        session_instructor_id: UUID, 
        update_data: dict[str, Any]
    ) -> dict[str, Any]:
        """セッション指導者を更新"""
        serialized_data = self._serialize_uuid_fields(update_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", str(session_instructor_id))
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, session_instructor_id: UUID) -> bool:
        """セッション指導者を削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("id", str(session_instructor_id))
            .execute()
        )
        return len(response.data) > 0

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの指導者割り当てをすべて削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("schedule_id", str(schedule_id))
            .execute()
        )
        return len(response.data)

    @handle_supabase_errors("delete_by_schedule_and_slot")
    async def delete_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> int:
        """指定したスケジュールとコマの指導者割り当てをすべて削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("schedule_id", str(schedule_id))
            .eq("slot_order", slot_order)
            .execute()
        )
        return len(response.data)

    # 関連テーブルの存在確認用メソッド
    @handle_supabase_errors("find_schedule_by_id")
    async def find_schedule_by_id(self, schedule_id: UUID) -> dict[str, Any] | None:
        """スケジュールの存在確認"""
        response = self.client.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_schedule_available_venue_by_id")
    async def find_schedule_available_venue_by_id(self, venue_id: UUID) -> dict[str, Any] | None:
        """利用可能会場の存在確認"""
        response = self.client.table("schedule_available_venues").select("*").eq("id", str(venue_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_attendance_by_id")
    async def find_attendance_by_id(self, attendance_id: UUID) -> dict[str, Any] | None:
        """出席記録の存在確認"""
        response = self.client.table("practice_user_attendance").select("*").eq("id", str(attendance_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_instructor_candidates")
    async def find_instructor_candidates(self, practice_schedule_id: UUID) -> list[dict[str, Any]]:
        """インストラクター候補を取得（出席記録ありかつis_instructorがtrueのユーザー）"""
        # 指定された練習スケジュールに出席記録があり、かつis_instructor=trueのユーザーを取得
        # まず出席記録を取得
        attendance_response = self.client.table("practice_user_attendance").select(
            "id, user_id, status"
        ).eq("practice_schedule_id", str(practice_schedule_id)).execute()

        candidates = []
        for attendance in attendance_response.data:
            if attendance.get("status") in ["present", "late"]:
                # user_rolesテーブルからis_instructorフラグを確認
                role_response = self.client.table("user_roles").select(
                    "is_instructor"
                ).eq("user_id", attendance["user_id"]).execute()

                # is_instructorがtrueの場合のみ候補に追加
                if role_response.data and role_response.data[0].get("is_instructor") == True:
                    # ユーザー情報を取得
                    user_response = self.client.table("users").select(
                        "id, email"
                    ).eq("id", attendance["user_id"]).execute()

                    if user_response.data:
                        user = user_response.data[0]
                        # ユーザープロフィールを取得
                        profile_response = self.client.table("user_profiles").select(
                            "first_name_kanji, last_name_kanji, student_id, grade"
                        ).eq("user_id", user["id"]).execute()

                        profile = profile_response.data[0] if profile_response.data else {}
                        candidates.append({
                            "user_id": user["id"],
                            "email": user["email"],
                            "first_name_kanji": profile.get("first_name_kanji"),
                            "last_name_kanji": profile.get("last_name_kanji"),
                            "student_id": profile.get("student_id"),
                            "grade": profile.get("grade"),
                            "attendance_id": attendance["id"],
                            "attendance_status": attendance["status"]
                        })

        return candidates
