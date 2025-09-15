import logging
from typing import Any, Dict, List, Optional
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.groups_repository import GroupsRepository
from app.schemas.groups import GroupCreate, GroupUpdate
from uuid import uuid4

logger = logging.getLogger(__name__)


class GroupsService:
    def __init__(self, repository: GroupsRepository):
        self.repository = repository

    async def get_all_groups(self) -> List[Dict[str, Any]]:
        """すべてのグループを取得"""
        return await self.repository.find_all()

    async def get_group_by_id(self, group_id: str) -> Optional[Dict[str, Any]]:
        """IDでグループを取得"""
        return await self.repository.find_by_id(group_id)

    async def get_group_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """名前でグループを取得"""
        return await self.repository.find_by_name(name)

    async def create_group(self, group_data: GroupCreate) -> Dict[str, Any]:
        """新しいグループを作成"""
        # 名前の重複チェック
        existing_group = await self.repository.find_by_name(group_data.name)
        if existing_group:
            raise APIException(ErrorMessage.GROUP_ALREADY_EXISTS)

        # グループデータを辞書に変換
        group_dict = {
            "id": str(uuid4()),
            "name": group_data.name,
            "display_name": group_data.display_name,
            "color": group_data.color,
            "is_active": group_data.is_active,
            "sort_order": group_data.sort_order
        }

        result = await self.repository.create(group_dict)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return result

    async def update_group(self, group_id: str, group_data: GroupUpdate) -> Dict[str, Any]:
        """グループを更新"""
        # グループの存在確認
        existing_group = await self.repository.find_by_id(group_id)
        if not existing_group:
            raise APIException(ErrorMessage.GROUP_NOT_FOUND)

        # 名前の重複チェック（名前が変更される場合）
        if group_data.name and group_data.name != existing_group["name"]:
            existing_by_name = await self.repository.find_by_name(group_data.name)
            if existing_by_name:
                raise APIException(ErrorMessage.GROUP_ALREADY_EXISTS)

        # 更新データを辞書に変換（Noneの値は除外）
        update_dict = {}
        if group_data.name is not None:
            update_dict["name"] = group_data.name
        if group_data.display_name is not None:
            update_dict["display_name"] = group_data.display_name
        if group_data.color is not None:
            update_dict["color"] = group_data.color
        if group_data.is_active is not None:
            update_dict["is_active"] = group_data.is_active
        if group_data.sort_order is not None:
            update_dict["sort_order"] = group_data.sort_order

        result = await self.repository.update(group_id, update_dict)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return result

    async def delete_group(self, group_id: str) -> bool:
        """グループを削除"""
        # グループの存在確認
        existing_group = await self.repository.find_by_id(group_id)
        if not existing_group:
            raise APIException(ErrorMessage.GROUP_NOT_FOUND)

        result = await self.repository.delete(group_id)
        if not result:
            raise APIException(ErrorMessage.DATABASE_ERROR)

        return True




