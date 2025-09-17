"""
スケジュール関連のデータアクセス層
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, time
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)


class ScheduleRepository:
    """スケジュールデータのリポジトリ"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    async def get_schedule_by_id(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """
        スケジュールIDでスケジュール情報を取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            スケジュール情報
        """
        try:
            response = self.supabase.table("practice_schedules").select("*").eq("id", str(schedule_id)).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"スケジュール取得エラー: {str(e)}, schedule_id={schedule_id}")
            raise
    
    async def get_schedule_with_venue(self, schedule_id: UUID) -> Optional[Dict[str, Any]]:
        """
        スケジュールと会場情報を取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            スケジュールと会場情報
        """
        try:
            response = self.supabase.table("practice_schedules").select(
                "*, venues(*)"
            ).eq("id", str(schedule_id)).execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"スケジュール・会場取得エラー: {str(e)}, schedule_id={schedule_id}")
            raise
    
    async def get_available_venues_for_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """
        スケジュールの利用可能会場を取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            利用可能会場リスト
        """
        try:
            response = self.supabase.table("schedule_available_venues").select(
                "*, venues(*)"
            ).eq("schedule_id", str(schedule_id)).execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"利用可能会場取得エラー: {str(e)}, schedule_id={schedule_id}")
            raise
    
    async def get_members_for_schedule(self, schedule_id: UUID) -> List[Dict[str, Any]]:
        """
        スケジュールに関連するメンバー情報を取得
        
        Args:
            schedule_id: スケジュールID
            
        Returns:
            メンバー情報リスト
        """
        try:
            # スケジュールに関連するパートを取得
            parts_response = self.supabase.table("sessions").select("part_id").eq("schedule_id", str(schedule_id)).execute()
            part_ids = [session["part_id"] for session in parts_response.data] if parts_response.data else []
            
            if not part_ids:
                return []
            
            # パートに所属するメンバーを取得
            response = self.supabase.table("member_assignments").select(
                "*, users(*), parts(*)"
            ).in_("part_id", part_ids).execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"メンバー情報取得エラー: {str(e)}, schedule_id={schedule_id}")
            raise
    
    async def get_all_members_with_parts(self) -> List[Dict[str, Any]]:
        """
        全メンバーとパート情報を取得
        
        Returns:
            メンバー・パート情報リスト
        """
        try:
            response = self.supabase.table("member_assignments").select(
                "*, users(*), parts(*)"
            ).execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"全メンバー・パート情報取得エラー: {str(e)}")
            raise
    
    async def get_all_parts(self) -> List[Dict[str, Any]]:
        """
        全パート情報を取得
        
        Returns:
            パート情報リスト
        """
        try:
            response = self.supabase.table("parts").select("*").eq("status", "active").execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"パート情報取得エラー: {str(e)}")
            raise
    
    async def get_all_venues(self) -> List[Dict[str, Any]]:
        """
        全会場情報を取得
        
        Returns:
            会場情報リスト
        """
        try:
            response = self.supabase.table("venues").select("*").eq("is_active", True).execute()
            return response.data or []
            
        except Exception as e:
            logger.error(f"会場情報取得エラー: {str(e)}")
            raise
    
    async def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        セッションを作成
        
        Args:
            session_data: セッションデータ
            
        Returns:
            作成されたセッション情報
        """
        try:
            response = self.supabase.table("sessions").insert(session_data).execute()
            
            if response.data:
                return response.data[0]
            raise Exception("セッション作成に失敗しました")
            
        except Exception as e:
            logger.error(f"セッション作成エラー: {str(e)}")
            raise
    
    async def create_multiple_sessions(self, sessions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        複数セッションを一括作成
        
        Args:
            sessions_data: セッションデータリスト
            
        Returns:
            作成されたセッション情報リスト
        """
        try:
            response = self.supabase.table("sessions").insert(sessions_data).execute()
            
            if response.data:
                return response.data
            raise Exception("セッション一括作成に失敗しました")
            
        except Exception as e:
            logger.error(f"セッション一括作成エラー: {str(e)}")
            raise
    
    async def update_schedule_status(self, schedule_id: UUID, status: str) -> bool:
        """
        スケジュールステータスを更新
        
        Args:
            schedule_id: スケジュールID
            status: 新しいステータス
            
        Returns:
            更新成功フラグ
        """
        try:
            response = self.supabase.table("practice_schedules").update(
                {"status": status}
            ).eq("id", str(schedule_id)).execute()
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"スケジュールステータス更新エラー: {str(e)}, schedule_id={schedule_id}")
            raise
