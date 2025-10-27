"""
セッションのデータアクセス層
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class SessionRepository:
    """セッションのデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "sessions"
    
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
        """すべてのセッションを取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, session_id: UUID) -> Optional[Dict[str, Any]]:
        """指定されたIDのセッションを取得"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        response = self.client.table(self.table_name).select("*").eq("id", session_id_str).execute()
        
        if not response.data:
            return None
        
        # パート情報を取得して追加
        item = response.data[0]
        formatted_item = dict(item)
        formatted_item["part_name"] = None
        
        # パート情報を取得
        if item.get("part_id"):
            try:
                part_response = self.client.table("parts").select("name").eq("id", item["part_id"]).execute()
                if part_response.data:
                    formatted_item["part_name"] = part_response.data[0].get("name")
            except Exception as e:
                print(f"Error fetching part data in find_by_id: {e}")
        
        return formatted_item

    @handle_supabase_errors("find_by_schedule")
    async def find_by_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定されたスケジュールのセッションを取得"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("schedule_id", schedule_id_str)
            .order("slot_order", desc=False)
            .execute()
        )
        
        # パート名を取得して追加
        print(f"Processing {len(response.data)} sessions")
        formatted_data = []
        for item in response.data:
            print(f"Processing session: {item.get('id')}, part_id: {item.get('part_id')}")
            formatted_item = dict(item)
            formatted_item["part_name"] = None
            
            # パート情報を取得
            if item.get("part_id"):
                try:
                    print(f"Fetching part name for part_id: {item['part_id']}")
                    part_response = self.client.table("parts").select("name").eq("id", item["part_id"]).execute()
                    print(f"Part response: {part_response.data}")
                    if part_response.data:
                        formatted_item["part_name"] = part_response.data[0].get("name")
                        print(f"Part name: {formatted_item['part_name']}")
                    else:
                        print("No part data found")
                except Exception as e:
                    print(f"Error fetching part data: {e}")
            else:
                print("No part_id found")
            
            formatted_data.append(formatted_item)
        
        return formatted_data

    @handle_supabase_errors("find_with_details")
    async def find_with_details(
        self, 
        limit: int = 100, 
        offset: int = 0,
        schedule_id: Optional[UUID] = None,
        part_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """詳細情報付きでセッションを取得"""
        # 基本データを取得
        query = self.client.table(self.table_name).select("*")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if part_id:
            query = query.eq("part_id", str(part_id))
        
        # 並び順（コマ順序順）
        query = query.order("slot_order").order("created_at")
        
        # ページネーション
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        
        # データを整形し、関連データを個別に取得
        formatted_data = []
        for item in response.data:
            formatted_item = {
                "id": item["id"],
                "schedule_id": item["schedule_id"],
                "title": item.get("title"),
                "slot_order": item.get("slot_order"),
                "priority": item.get("priority", 0),
                "part_id": item.get("part_id"),
                "schedule_available_venue_id": item.get("schedule_available_venue_id"),
                "created_at": item["created_at"],
                "updated_at": item["updated_at"],
                # デフォルト値
                "part_name": None,
                "venue_name": None,
                "venue_address": None,
                "schedule_date": None,
                "schedule_title": None,
                "schedule_start_time": None,
                "schedule_end_time": None,
            }
            
            # 部署情報を取得
            if item.get("part_id"):
                try:
                    part_response = self.client.table("parts").select("*").eq("id", item["part_id"]).execute()
                    if part_response.data:
                        part_data = part_response.data[0]
                        formatted_item["part_name"] = part_data.get("name")
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
        part_id: Optional[UUID] = None
    ) -> int:
        """セッションの総件数を取得"""
        query = self.client.table(self.table_name).select("id", count="exact")
        
        # フィルタリング
        if schedule_id:
            query = query.eq("schedule_id", str(schedule_id))
        if part_id:
            query = query.eq("part_id", str(part_id))
        
        response = query.execute()
        return response.count

    @handle_supabase_errors("create")
    async def create(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """新しいセッションを作成"""
        # UUID型フィールドを文字列に変換
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])
        if "schedule_id" in session_data and session_data["schedule_id"] is not None:
            session_data["schedule_id"] = str(session_data["schedule_id"])
        
        serialized_data = self._serialize_uuid_fields(session_data)
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, session_id: UUID, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """セッションを更新"""
        # UUID型フィールドを文字列に変換
        if "schedule_available_venue_id" in session_data and session_data["schedule_available_venue_id"] is not None:
            session_data["schedule_available_venue_id"] = str(session_data["schedule_available_venue_id"])
        if "part_id" in session_data and session_data["part_id"] is not None:
            session_data["part_id"] = str(session_data["part_id"])
        if "schedule_id" in session_data and session_data["schedule_id"] is not None:
            session_data["schedule_id"] = str(session_data["schedule_id"])

        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        serialized_data = self._serialize_uuid_fields(session_data)
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", session_id_str)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, session_id: UUID) -> bool:
        """セッションを削除"""
        session_id_str = str(session_id) if isinstance(session_id, UUID) else session_id
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("id", session_id_str)
            .execute()
        )
        return len(response.data) > 0

    @handle_supabase_errors("delete_by_schedule")
    async def delete_by_schedule(self, schedule_id: UUID) -> int:
        """指定されたスケジュールのセッションをすべて削除"""
        schedule_id_str = str(schedule_id) if isinstance(schedule_id, UUID) else schedule_id
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("schedule_id", schedule_id_str)
            .execute()
        )
        return len(response.data)

    @handle_supabase_errors("delete_by_part")
    async def delete_by_part(self, part_id: UUID) -> int:
        """指定した部署のセッションをすべて削除"""
        response = (
            self.client.table(self.table_name)
            .delete()
            .eq("part_id", str(part_id))
            .execute()
        )
        return len(response.data)

    # 関連テーブルの存在確認用メソッド
    @handle_supabase_errors("find_schedule_by_id")
    async def find_schedule_by_id(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """スケジュールの存在確認"""
        response = self.client.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_part_by_id")
    async def find_part_by_id(self, part_id: UUID) -> Optional[Dict[str, Any]]:
        """部署の存在確認"""
        response = self.client.table("parts").select("*").eq("id", str(part_id)).execute()
        return response.data[0] if response.data else None

    @handle_supabase_errors("find_venue_by_id")
    async def find_venue_by_id(self, venue_id: UUID) -> Optional[Dict[str, Any]]:
        """会場の存在確認"""
        response = self.client.table("schedule_available_venues").select("*").eq("id", str(venue_id)).execute()
        return response.data[0] if response.data else None
