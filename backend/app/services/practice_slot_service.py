import logging
from typing import Any, Dict, List, Optional
from datetime import date

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.practice_slot_repository import PracticeSlotRepository
from app.schemas.practice_slots import PracticeSlotCreate, ScheduleItemCreate

logger = logging.getLogger(__name__)


class PracticeSlotService:
    """
    練習表関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(self, practice_slot_repository: PracticeSlotRepository):
        """
        Args:
            practice_slot_repository: PracticeSlotRepositoryインスタンス
        """
        self.repository = practice_slot_repository

    async def get_all_practice_slots(self) -> List[Dict[str, Any]]:
        """すべての練習表を取得"""
        return await self.repository.find_all()

    async def get_practice_slot_by_id(self, practice_slot_id: str) -> Optional[Dict[str, Any]]:
        """IDで練習表を取得"""
        practice_slot = await self.repository.find_by_id(practice_slot_id)
        if not practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)
        return practice_slot

    async def get_practice_slot_by_date(self, target_date: date) -> Optional[Dict[str, Any]]:
        """日付で練習表を取得"""
        practice_slot = await self.repository.find_by_date(target_date)
        if not practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)
        return practice_slot

    async def get_practice_slot_with_schedule_items(self, practice_slot_id: str) -> Optional[Dict[str, Any]]:
        """練習表とスケジュールアイテムを一緒に取得"""
        practice_slot = await self.repository.find_with_schedule_items(practice_slot_id)
        if not practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)
        return practice_slot

    async def create_practice_slot(self, practice_slot_data: PracticeSlotCreate) -> Dict[str, Any]:
        """練習表を作成"""
        logger.info(f"Creating practice slot for date: {practice_slot_data.date}")

        # 既存の練習表チェック（日付ベース）
        existing_practice_slot = await self.repository.find_by_date(practice_slot_data.date)
        if existing_practice_slot:
            logger.warning(f"Practice slot already exists for date: {practice_slot_data.date}")
            raise APIException(ErrorMessage.PRACTICE_SLOT_ALREADY_EXISTS)

        # 練習表データを準備
        practice_slot_dict = {
            "date": practice_slot_data.date.isoformat(),
            "title": practice_slot_data.title,
            "description": practice_slot_data.description,
            "is_active": practice_slot_data.is_active,
        }

        # リポジトリを通してDBに保存
        logger.info(f"Saving practice slot to DB: {practice_slot_dict}")
        created_practice_slot = await self.repository.create(practice_slot_dict)
        logger.info(f"Created practice slot result: {created_practice_slot}")
        
        if not created_practice_slot or 'id' not in created_practice_slot:
            logger.error(f"Failed to create practice slot, result: {created_practice_slot}")
            raise APIException(ErrorMessage.DATABASE_ERROR)
            
        logger.info(f"Practice slot created successfully for date: {practice_slot_data.date}")
        return created_practice_slot

    async def update_practice_slot(self, practice_slot_id: str, practice_slot_data: dict) -> Optional[Dict[str, Any]]:
        """練習表を更新"""
        # 練習表の存在確認
        existing_practice_slot = await self.repository.find_by_id(practice_slot_id)
        if not existing_practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)

        # 更新データを準備
        update_data = {}
        if "date" in practice_slot_data:
            update_data["date"] = practice_slot_data["date"].isoformat() if isinstance(practice_slot_data["date"], date) else practice_slot_data["date"]
        if "title" in practice_slot_data:
            update_data["title"] = practice_slot_data["title"]
        if "description" in practice_slot_data:
            update_data["description"] = practice_slot_data["description"]
        if "is_active" in practice_slot_data:
            update_data["is_active"] = practice_slot_data["is_active"]

        if not update_data:
            return existing_practice_slot

        # リポジトリを通して更新
        updated_practice_slot = await self.repository.update(practice_slot_id, update_data)
        logger.info(f"Practice slot updated successfully: {practice_slot_id}")
        return updated_practice_slot

    async def delete_practice_slot(self, practice_slot_id: str) -> bool:
        """練習表を削除"""
        # 練習表の存在確認
        practice_slot = await self.repository.find_by_id(practice_slot_id)
        if not practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)

        # リポジトリを通して削除
        await self.repository.delete(practice_slot_id)
        logger.info(f"Practice slot deleted successfully: {practice_slot_id}")
        return True

    async def create_schedule_item(self, practice_slot_id: str, schedule_item_data: ScheduleItemCreate) -> Dict[str, Any]:
        """スケジュールアイテムを作成"""
        logger.info(f"Creating schedule item for practice slot: {practice_slot_id}")

        # 練習表の存在確認
        practice_slot = await self.repository.find_by_id(practice_slot_id)
        if not practice_slot:
            raise APIException(ErrorMessage.PRACTICE_SLOT_NOT_FOUND)

        # スケジュールアイテムデータを準備
        schedule_item_dict = {
            "practice_slot_id": practice_slot_id,
            "time": schedule_item_data.time,
            "duration": schedule_item_data.duration,
            "activity": schedule_item_data.activity,
            "columns": schedule_item_data.columns,
        }

        # リポジトリを通してDBに保存
        logger.info(f"Saving schedule item to DB: {schedule_item_dict}")
        created_schedule_item = await self.repository.create_schedule_item(schedule_item_dict)
        logger.info(f"Schedule item created successfully")
        return created_schedule_item

    async def update_schedule_item(self, schedule_item_id: str, schedule_item_data: dict) -> Optional[Dict[str, Any]]:
        """スケジュールアイテムを更新"""
        # 更新データを準備
        update_data = {}
        if "time" in schedule_item_data:
            update_data["time"] = schedule_item_data["time"]
        if "duration" in schedule_item_data:
            update_data["duration"] = schedule_item_data["duration"]
        if "activity" in schedule_item_data:
            update_data["activity"] = schedule_item_data["activity"]
        if "columns" in schedule_item_data:
            update_data["columns"] = schedule_item_data["columns"]

        if not update_data:
            return None

        # リポジトリを通して更新
        updated_schedule_item = await self.repository.update_schedule_item(schedule_item_id, update_data)
        logger.info(f"Schedule item updated successfully: {schedule_item_id}")
        return updated_schedule_item

    async def delete_schedule_item(self, schedule_item_id: str) -> bool:
        """スケジュールアイテムを削除"""
        # リポジトリを通して削除
        await self.repository.delete_schedule_item(schedule_item_id)
        logger.info(f"Schedule item deleted successfully: {schedule_item_id}")
        return True

    async def create_practice_slot_with_sample_data(self, target_date: date) -> Dict[str, Any]:
        """サンプルデータ付きの練習表を作成（デバッグ用）"""
        logger.info(f"Creating practice slot with sample data for date: {target_date}")

        # 練習表を作成
        practice_slot_data = PracticeSlotCreate(
            date=target_date,
            title=f"{target_date}の練習表",
            description="サンプルデータ付きの練習表です",
            is_active=True
        )
        created_practice_slot = await self.create_practice_slot(practice_slot_data)

        # サンプルスケジュールアイテムを作成
        sample_schedule_items = [
            {
                "time": "19:00",
                "duration": "(5)",
                "activity": "集合・挨拶",
                "columns": ["", "", "", "", ""]
            },
            {
                "time": "19:05",
                "duration": "(10)",
                "activity": "女子準備",
                "columns": ["", "男子準備", "", "", ""]
            },
            {
                "time": "19:15",
                "duration": "(20)",
                "activity": "○○パート\n××パート\n△△パート",
                "columns": [
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート"
                ]
            },
            {
                "time": "19:35",
                "duration": "(15)",
                "activity": "○○パート\n××パート\n△△パート",
                "columns": [
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート"
                ]
            },
            {
                "time": "19:50",
                "duration": "(20)",
                "activity": "○○パート\n××パート\n△△パート",
                "columns": [
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート"
                ]
            },
            {
                "time": "20:10",
                "duration": "(15)",
                "activity": "○○パート\n××パート\n△△パート",
                "columns": [
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート"
                ]
            },
            {
                "time": "20:25",
                "duration": "(20)",
                "activity": "○○パート\n××パート\n△△パート",
                "columns": [
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート",
                    "○○パート\n××パート\n△△パート"
                ]
            },
            {
                "time": "20:45",
                "duration": "",
                "activity": "集合・整上坊・挨拶",
                "columns": ["", "", "", "", ""]
            }
        ]

        # 各スケジュールアイテムを作成
        for item_data in sample_schedule_items:
            schedule_item = ScheduleItemCreate(
                practice_slot_id=created_practice_slot["id"],
                time=item_data["time"],
                duration=item_data["duration"],
                activity=item_data["activity"],
                columns=item_data["columns"]
            )
            await self.create_schedule_item(created_practice_slot["id"], schedule_item)

        # 作成された練習表とスケジュールアイテムを取得して返す
        return await self.get_practice_slot_with_schedule_items(created_practice_slot["id"])
