"""
StageService - ビジネスロジック層の実装
舞台情報の管理に関する業務処理を提供
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.stage_repository import StageRepository
from app.repositories.part_repository import PartRepository
from app.schemas.stage import StageCreate, StageResponse, StageUpdate
from supabase import Client

logger = logging.getLogger(__name__)


class StageService:
    """
    舞台情報の管理を行うサービスクラス
    """

    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.repository = StageRepository(client)

    async def get_all_stages(self) -> list[StageResponse]:
        """
        全ての舞台情報を取得

        Returns:
            舞台情報のリスト
        """
        try:
            response = self.client.table("stages").select("*").order("created_at", desc=True).execute()
            
            if not response.data:
                logger.info("No stages found")
                return []

            stages = [StageResponse(**stage) for stage in response.data]
            logger.info(f"Retrieved {len(stages)} stages")
            return stages

        except Exception as e:
            logger.error(f"Failed to get all stages: {str(e)}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def get_stage_by_id(self, stage_id: str) -> StageResponse:
        """
        IDで舞台情報を取得

        Args:
            stage_id: 舞台ID

        Returns:
            舞台情報

        Raises:
            APIException: 舞台が見つからない場合
        """
        try:
            uuid_stage_id = UUID(stage_id)
        except ValueError:
            logger.error(f"Invalid stage ID format: {stage_id}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        stage_data = await self.repository.find_by_id(uuid_stage_id)
        
        if not stage_data:
            logger.error(f"Stage not found: {stage_id}")
            raise APIException(ErrorMessage.STAGE_NOT_FOUND)

        return StageResponse(**stage_data)

    async def create_stage(self, stage_data: dict[str, Any]) -> StageResponse:
        """
        新しい舞台を作成

        Args:
            stage_data: 舞台作成データ

        Returns:
            作成された舞台情報

        Raises:
            APIException: 作成に失敗した場合
        """
        try:
            # 日付型をISO文字列形式に変換
            processed_data = self._serialize_dates(stage_data)
            
            response = (
                self.client.table("stages")
                .insert(processed_data)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                logger.error("Failed to create stage")
                raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

            created_stage = response.data[0]
            logger.info(f"Created stage with id: {created_stage['id']}")
            return StageResponse(**created_stage)

        except APIException:
            raise
        except Exception as e:
            logger.error(f"Failed to create stage: {str(e)}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def update_stage(self, stage_id: str, update_data: dict[str, Any]) -> StageResponse:
        """
        舞台情報を更新

        Args:
            stage_id: 舞台ID
            update_data: 更新データ

        Returns:
            更新された舞台情報

        Raises:
            APIException: 舞台が見つからない、または更新に失敗した場合
        """
        try:
            uuid_stage_id = UUID(stage_id)
        except ValueError:
            logger.error(f"Invalid stage ID format: {stage_id}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        # 舞台の存在確認
        if not await self.repository.exists(uuid_stage_id):
            logger.error(f"Stage not found for update: {stage_id}")
            raise APIException(ErrorMessage.STAGE_NOT_FOUND)

        try:
            # 日付型をISO文字列形式に変換
            processed_data = self._serialize_dates(update_data)
            
            response = (
                self.client.table("stages")
                .update(processed_data)
                .eq("id", stage_id)
                .execute()
            )

            if not response.data or len(response.data) == 0:
                logger.error(f"Failed to update stage: {stage_id}")
                raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

            updated_stage = response.data[0]
            logger.info(f"Updated stage with id: {stage_id}")
            return StageResponse(**updated_stage)

        except APIException:
            raise
        except Exception as e:
            logger.error(f"Failed to update stage {stage_id}: {str(e)}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def delete_stage(self, stage_id: str) -> None:
        """
        舞台を削除

        Args:
            stage_id: 舞台ID

        Raises:
            APIException: 舞台が見つからない、または削除に失敗した場合
        """
        try:
            uuid_stage_id = UUID(stage_id)
        except ValueError:
            logger.error(f"Invalid stage ID format: {stage_id}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        # 舞台の存在確認
        if not await self.repository.exists(uuid_stage_id):
            logger.error(f"Stage not found for deletion: {stage_id}")
            raise APIException(ErrorMessage.STAGE_NOT_FOUND)

        try:
            response = (
                self.client.table("stages")
                .delete()
                .eq("id", stage_id)
                .execute()
            )

            logger.info(f"Deleted stage with id: {stage_id}")

        except Exception as e:
            logger.error(f"Failed to delete stage {stage_id}: {str(e)}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    async def get_stages_by_status(self, status: str) -> list[StageResponse]:
        """
        ステータスで舞台を絞り込み取得

        Args:
            status: ステータス (active/inactive)

        Returns:
            指定されたステータスの舞台情報リスト
        """
        if status not in ["active", "inactive"]:
            logger.error(f"Invalid status: {status}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        try:
            response = (
                self.client.table("stages")
                .select("*")
                .eq("status", status)
                .order("created_at", desc=True)
                .execute()
            )
            
            if not response.data:
                logger.info(f"No stages found with status: {status}")
                return []

            stages = [StageResponse(**stage) for stage in response.data]
            logger.info(f"Retrieved {len(stages)} stages with status: {status}")
            return stages

        except APIException:
            raise
        except Exception as e:
            logger.error(f"Failed to get stages by status {status}: {str(e)}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

    def _serialize_dates(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        日付型をISO文字列形式に変換する

        Args:
            data: 変換対象のデータ辞書

        Returns:
            日付が文字列に変換されたデータ辞書
        """
        processed_data = data.copy()
        
        for key, value in processed_data.items():
            if isinstance(value, date):
                processed_data[key] = value.isoformat()
            elif isinstance(value, datetime):
                processed_data[key] = value.isoformat()
                
        return processed_data
