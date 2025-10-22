"""
スケジュール利用可能会場のデータアクセス層
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class ScheduleAvailableVenueRepository:
    """スケジュール利用可能会場のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "schedule_available_venues"
    
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
        """すべてのスケジュール利用可能会場を取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_all_with_details")
    async def find_all_with_details(
        self, 
        limit: int = 100, 
        offset: int = 0,
        schedule_id: Optional[UUID] = None,
        venue_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """詳細情報付きでスケジュール利用可能会場を取得"""
        # 基本データを取得
        query = self.client.table(self.table_name).select("*")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if venue_id:
            query = query.eq("venue_id", str(venue_id))
        
        # 並び順（優先度の高い順、作成日時順）
        query = query.order("priority", desc=True).order("created_at")
        
        # ページネーション
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
        # データを整形し、関連データを個別に取得
        formatted_data = []
        for item in response.data:
            formatted_item = {
                "id": item["id"],
                "schedule_id": item["schedule_id"],
                "venue_id": item["venue_id"],
                "is_preferred": item.get("is_preferred", False),
                "priority": item.get("priority", 0),
                "notes": item.get("notes"),
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
                # デフォルト値
                "venue_name": None,
                "venue_address": None,
                "venue_capacity": None,
                "venue_phone": None,
                "venue_email": None,
                "venue_website": None,
                "schedule_date": None,
                "schedule_title": None,
                "schedule_start_time": None,
                "schedule_end_time": None,
            }
            
            # 会場情報を取得
            try:
                venue_response = self.client.table("venues").select("*").eq("id", item["venue_id"]).execute()
                if venue_response.data:
                    venue_data = venue_response.data[0]
                    formatted_item["venue_name"] = venue_data.get("name")
                    formatted_item["venue_address"] = venue_data.get("address")
                    formatted_item["venue_capacity"] = venue_data.get("capacity")
                    formatted_item["venue_phone"] = venue_data.get("phone")
                    formatted_item["venue_email"] = venue_data.get("email")
                    formatted_item["venue_website"] = venue_data.get("website")
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
            
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("count_all")
    async def count_all(
        self,
        schedule_id: Optional[UUID] = None,
        venue_id: Optional[UUID] = None
    ) -> int:
        """スケジュール利用可能会場の総件数を取得"""
        query = self.client.table(self.table_name).select("id", count="exact")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if venue_id:
            query = query.eq("venue_id", str(venue_id))
        
        response = query.execute()
        return response.count

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, schedule_venue_id: UUID) -> Optional[Dict[str, Any]]:
        """指定したIDのスケジュール利用可能会場を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", str(schedule_venue_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定したスケジュールの利用可能会場一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*, venues(*)")
            .eq("schedule_id", str(schedule_id))
            .order("priority", desc=True)
            .order("created_at")
            .execute()
        )
        
        # 会場名を含むようにデータを整形
        formatted_data = []
        for item in response.data:
            formatted_item = dict(item)
            if item.get("venues"):
                formatted_item["name"] = item["venues"].get("name")
                formatted_item["is_preferred"] = item["venues"].get("is_preferred", False)
                formatted_item["priority"] = item["venues"].get("priority", 0)
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("find_by_venue")
    async def find_by_venue(self, venue_id: UUID) -> List[Dict[str, Any]]:
        """指定した会場のスケジュール利用可能性一覧を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("venue_id", str(venue_id))
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_schedule_and_venue")
    async def find_by_schedule_and_venue(
        self, 
        schedule_id: UUID, 
        venue_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """指定したスケジュールと会場の組み合わせを取得"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        venue_id_str = str(venue_id) if isinstance(venue_id, UUID) else venue_id
        
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", schedule_id_str)
            .eq("venue_id", venue_id_str)
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, schedule_venue_data: Dict[str, Any]) -> Dict[str, Any]:
        """スケジュール利用可能会場を作成"""
        serialized_data = self._serialize_uuid_fields(schedule_venue_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(
        self, 
        schedule_venue_id: UUID, 
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """スケジュール利用可能会場を更新"""
        serialized_data = self._serialize_uuid_fields(update_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", str(schedule_venue_id))
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, schedule_venue_id: UUID) -> bool:
        """スケジュール利用可能会場を削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("id", str(schedule_venue_id))
            .execute()
        )
        return len(response.data) > 0

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定したスケジュールの利用可能会場をすべて削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("schedule_id", str(schedule_id))
            .execute()
        )
        return len(response.data)

    @handle_supabase_errors("delete_by_venue")
    async def delete_by_venue(self, venue_id: UUID) -> int:
        """指定した会場の利用可能性をすべて削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("venue_id", str(venue_id))
            .execute()
        )
        return len(response.data)

    # 関連テーブルの存在確認用メソッド
    @handle_supabase_errors("find_schedule_by_id")
    async def find_schedule_by_id(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """スケジュールの存在確認"""
        response = self.client.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_venue_by_id")
    async def find_venue_by_id(self, venue_id: UUID) -> Optional[Dict[str, Any]]:
        """会場の存在確認"""
        response = self.client.table("venues").select("*").eq("id", str(venue_id)).execute()
        return response.data[0] if response.data else None
