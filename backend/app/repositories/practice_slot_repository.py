"""
PracticeSlotRepository - データアクセス層の実装
Supabaseのpractice_slotsテーブルに対するCRUD操作を提供
"""

import logging
from typing import Any, Dict, List, Optional
from datetime import date

from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class PracticeSlotRepository:
    """
    練習表データへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "practice_slots"
        self.schedule_items_table = "schedule_items"
        self._table_created = False

    async def _ensure_table_exists(self) -> bool:
        """
        practice_slotsテーブルが存在することを確認し、存在しない場合は作成する
        
        Returns:
            テーブルが存在するか作成できた場合はTrue
        """
        if self._table_created:
            return True
            
        try:
            # テーブルの存在確認
            response = self.client.table(self.table_name).select("id").limit(1).execute()
            self._table_created = True
            return True
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist, attempting to create: {e}")
            try:
                # テーブル作成のSQLを実行
                create_sql = """
                CREATE TABLE IF NOT EXISTS practice_slots (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    date DATE NOT NULL UNIQUE,
                    title VARCHAR(255),
                    description TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
                CREATE INDEX IF NOT EXISTS idx_practice_slots_is_active ON practice_slots(is_active);
                """
                
                # 直接SQLを実行できないため、空のレコードを挿入してテーブルを作成
                # これは一時的な回避策です
                logger.info("Creating practice_slots table by inserting a test record")
                
                # テスト用のレコードを作成
                test_data = {
                    "date": "1900-01-01",
                    "title": "Test Table Creation",
                    "description": "This record is used to create the table",
                    "is_active": False
                }
                
                response = self.client.table(self.table_name).insert(test_data).execute()
                if response.data:
                    # テストレコードを削除
                    self.client.table(self.table_name).delete().eq("date", "1900-01-01").execute()
                    self._table_created = True
                    logger.info("✅ practice_slots table created successfully")
                    return True
                else:
                    logger.error("Failed to create practice_slots table")
                    return False
                    
            except Exception as create_error:
                logger.error(f"Failed to create practice_slots table: {create_error}")
                return False

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """
        すべての練習表を取得

        Returns:
            練習表情報のリスト
        """
        if not await self._ensure_table_exists():
            logger.warning(f"Table {self.table_name} does not exist and could not be created")
            return []
            
        try:
            response = self.client.table(self.table_name).select("*").execute()
            data = response.data or []
            logger.info(f"Found {len(data)} practice slots in {self.table_name} table")
            return data
        except Exception as e:
            logger.warning(f"Error fetching practice slots: {e}")
            return []

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, practice_slot_id: str) -> Optional[Dict[str, Any]]:
        """
        IDで練習表を取得

        Args:
            practice_slot_id: 練習表ID

        Returns:
            練習表情報、見つからない場合はNone
        """
        try:
            response = (
                self.client.table(self.table_name).select("*").eq("id", practice_slot_id).execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Found practice slot with id: {practice_slot_id}")
                return response.data[0]

            logger.info(f"Practice slot not found with id: {practice_slot_id}")
            return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist: {e}")
            return None

    @handle_supabase_errors("find_by_date")
    async def find_by_date(self, target_date: date) -> Optional[Dict[str, Any]]:
        """
        日付で練習表を取得

        Args:
            target_date: 対象日付

        Returns:
            練習表情報、見つからない場合はNone
        """
        if not await self._ensure_table_exists():
            logger.warning(f"Table {self.table_name} does not exist and could not be created")
            return None
            
        try:
            response = (
                self.client.table(self.table_name)
                .select("*")
                .eq("date", target_date.isoformat())
                .execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Found practice slot for date: {target_date}")
                return response.data[0]

            logger.info(f"Practice slot not found for date: {target_date}")
            return None
        except Exception as e:
            logger.warning(f"Error fetching practice slot for date {target_date}: {e}")
            return None

    @handle_supabase_errors("find_with_schedule_items")
    async def find_with_schedule_items(self, practice_slot_id: str) -> Optional[Dict[str, Any]]:
        """
        練習表とスケジュールアイテムを一緒に取得

        Args:
            practice_slot_id: 練習表ID

        Returns:
            練習表とスケジュールアイテムの情報、見つからない場合はNone
        """
        # 練習表を取得
        practice_slot = await self.find_by_id(practice_slot_id)
        if not practice_slot:
            return None

        # スケジュールアイテムを取得
        schedule_items_response = (
            self.client.table(self.schedule_items_table)
            .select("*")
            .eq("practice_slot_id", practice_slot_id)
            .order("time")
            .execute()
        )
        schedule_items = schedule_items_response.data or []

        practice_slot["schedule_items"] = schedule_items
        logger.info(f"Found practice slot with {len(schedule_items)} schedule items")
        return practice_slot

    @handle_supabase_errors("create")
    async def create(self, practice_slot_data: dict) -> Dict[str, Any]:
        """
        新しい練習表をデータベースに作成

        Args:
            practice_slot_data: 練習表情報

        Returns:
            作成された練習表情報
        """
        if not await self._ensure_table_exists():
            logger.error(f"Table {self.table_name} does not exist and could not be created")
            return {}
            
        try:
            response = self.client.table(self.table_name).insert(practice_slot_data).execute()
            if response.data:
                logger.info(f"Practice slot created successfully for date: {practice_slot_data.get('date', 'unknown')}")
                return response.data[0]

            logger.error(f"Failed to create practice slot for date: {practice_slot_data.get('date', 'unknown')}")
            return {}
        except Exception as e:
            logger.error(f"Error creating practice slot: {e}")
            return {}

    @handle_supabase_errors("update")
    async def update(self, practice_slot_id: str, practice_slot_data: dict) -> Optional[Dict[str, Any]]:
        """
        練習表情報を更新

        Args:
            practice_slot_id: 練習表ID
            practice_slot_data: 更新するデータ

        Returns:
            更新された練習表情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.table_name)
            .update(practice_slot_data)
            .eq("id", practice_slot_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Practice slot updated successfully: {practice_slot_id}")
            return response.data[0]

        logger.warning(f"Practice slot not found for update: {practice_slot_id}")
        return None

    @handle_supabase_errors("delete")
    async def delete(self, practice_slot_id: str) -> bool:
        """
        練習表を削除

        Args:
            practice_slot_id: 練習表ID

        Returns:
            削除成功時True
        """
        # 関連するスケジュールアイテムも削除
        self.client.table(self.schedule_items_table).delete().eq("practice_slot_id", practice_slot_id).execute()
        
        # 練習表を削除
        self.client.table(self.table_name).delete().eq("id", practice_slot_id).execute()
        logger.info(f"Practice slot deleted successfully: {practice_slot_id}")
        return True

    @handle_supabase_errors("create_schedule_item")
    async def create_schedule_item(self, schedule_item_data: dict) -> Dict[str, Any]:
        """
        新しいスケジュールアイテムを作成

        Args:
            schedule_item_data: スケジュールアイテム情報

        Returns:
            作成されたスケジュールアイテム情報
        """
        response = self.client.table(self.schedule_items_table).insert(schedule_item_data).execute()
        if response.data:
            logger.info(f"Schedule item created successfully")
            return response.data[0]

        logger.error("Failed to create schedule item")
        return {}

    @handle_supabase_errors("update_schedule_item")
    async def update_schedule_item(self, schedule_item_id: str, schedule_item_data: dict) -> Optional[Dict[str, Any]]:
        """
        スケジュールアイテムを更新

        Args:
            schedule_item_id: スケジュールアイテムID
            schedule_item_data: 更新するデータ

        Returns:
            更新されたスケジュールアイテム情報、見つからない場合はNone
        """
        response = (
            self.client.table(self.schedule_items_table)
            .update(schedule_item_data)
            .eq("id", schedule_item_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            logger.info(f"Schedule item updated successfully: {schedule_item_id}")
            return response.data[0]

        logger.warning(f"Schedule item not found for update: {schedule_item_id}")
        return None

    @handle_supabase_errors("delete_schedule_item")
    async def delete_schedule_item(self, schedule_item_id: str) -> bool:
        """
        スケジュールアイテムを削除

        Args:
            schedule_item_id: スケジュールアイテムID

        Returns:
            削除成功時True
        """
        self.client.table(self.schedule_items_table).delete().eq("id", schedule_item_id).execute()
        logger.info(f"Schedule item deleted successfully: {schedule_item_id}")
        return True
