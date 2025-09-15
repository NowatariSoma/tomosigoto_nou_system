import logging
from typing import Any, Dict, List, Optional
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.parts_repository import PartsRepository
from app.schemas.parts import PartCreate, PartUpdate
from uuid import uuid4

logger = logging.getLogger(__name__)


class PartsService:
    def __init__(self, repository: PartsRepository):
        self.repository = repository

    async def get_all_parts(self) -> List[Dict[str, Any]]:
        """すべてのパートを取得"""
        return await self.repository.find_all()

    async def get_part_by_id(self, part_id: str) -> Optional[Dict[str, Any]]:
        """IDでパートを取得"""
        return await self.repository.find_by_id(part_id)

    async def get_part_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """名前でパートを取得"""
        return await self.repository.find_by_name(name)

    async def create_part(self, part_data: PartCreate) -> Dict[str, Any]:
        """新しいパートを作成"""
        # 名前の重複チェック
        existing_part = await self.repository.find_by_name(part_data.name)
        if existing_part:
            raise APIException(ErrorMessage.PART_ALREADY_EXISTS)

        # パートデータを辞書に変換
        part_dict = {
            "id": str(uuid4()),
            "name": part_data.name,
            "display_name": part_data.display_name,
            "description": part_data.description,
            "is_active": part_data.is_active,
            "sort_order": part_data.sort_order
        }

        result = await self.repository.create(part_dict)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return result

    async def update_part(self, part_id: str, part_data: PartUpdate) -> Dict[str, Any]:
        """パートを更新"""
        # パートの存在確認
        existing_part = await self.repository.find_by_id(part_id)
        if not existing_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        # 名前の重複チェック（名前が変更される場合）
        if part_data.name and part_data.name != existing_part["name"]:
            existing_by_name = await self.repository.find_by_name(part_data.name)
            if existing_by_name:
                raise APIException(ErrorMessage.PART_ALREADY_EXISTS)

        # 更新データを辞書に変換（Noneの値は除外）
        update_dict = {}
        if part_data.name is not None:
            update_dict["name"] = part_data.name
        if part_data.display_name is not None:
            update_dict["display_name"] = part_data.display_name
        if part_data.description is not None:
            update_dict["description"] = part_data.description
        if part_data.is_active is not None:
            update_dict["is_active"] = part_data.is_active
        if part_data.sort_order is not None:
            update_dict["sort_order"] = part_data.sort_order

        result = await self.repository.update(part_id, update_dict)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return result

    async def delete_part(self, part_id: str) -> bool:
        """パートを削除"""
        # パートの存在確認
        existing_part = await self.repository.find_by_id(part_id)
        if not existing_part:
            raise APIException(ErrorMessage.PART_NOT_FOUND)

        result = await self.repository.delete(part_id)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return True




