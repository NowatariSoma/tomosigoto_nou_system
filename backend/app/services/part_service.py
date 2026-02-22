from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.part_repository import PartRepository
from app.repositories.stage_repository import StageRepository

logger = logging.getLogger(__name__)


class PartService:
    """
    パート関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(self, part_repository: PartRepository, stage_repository: StageRepository, auth_client) -> None:
        """
        Args:
            part_repository: PartRepositoryインスタンス
            stage_repository: StageRepositoryインスタンス
            auth_client: Supabase認証クライアント
        """
        self.repository = part_repository
        self.stage_repository = stage_repository
        self.auth_client = auth_client

    async def get_all_parts(self) -> list[dict[str, Any]]:
        """すべてのパートを取得"""
        return await self.repository.find_all()

    async def get_part(self, part_id: UUID) -> dict[str, Any]:
        """IDでパートを取得"""
        part = await self.repository.find_by_id(part_id)
        if not part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)
        return part

    async def get_active_parts(self) -> list[dict[str, Any]]:
        """アクティブなパートのみを取得"""
        return await self.repository.find_active()

    async def create_part(self, part_data: dict[str, Any]) -> dict[str, Any]:
        """パートを作成"""
        # stage_idの存在確認
        if "stage_id" in part_data:
            from uuid import UUID
            try:
                stage_id = UUID(part_data["stage_id"])
                stage_exists = await self.stage_repository.exists(stage_id)
                if not stage_exists:
                    raise APIException(ErrorMessage.STAGE_NOT_FOUND)
            except ValueError:
                raise APIException(ErrorMessage.BAD_REQUEST)
        
        # 既存パートチェック（同名チェック）
        if "name" in part_data:
            existing_part = await self.repository.find_by_name(part_data["name"])
            if existing_part:
                raise APIException(ErrorMessage.PART_ALREADY_EXISTS)

        # リポジトリを通してDBに保存
        created_part = await self.repository.create(part_data)
        logger.info(f"Part created successfully: {part_data.get('name', 'unknown')}")
        return created_part

    async def update_part(
        self, part_id: UUID, part_data: dict[str, Any]
    ) -> dict[str, Any]:
        """パート情報を更新"""
        # パートの存在確認
        existing_part = await self.repository.find_by_id(part_id)
        if not existing_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # 更新データを準備（None値を除外）
        update_data = {k: v for k, v in part_data.items() if v is not None}
        
        if not update_data:
            return existing_part

        # 同名チェック（パート名を更新する場合）
        if "name" in update_data:
            existing_name_part = await self.repository.find_by_name(update_data["name"])
            if existing_name_part and existing_name_part["id"] != str(part_id):
                raise APIException(ErrorMessage.PART_ALREADY_EXISTS)

        # リポジトリを通して更新
        updated_part = await self.repository.update(part_id, update_data)
        if not updated_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)
            
        logger.info(f"Part updated successfully: {part_id}")
        return updated_part

    async def remove_part(self, part_id: UUID) -> bool:
        """パートを削除"""
        # パートの存在確認
        part = await self.repository.find_by_id(part_id)
        if not part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # リポジトリを通してDBから削除
        await self.repository.delete(part_id)
        logger.info(f"Part deleted successfully: {part_id}")
        return True

    async def get_part_count(self) -> int:
        """パート数を取得"""
        return await self.repository.count()

    async def deactivate_part(self, part_id: UUID) -> dict[str, Any]:
        """パートを非アクティブ化（論理削除）"""
        # パートの存在確認
        existing_part = await self.repository.find_by_id(part_id)
        if not existing_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # statusをinactiveに更新
        update_data = {"status": "inactive"}
        updated_part = await self.repository.update(part_id, update_data)
        
        if not updated_part:
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
            
        logger.info(f"Part deactivated successfully: {part_id}")
        return updated_part

    async def activate_part(self, part_id: UUID) -> dict[str, Any]:
        """パートをアクティブ化"""
        # パートの存在確認
        existing_part = await self.repository.find_by_id(part_id)
        if not existing_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # statusをactiveに更新
        update_data = {"status": "active"}
        updated_part = await self.repository.update(part_id, update_data)
        
        if not updated_part:
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
            
        logger.info(f"Part activated successfully: {part_id}")
        return updated_part

    async def get_parts_by_stage_id(self, stage_id: str) -> list[dict[str, Any]]:
        """指定された舞台IDに紐づくパート一覧を取得"""
        # 舞台の存在確認
        try:
            stage_uuid = UUID(stage_id)
            stage_exists = await self.stage_repository.exists(stage_uuid)
            if not stage_exists:
                raise APIException(ErrorMessage.STAGE_NOT_FOUND)
        except ValueError:
            raise APIException(ErrorMessage.BAD_REQUEST)

        # 指定された舞台に紐づくパートを取得
        parts = await self.repository.find_by_stage_id(stage_id)
        logger.info(f"Retrieved {len(parts)} parts for stage_id: {stage_id}")
        return parts
