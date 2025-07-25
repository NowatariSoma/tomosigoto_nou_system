"""
パートデータアクセスレイヤー
BACK-DB-001.2: パート区分・メンバー所属テーブル設計
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.part import PartCategory, PartDefinition
from app.core.exceptions import handle_supabase_errors


logger = logging.getLogger(__name__)


class PartRepository:
    """パートデータにアクセスするリポジトリクラス"""
    
    def __init__(self, db_client):
        """
        リポジトリの初期化
        
        Args:
            db_client: Supabaseクライアント
        """
        self._db_client = db_client
        self._logger = logger
    
    @handle_supabase_errors("get_categories")
    async def get_categories(self) -> List[PartCategory]:
        """全カテゴリを取得"""
        response = self._db_client.table('part_categories').select('*').execute()
        
        categories = []
        if response.data:
            for data in response.data:
                categories.append(PartCategory(**data))
            
        self._logger.info(f"Retrieved {len(categories)} categories")
        return categories
    
    @handle_supabase_errors("get_category")
    async def get_category(self, category_id: int) -> Optional[PartCategory]:
        """特定カテゴリを取得"""
        response = self._db_client.table('part_categories').select('*').eq('id', category_id).execute()
        
        if response.data and len(response.data) > 0:
            return PartCategory(**response.data[0])
        
        return None
    
    @handle_supabase_errors("create_category")
    async def create_category(self, category_data: dict) -> PartCategory:
        """カテゴリを作成"""
        # データの準備
        insert_data = {
            "name": category_data["name"],
            "description": category_data.get("description"),
            "attributes": category_data.get("attributes", {})
        }
        
        response = self._db_client.table('part_categories').insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            self._logger.info(f"Created category: {category_data['name']}")
            return PartCategory(**response.data[0])
        
        raise Exception("Failed to create category")
    
    @handle_supabase_errors("update_category")
    async def update_category(self, category_id: int, data: dict) -> PartCategory:
        """カテゴリを更新"""
        # 更新可能なフィールドのみを抽出
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "attributes" in data:
            update_data["attributes"] = data["attributes"]
        
        if not update_data:
            # 更新するデータがない場合は現在のデータを返す
            return await self.get_category(category_id)
        
        response = self._db_client.table('part_categories').update(update_data).eq('id', category_id).execute()
        
        if response.data and len(response.data) > 0:
            self._logger.info(f"Updated category {category_id}")
            return PartCategory(**response.data[0])
        
        raise Exception(f"Failed to update category {category_id}")
    
    @handle_supabase_errors("get_parts")
    async def get_parts(self) -> List[PartDefinition]:
        """全パートを取得"""
        response = self._db_client.table('part_definitions').select('*').execute()
        
        parts = []
        if response.data:
            for data in response.data:
                # UUIDの文字列を変換
                if 'id' in data and isinstance(data['id'], str):
                    data['id'] = UUID(data['id'])
                if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                    data['parent_id'] = UUID(data['parent_id'])
                
                parts.append(PartDefinition(**data))
        
        self._logger.info(f"Retrieved {len(parts)} parts")
        return parts
    
    @handle_supabase_errors("get_part")
    async def get_part(self, part_id: UUID) -> Optional[PartDefinition]:
        """特定パートを取得"""
        response = self._db_client.table('part_definitions').select('*').eq('id', str(part_id)).execute()
        
        if response.data and len(response.data) > 0:
            data = response.data[0]
            # UUIDの文字列を変換
            if 'id' in data and isinstance(data['id'], str):
                data['id'] = UUID(data['id'])
            if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                data['parent_id'] = UUID(data['parent_id'])
            
            return PartDefinition(**data)
        
        return None
    
    @handle_supabase_errors("create_part")
    async def create_part(self, part_data: dict) -> PartDefinition:
        """パートを作成"""
        # データの準備
        insert_data = {
            "category_id": part_data["category_id"],
            "name": part_data["name"],
            "code": part_data["code"],
            "description": part_data.get("description"),
            "requirements": part_data.get("requirements", {}),
            "attributes": part_data.get("attributes", {})
        }
        
        if "parent_id" in part_data and part_data["parent_id"]:
            insert_data["parent_id"] = str(part_data["parent_id"])
            
            # 親パートのレベルを取得して子パートのレベルを設定
            parent = await self.get_part(part_data["parent_id"])
            if parent:
                insert_data["level"] = parent.level + 1
        
        response = self._db_client.table('part_definitions').insert(insert_data).execute()
        
        if response.data and len(response.data) > 0:
            data = response.data[0]
            # UUIDの文字列を変換
            if 'id' in data and isinstance(data['id'], str):
                data['id'] = UUID(data['id'])
            if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                data['parent_id'] = UUID(data['parent_id'])
            
            self._logger.info(f"Created part: {part_data['name']}")
            return PartDefinition(**data)
        
        raise Exception("Failed to create part")
    
    @handle_supabase_errors("update_part")
    async def update_part(self, part_id: UUID, data: dict) -> PartDefinition:
        """パートを更新"""
        # 更新可能なフィールドのみを抽出
        update_data = {}
        for field in ["category_id", "parent_id", "name", "code", "description", 
                     "requirements", "attributes", "is_active"]:
            if field in data:
                if field == "parent_id" and data[field]:
                    update_data[field] = str(data[field])
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            # 更新するデータがない場合は現在のデータを返す
            return await self.get_part(part_id)
        
        response = self._db_client.table('part_definitions').update(update_data).eq('id', str(part_id)).execute()
        
        if response.data and len(response.data) > 0:
            data = response.data[0]
            # UUIDの文字列を変換
            if 'id' in data and isinstance(data['id'], str):
                data['id'] = UUID(data['id'])
            if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                data['parent_id'] = UUID(data['parent_id'])
            
            self._logger.info(f"Updated part {part_id}")
            return PartDefinition(**data)
        
        raise Exception(f"Failed to update part {part_id}")
    
    @handle_supabase_errors("get_child_parts")
    async def get_child_parts(self, parent_id: UUID) -> List[PartDefinition]:
        """子パートを取得"""
        response = self._db_client.table('part_definitions').select('*').eq('parent_id', str(parent_id)).execute()
        
        parts = []
        if response.data:
            for data in response.data:
                # UUIDの文字列を変換
                if 'id' in data and isinstance(data['id'], str):
                    data['id'] = UUID(data['id'])
                if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                    data['parent_id'] = UUID(data['parent_id'])
                
                parts.append(PartDefinition(**data))
        
        return parts
    
    @handle_supabase_errors("get_part_tree")
    async def get_part_tree(self, root_id: Optional[UUID] = None) -> Dict:
        """パート階層ツリーを取得"""
        # 全パートを取得
        all_parts = await self.get_parts()
        
        # 階層構造を構築
        def build_tree_node(part: PartDefinition, all_parts: List[PartDefinition]) -> Dict:
            children = [
                build_tree_node(child, all_parts)
                for child in all_parts
                if child.parent_id == part.id
            ]
            
            return {
                "id": str(part.id),
                "name": part.name,
                "code": part.code,
                "level": part.level,
                "children": children
            }
        
        # ルートパートを特定
        if root_id:
            root_parts = [p for p in all_parts if p.id == root_id]
        else:
            root_parts = [p for p in all_parts if p.parent_id is None]
        
        # ツリー構造を構築
        tree_nodes = [build_tree_node(part, all_parts) for part in root_parts]
        
        return {
            "parts": tree_nodes,
            "total_count": len(all_parts)
        }
    
    @handle_supabase_errors("get_parts_by_category")
    async def get_parts_by_category(self, category_id: int) -> List[PartDefinition]:
        """カテゴリ別パート取得"""
        response = self._db_client.table('part_definitions').select('*').eq('category_id', category_id).execute()
        
        parts = []
        if response.data:
            for data in response.data:
                # UUIDの文字列を変換
                if 'id' in data and isinstance(data['id'], str):
                    data['id'] = UUID(data['id'])
                if 'parent_id' in data and data['parent_id'] and isinstance(data['parent_id'], str):
                    data['parent_id'] = UUID(data['parent_id'])
                
                parts.append(PartDefinition(**data))
        
        return parts