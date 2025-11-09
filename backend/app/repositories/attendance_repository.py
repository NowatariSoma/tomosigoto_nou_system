from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum
from datetime import time

from app.core.exceptions import handle_supabase_errors
from supabase import Client


class AttendanceRepository:
    """出欠記録のデータアクセス層"""

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "practice_user_attendance"
    
    def _serialize_uuid_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """UUID型、Enum型、time型を文字列に変換、空文字列をNoneに変換"""
        serialized_data = {}
        for key, value in data.items():
            if isinstance(value, UUID):
                serialized_data[key] = str(value)
            elif isinstance(value, Enum):
                serialized_data[key] = value.value
            elif isinstance(value, time):
                # time型を文字列に変換（HH:MM:SS形式）
                serialized_data[key] = value.strftime("%H:%M:%S")
            elif value == "":
                # 空文字列はNoneに変換（available_from, available_toなど）
                serialized_data[key] = None
            else:
                serialized_data[key] = value
        return serialized_data

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """すべての出欠記録を取得"""
        response = self.client.table(self.table_name).select("*").execute()
        return response.data

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, attendance_id: UUID) -> Dict[str, Any]:
        """指定したIDの出欠記録を取得"""
        response = self.client.table(self.table_name).select("*").eq("id", attendance_id).execute()
        return response.data[0]

    @handle_supabase_errors("find_by_practice_schedule")
    async def find_by_practice_schedule(self, practice_schedule_id: UUID) -> List[Dict[str, Any]]:
        """指定した練習スケジュールの出欠記録を取得（ユーザー情報とプロフィール情報を含む）"""
        response = (
            self.client.table(self.table_name)
            .select("""
                *,
                users!inner(
                    id,
                    email
                )
            """)
            .eq("practice_schedule_id", practice_schedule_id)
            .execute()
        )
        
        if not response.data:
            return []
        
        # user_idを収集
        user_ids = [item["users"]["id"] for item in response.data if item.get("users", {}).get("id")]
        
        # user_profilesをバッチ取得
        profiles_map = {}
        if user_ids:
            profile_response = (
                self.client.table("user_profiles")
                .select("user_id, last_name_kanji, first_name_kanji")
                .in_("user_id", user_ids)
                .execute()
            )
            for profile in profile_response.data or []:
                profiles_map[profile["user_id"]] = profile
        
        # 各出欠記録にuser_nameを設定
        for item in response.data:
            user_data = item.get("users", {})
            user_id = user_data.get("id")
            
            # フルネームを構築（本番環境では必ず存在する）
            if user_id and user_id in profiles_map:
                profile = profiles_map[user_id]
                item["user_name"] = f"{profile.get('last_name_kanji', '')} {profile.get('first_name_kanji', '')}".strip()
            else:
                item["user_name"] = user_data.get("email", "").split("@")[0] if user_data.get("email") else "不明"
            
            item["user_email"] = user_data.get("email", "") if user_data else ""
        
        return response.data

    @handle_supabase_errors("find_by_user")
    async def find_by_user(self, user_id: UUID) -> List[Dict[str, Any]]:
        """指定したユーザーの出欠記録を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data

    @handle_supabase_errors("find_by_practice_and_user")
    async def find_by_practice_and_user(
        self, practice_schedule_id: UUID, user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """指定した練習とユーザーの組み合わせの出欠記録を取得"""
        response = (
            self.client.table(self.table_name)
            .select("*")
            .eq("practice_schedule_id", practice_schedule_id)
            .eq("user_id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None

    @handle_supabase_errors("create")
    async def create(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成"""
        # UUID型を文字列に変換
        serialized_data = self._serialize_uuid_fields(attendance_data)
        
        # created_byとupdated_byを一時的に除外（PostgRESTのスキーマキャッシュの問題のため）
        serialized_data.pop('created_by', None)
        serialized_data.pop('updated_by', None)
        
        response = self.client.table(self.table_name).insert(serialized_data).execute()
        return response.data[0]

    @handle_supabase_errors("update")
    async def update(self, attendance_id: UUID, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を更新"""
        # UUID型を文字列に変換
        serialized_data = self._serialize_uuid_fields(attendance_data)
        
        # created_byとupdated_byを一時的に除外（PostgRESTのスキーマキャッシュの問題のため）
        serialized_data.pop('created_by', None)
        serialized_data.pop('updated_by', None)
        
        response = (
            self.client.table(self.table_name)
            .update(serialized_data)
            .eq("id", attendance_id)
            .execute()
        )
        return response.data[0]

    @handle_supabase_errors("upsert")
    async def upsert(self, attendance_data: Dict[str, Any]) -> Dict[str, Any]:
        """出欠記録を作成または更新（practice_schedule_id + user_idの組み合わせで）"""
        # UUID型を文字列に変換
        serialized_data = self._serialize_uuid_fields(attendance_data)
        
        # created_byとupdated_byを一時的に除外（PostgRESTのスキーマキャッシュの問題のため）
        serialized_data.pop('created_by', None)
        serialized_data.pop('updated_by', None)
        
        # 既存の記録を確認
        existing = await self.find_by_practice_and_user(
            serialized_data["practice_schedule_id"], 
            serialized_data["user_id"]
        )
        
        if existing:
            # 更新
            response = (
                self.client.table(self.table_name)
                .update(serialized_data)
                .eq("practice_schedule_id", serialized_data["practice_schedule_id"])
                .eq("user_id", serialized_data["user_id"])
                .execute()
            )
        else:
            # 作成
            response = self.client.table(self.table_name).insert(serialized_data).execute()
        
        return response.data[0]

    @handle_supabase_errors("delete")
    async def delete(self, attendance_id: UUID) -> bool:
        """出欠記録を削除"""
        self.client.table(self.table_name).delete().eq("id", attendance_id).execute()
        return True

    @handle_supabase_errors("get_attendance_summary")
    async def get_attendance_summary(self) -> List[Dict[str, Any]]:
        """練習別の出欠サマリーを取得（ビューから）"""
        response = self.client.table("practice_user_attendance_summary").select("*").execute()
        return response.data

    @handle_supabase_errors("get_user_attendance_history")
    async def get_user_attendance_history(self) -> List[Dict[str, Any]]:
        """ユーザー別の出欠履歴を取得（ビューから）"""
        response = self.client.table("practice_user_attendance_history").select("*").execute()
        return response.data


