"""
PracticeScheduleService - ビジネスロジック層の実装
練習スケジュールに関するビジネスロジックを提供
"""

import logging
from datetime import date, time
from typing import Any, Dict, List, Optional

from app.core.exceptions import ErrorMessage, create_error_response, create_success_response
from app.repositories.practice_schedule_repository import PracticeScheduleRepository
from app.schemas.practice_schedules import (
    PracticeScheduleCreate,
    PracticeScheduleUpdate,
    PracticeScheduleWithSessionsResponse,
    SessionCreate,
    SessionUpdate,
)

logger = logging.getLogger(__name__)


class PracticeScheduleService:
    """
    練習スケジュールに関するビジネスロジックを管理するサービスクラス
    リポジトリ層とコントローラー層の間のビジネスロジックを提供
    """

    def __init__(self, repository: PracticeScheduleRepository):
        """
        Args:
            repository: 練習スケジュールリポジトリインスタンス
        """
        self.repository = repository

    async def get_all_practice_schedules(self) -> List[Dict[str, Any]]:
        """
        すべての練習スケジュールを取得

        Returns:
            練習スケジュールのリスト
        """
        try:
            schedules = await self.repository.find_all()
            logger.info(f"Retrieved {len(schedules)} practice schedules")
            return schedules
        except Exception as e:
            logger.error(f"Error retrieving practice schedules: {str(e)}")
            raise e

    async def get_practice_schedule_by_id(self, schedule_id: str) -> Dict[str, Any]:
        """
        IDで練習スケジュールを取得

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            練習スケジュール情報

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND: 練習スケジュールが見つからない場合
        """
        try:
            schedule = await self.repository.find_by_id(schedule_id)
            if not schedule:
                logger.warning(f"Practice schedule not found: {schedule_id}")
                raise ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND

            logger.info(f"Retrieved practice schedule: {schedule_id}")
            return schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error retrieving practice schedule {schedule_id}: {str(e)}")
            raise e

    async def get_practice_schedule_by_date(self, target_date: date) -> Dict[str, Any]:
        """
        日付で練習スケジュールを取得

        Args:
            target_date: 対象日付

        Returns:
            練習スケジュール情報

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND: 練習スケジュールが見つからない場合
        """
        try:
            schedule = await self.repository.find_by_date(target_date)
            if not schedule:
                logger.warning(f"Practice schedule not found for date: {target_date}")
                raise ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND

            logger.info(f"Retrieved practice schedule for date: {target_date}")
            return schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error retrieving practice schedule for date {target_date}: {str(e)}")
            raise e

    async def get_practice_schedule_with_sessions(self, schedule_id: str) -> Dict[str, Any]:
        """
        練習スケジュールとセッションを一緒に取得

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            練習スケジュールとセッションの情報

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND: 練習スケジュールが見つからない場合
        """
        try:
            schedule = await self.repository.find_with_sessions(schedule_id)
            if not schedule:
                logger.warning(f"Practice schedule not found: {schedule_id}")
                raise ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND

            logger.info(f"Retrieved practice schedule with sessions: {schedule_id}")
            return schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error retrieving practice schedule with sessions {schedule_id}: {str(e)}")
            raise e

    async def create_practice_schedule(self, schedule_data: PracticeScheduleCreate) -> Dict[str, Any]:
        """
        新しい練習スケジュールを作成

        Args:
            schedule_data: 練習スケジュール作成データ

        Returns:
            作成された練習スケジュール情報

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_ALREADY_EXISTS: 同じ日付の練習スケジュールが既に存在する場合
        """
        try:
            # 同じ日付の練習スケジュールが既に存在するかチェック
            existing_schedule = await self.repository.find_by_date(schedule_data.schedule_date)
            if existing_schedule:
                logger.warning(f"Practice schedule already exists for date: {schedule_data.schedule_date}")
                raise ErrorMessage.PRACTICE_SCHEDULE_ALREADY_EXISTS

            # 練習スケジュールを作成
            schedule_dict = schedule_data.dict()
            created_schedule = await self.repository.create(schedule_dict)
            
            if not created_schedule:
                logger.error(f"Failed to create practice schedule for date: {schedule_data.schedule_date}")
                raise ErrorMessage.PRACTICE_SCHEDULE_CREATION_FAILED

            logger.info(f"Created practice schedule for date: {schedule_data.schedule_date}")
            return created_schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error creating practice schedule: {str(e)}")
            raise e

    async def create_practice_schedule_with_sample_data(self, target_date: date) -> Dict[str, Any]:
        """
        サンプルデータ付きの練習スケジュールを作成（デバッグ用）

        Args:
            target_date: 対象日付

        Returns:
            作成された練習スケジュール情報
        """
        try:
            # 既存の練習スケジュールをチェック
            existing_schedule = await self.repository.find_by_date(target_date)
            if existing_schedule:
                logger.info(f"Practice schedule already exists for date: {target_date}")
                return existing_schedule

            # サンプルデータで練習スケジュールを作成
            sample_data = {
                "schedule_date": target_date.isoformat(),
                "start_time": "19:00:00",
                "end_time": "21:00:00",
                "description": f"{target_date}の練習スケジュール",
                "schedule_type": "regular",
                "status": "active"
            }

            created_schedule = await self.repository.create(sample_data)
            
            if not created_schedule:
                logger.error(f"Failed to create practice schedule with sample data for date: {target_date}")
                raise ErrorMessage.PRACTICE_SCHEDULE_CREATION_FAILED

            logger.info(f"Created practice schedule with sample data for date: {target_date}")
            return created_schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error creating practice schedule with sample data: {str(e)}")
            raise e

    async def update_practice_schedule(self, schedule_id: str, schedule_data: PracticeScheduleUpdate) -> Dict[str, Any]:
        """
        練習スケジュールを更新

        Args:
            schedule_id: 練習スケジュールID
            schedule_data: 更新データ

        Returns:
            更新された練習スケジュール情報

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND: 練習スケジュールが見つからない場合
        """
        try:
            # 更新データからNoneでない値のみを抽出
            update_dict = {k: v for k, v in schedule_data.dict().items() if v is not None}
            
            if not update_dict:
                logger.warning(f"No valid update data provided for schedule: {schedule_id}")
                raise ErrorMessage.INVALID_UPDATE_DATA

            updated_schedule = await self.repository.update(schedule_id, update_dict)
            
            if not updated_schedule:
                logger.warning(f"Practice schedule not found for update: {schedule_id}")
                raise ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND

            logger.info(f"Updated practice schedule: {schedule_id}")
            return updated_schedule
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error updating practice schedule {schedule_id}: {str(e)}")
            raise e

    async def delete_practice_schedule(self, schedule_id: str) -> bool:
        """
        練習スケジュールを削除

        Args:
            schedule_id: 練習スケジュールID

        Returns:
            削除成功時True

        Raises:
            ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND: 練習スケジュールが見つからない場合
        """
        try:
            # 練習スケジュールが存在するかチェック
            existing_schedule = await self.repository.find_by_id(schedule_id)
            if not existing_schedule:
                logger.warning(f"Practice schedule not found for deletion: {schedule_id}")
                raise ErrorMessage.PRACTICE_SCHEDULE_NOT_FOUND

            # 練習スケジュールを削除
            success = await self.repository.delete(schedule_id)
            
            if not success:
                logger.error(f"Failed to delete practice schedule: {schedule_id}")
                raise ErrorMessage.PRACTICE_SCHEDULE_DELETION_FAILED

            logger.info(f"Deleted practice schedule: {schedule_id}")
            return True
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error deleting practice schedule {schedule_id}: {str(e)}")
            raise e

    # セッション関連のメソッド
    async def create_session(self, session_data: SessionCreate) -> Dict[str, Any]:
        """
        新しいセッションを作成

        Args:
            session_data: セッション作成データ

        Returns:
            作成されたセッション情報
        """
        try:
            session_dict = session_data.dict()
            created_session = await self.repository.create_session(session_dict)
            
            if not created_session:
                logger.error("Failed to create session")
                raise ErrorMessage.SESSION_CREATION_FAILED

            logger.info("Created session successfully")
            return created_session
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            raise e

    async def update_session(self, session_id: str, session_data: SessionUpdate) -> Dict[str, Any]:
        """
        セッションを更新

        Args:
            session_id: セッションID
            session_data: 更新データ

        Returns:
            更新されたセッション情報

        Raises:
            ErrorMessage.SESSION_NOT_FOUND: セッションが見つからない場合
        """
        try:
            # 更新データからNoneでない値のみを抽出
            update_dict = {k: v for k, v in session_data.dict().items() if v is not None}
            
            if not update_dict:
                logger.warning(f"No valid update data provided for session: {session_id}")
                raise ErrorMessage.INVALID_UPDATE_DATA

            updated_session = await self.repository.update_session(session_id, update_dict)
            
            if not updated_session:
                logger.warning(f"Session not found for update: {session_id}")
                raise ErrorMessage.SESSION_NOT_FOUND

            logger.info(f"Updated session: {session_id}")
            return updated_session
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {str(e)}")
            raise e

    async def delete_session(self, session_id: str) -> bool:
        """
        セッションを削除

        Args:
            session_id: セッションID

        Returns:
            削除成功時True

        Raises:
            ErrorMessage.SESSION_NOT_FOUND: セッションが見つからない場合
        """
        try:
            success = await self.repository.delete_session(session_id)
            
            if not success:
                logger.error(f"Failed to delete session: {session_id}")
                raise ErrorMessage.SESSION_DELETION_FAILED

            logger.info(f"Deleted session: {session_id}")
            return True
        except ErrorMessage:
            raise
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {str(e)}")
            raise e
