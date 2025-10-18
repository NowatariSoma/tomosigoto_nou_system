"""
セッション指導者のデータアクセス層
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class SessionInstructorRepository:
    """セッション指導者のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "session_instructors"
    
    def _serialize_uuid_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
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
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべてのセッション指導者を取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_all_with_details")
    async def find_all_with_details(
        self, 
        limit: int = 20, 
        offset: int = 0,
        schedule_id: Optional[UUID] = None,
        slot_order: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """詳細情報付きでセッション指導者を取得"""
        # まず基本的なセッション指導者データを取得
        query = self.client.table(self.table_name).select("*")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if slot_order:
            query = query.eq("slot_order", slot_order)
        
        # ページネーション
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
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
                "schedule_date": None,
                "schedule_title": None,
                "schedule_start_time": None,
                "schedule_end_time": None,
                "venue_name": None,
                "venue_address": None,
            }
            
            # 出席者情報を取得
            try:
                attendance_response = self.client.table("practice_user_attendance").select("*, users(*)").eq("id", item["attendance_id"]).execute()
                if attendance_response.data:
                    attendance_data = attendance_response.data[0]
                    formatted_item["attendance_status"] = attendance_data.get("status")
                    if attendance_data.get("users"):
                        formatted_item["user_name"] = attendance_data["users"].get("name")
                        formatted_item["user_email"] = attendance_data["users"].get("email")
            except Exception:
                pass  # エラーが発生した場合はデフォルト値のまま
            
            # スケジュール情報を取得
            try:
                schedule_response = self.client.table("practice_schedules").select("*").eq("id", item["schedule_id"]).execute()
                if schedule_response.data:
                    schedule_data = schedule_response.data[0]
                    formatted_item["schedule_date"] = schedule_data.get("schedule_date")
                    formatted_item["schedule_title"] = schedule_data.get("title")
                    formatted_item["schedule_start_time"] = schedule_data.get("start_time")
                    formatted_item["schedule_end_time"] = schedule_data.get("end_time")
            except Exception:
                pass  # エラーが発生した場合はデフォルト値のまま
            
            # 会場情報を取得（schedule_available_venue_idがある場合）
            if item.get("schedule_available_venue_id"):
                try:
                    venue_response = self.client.table("schedule_available_venues").select("*, venues(*)").eq("id", item["schedule_available_venue_id"]).execute()
                    if venue_response.data and venue_response.data[0].get("venues"):
                        venue_data = venue_response.data[0]["venues"]
                        formatted_item["venue_name"] = venue_data.get("name")
                        formatted_item["venue_address"] = venue_data.get("address")
                except Exception:
                    pass  # エラーが発生した場合はデフォルト値のまま
            
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("count_all")
    async def count_all(
        self,
        schedule_id: Optional[UUID] = None,
        slot_order: Optional[int] = None
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
    async def find_by_id(self, session_instructor_id: UUID) -> Optional[Dict[str, Any]]:
        """指定したIDのセッション指導者を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(session_instructor_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールの指導者一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", str(schedule_id))
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_schedule_and_slot")
    async def find_by_schedule_and_slot(self, schedule_id: UUID, slot_order: int) -> List[Dict[str, Any]]:
        """指定したスケジュールとコマの指導者一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", str(schedule_id))
            .eq("slot_order", slot_order)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_attendance_id")
    async def find_by_attendance_id(self, attendance_id: UUID) -> List[Dict[str, Any]]:
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
    ) -> Optional[Dict[str, Any]]:
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
    async def create(self, session_instructor_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッション指導者を作成"""
        serialized_data = self._serialize_uuid_fields(session_instructor_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(
        self, 
        session_instructor_id: UUID, 
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
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
    async def find_schedule_by_id(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """スケジュールの存在確認"""
        response = self.client.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_schedule_available_venue_by_id")
    async def find_schedule_available_venue_by_id(self, venue_id: UUID) -> Optional[Dict[str, Any]]:
        """利用可能会場の存在確認"""
        response = self.client.table("schedule_available_venues").select("*").eq("id", str(venue_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_attendance_by_id")
    async def find_attendance_by_id(self, attendance_id: UUID) -> Optional[Dict[str, Any]]:
        """出席記録の存在確認"""
        response = self.client.table("practice_user_attendance").select("*").eq("id", str(attendance_id)).execute()
        return response.data[0] if response.data else None
