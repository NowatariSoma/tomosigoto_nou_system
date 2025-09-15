"""
PracticeScheduleRepository - データアクセス層の実装
Supabaseのpractice_schedulesテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import date

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class PracticeScheduleRepository:
    """
    練習スケジュールデータへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "practice_schedules"
        self.sessions_table = "sessions"
        self._table_created = False

    async def _ensure_table_exists(self) -> bool:
        """
        practice_schedulesテーブルが存在することを確認
        
        Returns:
            テーブルが存在する場合はTrue
        """
        if self._table_created:
            return True
            
        try:
            # テーブルの存在確認
            response = self.client.table(self.table_name).select("id").limit(1).execute()
            self._table_created = True
            return True
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist: {e}")
            return False

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """
        すべての練習スケジュールを取得

        Returns:
            練習スケジュール情報のリスト
        """
        if not await self._ensure_table_exists():
            logger.warning(f"Table {self.table_name} does not exist")
            return []
            
        try:
            response = self.client.table(self.table_name).select("*").execute()
            data = response.data or []
            logger.info(f"Found {len(data)} practice schedules in {self.table_name} table")
            return data
        except Exception as e:
            logger.warning(f"Error fetching practice schedules: {e}")
            return []

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        """
        IDで練習スケジュールを取得

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            練習スケジュール情報、見つからない場合はNone
        """
        try:
            response = (
                self.client.table(self.table_name).select("*").eq("id", schedule_id).execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Found practice schedule with id: {schedule_id}")
                return response.data[0]

            logger.info(f"Practice schedule not found with id: {schedule_id}")
            return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist: {e}")
            return None

    @handle_supabase_errors("find_by_date")
    async def find_by_date(self, target_date: date) -> Optional[Dict[str, Any]]:
        """
        日付で練習スケジュールを取得

        Args:
            target_date: 対象日付

        Returns:
            練習スケジュール情報、見つからない場合はNone
        """
        if not await self._ensure_table_exists():
            logger.warning(f"Table {self.table_name} does not exist")
            return None
            
        try:
            response = (
                self.client.table(self.table_name)
                .select("*")
                .eq("schedule_date", target_date.isoformat())
                .execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Found practice schedule for date: {target_date}")
                return response.data[0]

            logger.info(f"Practice schedule not found for date: {target_date}")
            return None
        except Exception as e:
            logger.warning(f"Error fetching practice schedule for date {target_date}: {e}")
            return None

    @handle_supabase_errors("find_with_sessions")
    async def find_with_sessions(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        """
        練習スケジュールとセッションを一緒に取得

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            練習スケジュールとセッションの情報、見つからない場合はNone
        """
        # 練習スケジュールを取得
        practice_schedule = await self.find_by_id(schedule_id)
        if not practice_schedule:
            return None

        # セッションを取得
        sessions_response = (
            self.client.table(self.sessions_table)
            .select("*")
            .eq("schedule_id", schedule_id)
            .order("start_time")
            .execute()
        )
        sessions = sessions_response.data or []

        practice_schedule["sessions"] = sessions
        logger.info(f"Found practice schedule with {len(sessions)} sessions")
        return practice_schedule

    @handle_supabase_errors("create")
    async def create(self, schedule_data: dict) -> Dict[str, Any]:
        """
        新しい練習スケジュールをデータベースに作成

        Args:
            schedule_data: 練習スケジュール情報

        Returns:
            作成された練習スケジュール情報
        """
        if not await self._ensure_table_exists():
            logger.error(f"Table {self.table_name} does not exist")
            return {}
            
        try:
            response = self.client.table(self.table_name).insert(schedule_data).execute()
            if response.data:
                logger.info(f"Practice schedule created successfully for date: {schedule_data.get('schedule_date', 'unknown')}")
                return response.data[0]

            logger.error(f"Failed to create practice schedule for date: {schedule_data.get('schedule_date', 'unknown')}")
            return {}
        except Exception as e:
            logger.error(f"Error creating practice schedule: {e}")
            return {}

    @handle_supabase_errors("update")
    async def update(self, schedule_id: str, schedule_data: dict) -> Optional[Dict[str, Any]]:
        """
        練習スケジュール情報を更新

        Args:
            schedule_id: 練習スケジュールID
            schedule_data: 更新するデータ

        Returns:
            更新された練習スケジュール情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(schedule_data)
            .eq("id", schedule_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Practice schedule updated successfully: {schedule_id}")
            return response.data[0]

        logger.warning(f"Practice schedule not found for update: {schedule_id}")
        return None

    @handle_supabase_errors("delete")
    async def delete(self, schedule_id: str) -> bool:
        """
        練習スケジュールを削除

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            削除成功時True
        """
        # 関連するセッションも削除
        self.client.table(self.sessions_table).delete().eq("schedule_id", schedule_id).execute()
        
        # 練習スケジュールを削除
        self.client.table(self.table_name).delete().eq("id", schedule_id).execute()
        logger.info(f"Practice schedule deleted successfully: {schedule_id}")
        return True

    @handle_supabase_errors("create_session")
    async def create_session(self, session_data: dict) -> Dict[str, Any]:
        """
        新しいセッションを作成

        Args:
            session_data: セッション情報

        Returns:
            作成されたセッション情報
        """
        response = self.client.table(self.sessions_table).insert(session_data).execute()
        if response.data:
            logger.info(f"Session created successfully")
            return response.data[0]

        logger.error("Failed to create session")
        return {}

    @handle_supabase_errors("update_session")
    async def update_session(self, session_id: str, session_data: dict) -> Optional[Dict[str, Any]]:
        """
        セッションを更新

        Args:
            session_id: セッションID
            session_data: 更新するデータ

        Returns:
            更新されたセッション情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.sessions_table)
            .update(session_data)
            .eq("id", session_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Session updated successfully: {session_id}")
            return response.data[0]

        logger.warning(f"Session not found for update: {session_id}")
        return None

    @handle_supabase_errors("delete_session")
    async def delete_session(self, session_id: str) -> bool:
        """
        セッションを削除

        Args:
            session_id: セッションID

        Returns:
            削除成功時True
        """
        self.client.table(self.sessions_table).delete().eq("id", session_id).execute()
        logger.info(f"Session deleted successfully: {session_id}")
        return True
