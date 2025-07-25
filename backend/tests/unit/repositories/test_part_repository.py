"""
パートリポジトリのユニットテスト
TDDアプローチに従い、期待される入出力を定義
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import List, Dict, Any

import pytest


class TestPartRepository:
    """パートリポジトリのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.mock_db_client = Mock()
        self.sample_category_data = {
            "id": 1,
            "name": "謡",
            "description": "謡のパート",
            "attributes": {"type": "vocal"},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        self.part_id = uuid4()
        self.sample_part_data = {
            "id": str(self.part_id),
            "category_id": 1,
            "parent_id": None,
            "name": "シテ",
            "code": "SHITE",
            "level": 1,
            "description": "主役パート",
            "requirements": {"experience_years": 5},
            "attributes": {"stage_position": "center"},
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_init_repository(self):
        """リポジトリ初期化テスト"""
        from app.repositories.part_repository import PartRepository
        
        repo = PartRepository(self.mock_db_client)
        
        assert repo._db_client == self.mock_db_client
        assert hasattr(repo, '_logger')
    
    @pytest.mark.asyncio
    async def test_get_categories(self):
        """全カテゴリ取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_category_data]
        self.mock_db_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        categories = await repo.get_categories()
        
        assert len(categories) == 1
        assert categories[0].name == "謡"
        assert categories[0].id == 1
        
        # DBクライアントが正しく呼ばれたことを確認
        self.mock_db_client.table.assert_called_with('part_categories')
    
    @pytest.mark.asyncio
    async def test_get_category(self):
        """特定カテゴリ取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_category_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        category = await repo.get_category(1)
        
        assert category is not None
        assert category.name == "謡"
        assert category.id == 1
    
    @pytest.mark.asyncio
    async def test_create_category(self):
        """カテゴリ作成テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_category_data]
        self.mock_db_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        category_data = {
            "name": "謡",
            "description": "謡のパート",
            "attributes": {"type": "vocal"}
        }
        
        category = await repo.create_category(category_data)
        
        assert category.name == "謡"
        self.mock_db_client.table.assert_called_with('part_categories')
    
    @pytest.mark.asyncio
    async def test_get_parts(self):
        """全パート取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_part_data]
        self.mock_db_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        parts = await repo.get_parts()
        
        assert len(parts) == 1
        assert parts[0].name == "シテ"
        assert parts[0].code == "SHITE"
        
        self.mock_db_client.table.assert_called_with('part_definitions')
    
    @pytest.mark.asyncio
    async def test_get_part(self):
        """特定パート取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_part_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        part = await repo.get_part(self.part_id)
        
        assert part is not None
        assert part.name == "シテ"
        assert part.id == self.part_id
    
    @pytest.mark.asyncio
    async def test_create_part(self):
        """パート作成テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_part_data]
        self.mock_db_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        part_data = {
            "category_id": 1,
            "name": "シテ",
            "code": "SHITE",
            "level": 1,
            "requirements": {"experience_years": 5}
        }
        
        part = await repo.create_part(part_data)
        
        assert part.name == "シテ"
        assert part.code == "SHITE"
        self.mock_db_client.table.assert_called_with('part_definitions')
    
    @pytest.mark.asyncio
    async def test_get_child_parts(self):
        """子パート取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        parent_id = uuid4()
        child_part_data = self.sample_part_data.copy()
        child_part_data["parent_id"] = str(parent_id)
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [child_part_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        child_parts = await repo.get_child_parts(parent_id)
        
        assert len(child_parts) == 1
        assert child_parts[0].parent_id == parent_id
    
    @pytest.mark.asyncio
    async def test_get_part_tree(self):
        """パート階層ツリー取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # 階層構造のモックデータ
        root_part = self.sample_part_data.copy()
        root_part["parent_id"] = None
        
        child_part = self.sample_part_data.copy()
        child_part["id"] = str(uuid4())
        child_part["parent_id"] = str(self.part_id)
        child_part["name"] = "ワキ"
        child_part["level"] = 2
        
        mock_response = Mock()
        mock_response.data = [root_part, child_part]
        self.mock_db_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        tree = await repo.get_part_tree()
        
        assert isinstance(tree, dict)
        assert "parts" in tree
        # 階層構造が正しく構築されていることを確認
        parts = tree["parts"]
        assert len(parts) > 0
    
    @pytest.mark.asyncio
    async def test_get_parts_by_category(self):
        """カテゴリ別パート取得テスト"""
        from app.repositories.part_repository import PartRepository
        
        # モックレスポンス設定
        mock_response = Mock()
        mock_response.data = [self.sample_part_data]
        self.mock_db_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        repo = PartRepository(self.mock_db_client)
        parts = await repo.get_parts_by_category(1)
        
        assert len(parts) == 1
        assert parts[0].category_id == 1
        
        # 正しいフィルター条件で呼ばれたことを確認
        self.mock_db_client.table.return_value.select.return_value.eq.assert_called_with('category_id', 1)