"""
パート管理のビジネスロジック実装
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
import logging
from typing import List, Dict, Any
from uuid import UUID

from app.repositories.part_repository import PartRepository
from app.schemas.part_schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse, PartCreate, PartResponse
)


logger = logging.getLogger(__name__)


class PartService:
    """パート管理のビジネスロジックを実装するサービス"""
    
    def __init__(self, part_repository: PartRepository):
        """
        サービスの初期化
        
        Args:
            part_repository: パートリポジトリ
        """
        self._part_repository = part_repository
        self._logger = logger
    
    async def get_all_categories(self) -> List[CategoryResponse]:
        """全カテゴリ取得"""
        categories = await self._part_repository.get_categories()
        
        return [
            CategoryResponse(
                id=category.id,
                name=category.name,
                description=category.description,
                attributes=category.attributes,
                created_at=category.created_at
            )
            for category in categories
        ]
    
    async def create_category(self, category_data: CategoryCreate) -> CategoryResponse:
        """カテゴリ作成"""
        # ビジネスロジック：カテゴリ名の重複チェックなど
        existing_categories = await self._part_repository.get_categories()
        for existing in existing_categories:
            if existing.name == category_data.name:
                raise ValueError(f"Category with name '{category_data.name}' already exists")
        
        # データ準備
        create_data = {
            "name": category_data.name,
            "description": category_data.description,
            "attributes": category_data.attributes or {}
        }
        
        category = await self._part_repository.create_category(create_data)
        
        return CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            attributes=category.attributes,
            created_at=category.created_at
        )
    
    async def update_category(self, category_id: int, data: CategoryUpdate) -> CategoryResponse:
        """カテゴリ更新"""
        # 存在チェック
        existing_category = await self._part_repository.get_category(category_id)
        if not existing_category:
            raise ValueError(f"Category with id {category_id} not found")
        
        # 名前の重複チェック（名前を変更する場合）
        if data.name is not None and data.name != existing_category.name:
            all_categories = await self._part_repository.get_categories()
            for category in all_categories:
                if category.id != category_id and category.name == data.name:
                    raise ValueError(f"Category with name '{data.name}' already exists")
        
        # Pydanticモデルをdictに変換（Noneでない値のみ）
        update_data = data.model_dump(exclude_unset=True)
        updated_category = await self._part_repository.update_category(category_id, update_data)
        
        return CategoryResponse(
            id=updated_category.id,
            name=updated_category.name,
            description=updated_category.description,
            attributes=updated_category.attributes,
            created_at=updated_category.created_at
        )
    
    async def get_all_parts(self) -> List[PartResponse]:
        """全パート取得"""
        parts = await self._part_repository.get_parts()
        
        return [
            PartResponse(
                id=part.id,
                category_id=part.category_id,
                parent_id=part.parent_id,
                name=part.name,
                code=part.code,
                level=part.level,
                description=part.description,
                requirements=part.requirements,
                attributes=part.attributes,
                is_active=part.is_active,
                created_at=part.created_at
            )
            for part in parts
        ]
    
    async def get_part_details(self, part_id: UUID) -> PartResponse:
        """パート詳細取得"""
        part = await self._part_repository.get_part(part_id)
        
        if not part:
            raise ValueError(f"Part with id {part_id} not found")
        
        return PartResponse(
            id=part.id,
            category_id=part.category_id,
            parent_id=part.parent_id,
            name=part.name,
            code=part.code,
            level=part.level,
            description=part.description,
            requirements=part.requirements,
            attributes=part.attributes,
            is_active=part.is_active,
            created_at=part.created_at
        )
    
    async def create_part(self, part_data: PartCreate) -> PartResponse:
        """パート作成"""
        # ビジネスロジック：コードの重複チェック
        existing_parts = await self._part_repository.get_parts()
        for existing in existing_parts:
            if existing.code == part_data.code:
                raise ValueError(f"Part with code '{part_data.code}' already exists")
        
        # カテゴリ存在チェック
        category = await self._part_repository.get_category(part_data.category_id)
        if not category:
            raise ValueError(f"Category with id {part_data.category_id} not found")
        
        # 親パート存在チェック（指定されている場合）
        if part_data.parent_id:
            parent_part = await self._part_repository.get_part(part_data.parent_id)
            if not parent_part:
                raise ValueError(f"Parent part with id {part_data.parent_id} not found")
            
            # 親パートが同じカテゴリであることを確認
            if parent_part.category_id != part_data.category_id:
                raise ValueError("Parent part must be in the same category")
        
        # データ準備
        create_data = {
            "category_id": part_data.category_id,
            "parent_id": part_data.parent_id,
            "name": part_data.name,
            "code": part_data.code,
            "description": part_data.description,
            "requirements": part_data.requirements or {},
            "attributes": part_data.attributes or {}
        }
        
        part = await self._part_repository.create_part(create_data)
        
        return PartResponse(
            id=part.id,
            category_id=part.category_id,
            parent_id=part.parent_id,
            name=part.name,
            code=part.code,
            level=part.level,
            description=part.description,
            requirements=part.requirements,
            attributes=part.attributes,
            is_active=part.is_active,
            created_at=part.created_at
        )
    
    async def update_part(self, part_id: UUID, data: dict) -> PartResponse:
        """パート更新"""
        # 存在チェック
        existing_part = await self._part_repository.get_part(part_id)
        if not existing_part:
            raise ValueError(f"Part with id {part_id} not found")
        
        # コードの重複チェック（コードを変更する場合）
        if "code" in data and data["code"] != existing_part.code:
            all_parts = await self._part_repository.get_parts()
            for part in all_parts:
                if part.id != part_id and part.code == data["code"]:
                    raise ValueError(f"Part with code '{data['code']}' already exists")
        
        # 親パートの妥当性チェック
        if "parent_id" in data and data["parent_id"]:
            if data["parent_id"] == part_id:
                raise ValueError("Part cannot be its own parent")
            
            parent_part = await self._part_repository.get_part(data["parent_id"])
            if not parent_part:
                raise ValueError(f"Parent part with id {data['parent_id']} not found")
        
        updated_part = await self._part_repository.update_part(part_id, data)
        
        return PartResponse(
            id=updated_part.id,
            category_id=updated_part.category_id,
            parent_id=updated_part.parent_id,
            name=updated_part.name,
            code=updated_part.code,
            level=updated_part.level,
            description=updated_part.description,
            requirements=updated_part.requirements,
            attributes=updated_part.attributes,
            is_active=updated_part.is_active,
            created_at=updated_part.created_at
        )
    
    async def get_part_hierarchy(self) -> Dict:
        """パート階層取得"""
        return await self._part_repository.get_part_tree()
    
    async def get_category_parts(self, category_id: int) -> List[PartResponse]:
        """カテゴリ別パート取得"""
        # カテゴリ存在チェック
        category = await self._part_repository.get_category(category_id)
        if not category:
            raise ValueError(f"Category with id {category_id} not found")
        
        parts = await self._part_repository.get_parts_by_category(category_id)
        
        return [
            PartResponse(
                id=part.id,
                category_id=part.category_id,
                parent_id=part.parent_id,
                name=part.name,
                code=part.code,
                level=part.level,
                description=part.description,
                requirements=part.requirements,
                attributes=part.attributes,
                is_active=part.is_active,
                created_at=part.created_at
            )
            for part in parts
        ]
    
    async def validate_part_structure(self, part_id: UUID) -> bool:
        """パート構造検証"""
        part = await self._part_repository.get_part(part_id)
        if not part:
            return False
        
        # 循環参照チェック
        visited = set()
        current_id = part_id
        
        while current_id:
            if current_id in visited:
                # 循環参照が検出された
                return False
            
            visited.add(current_id)
            current_part = await self._part_repository.get_part(current_id)
            if not current_part:
                break
            
            current_id = current_part.parent_id
        
        return True
    
    async def deactivate_part(self, part_id: UUID) -> PartResponse:
        """パート無効化"""
        part = await self._part_repository.get_part(part_id)
        if not part:
            raise ValueError(f"Part with id {part_id} not found")
        
        updated_part = await self._part_repository.update_part(part_id, {"is_active": False})
        
        return PartResponse(
            id=updated_part.id,
            category_id=updated_part.category_id,
            parent_id=updated_part.parent_id,
            name=updated_part.name,
            code=updated_part.code,
            level=updated_part.level,
            description=updated_part.description,
            requirements=updated_part.requirements,
            attributes=updated_part.attributes,
            is_active=updated_part.is_active,
            created_at=updated_part.created_at
        )
    
    async def reactivate_part(self, part_id: UUID) -> PartResponse:
        """パート再有効化"""
        part = await self._part_repository.get_part(part_id)
        if not part:
            raise ValueError(f"Part with id {part_id} not found")
        
        updated_part = await self._part_repository.update_part(part_id, {"is_active": True})
        
        return PartResponse(
            id=updated_part.id,
            category_id=updated_part.category_id,
            parent_id=updated_part.parent_id,
            name=updated_part.name,
            code=updated_part.code,
            level=updated_part.level,
            description=updated_part.description,
            requirements=updated_part.requirements,
            attributes=updated_part.attributes,
            is_active=updated_part.is_active,
            created_at=updated_part.created_at
        )
    
    async def merge_parts(self, source_id: UUID, target_id: UUID) -> PartResponse:
        """パート統合"""
        # 両方のパートが存在することを確認
        source_part = await self._part_repository.get_part(source_id)
        target_part = await self._part_repository.get_part(target_id)
        
        if not source_part:
            raise ValueError(f"Source part with id {source_id} not found")
        if not target_part:
            raise ValueError(f"Target part with id {target_id} not found")
        
        # 同じカテゴリであることを確認
        if source_part.category_id != target_part.category_id:
            raise ValueError("Parts must be in the same category to merge")
        
        # ソースパートを無効化
        await self._part_repository.update_part(source_id, {"is_active": False})
        
        # 統合処理（実際には、所属などの関連データも移行する必要がある）
        # この実装では、ターゲットパートを返すだけ
        self._logger.info(f"Merged part {source_id} into {target_id}")
        
        return PartResponse(
            id=target_part.id,
            category_id=target_part.category_id,
            parent_id=target_part.parent_id,
            name=target_part.name,
            code=target_part.code,
            level=target_part.level,
            description=target_part.description,
            requirements=target_part.requirements,
            attributes=target_part.attributes,
            is_active=target_part.is_active,
            created_at=target_part.created_at
        )