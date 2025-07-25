"""
パートサービスのユニットテスト
TDDアプローチに従い、期待される入出力を定義
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import List, Dict, Any

import pytest


class TestPartService:
    """パートサービスのテストクラス"""
    
    def setup_method(self):
        """テスト準備"""
        self.mock_part_repository = Mock()
        self.sample_category = Mock()
        self.sample_category.id = 1
        self.sample_category.name = "謡"
        self.sample_category.description = "謡のパート"
        
        self.part_id = uuid4()
        self.sample_part = Mock()
        self.sample_part.id = self.part_id
        self.sample_part.name = "シテ"
        self.sample_part.code = "SHITE"
        self.sample_part.category_id = 1
        self.sample_part.is_active = True
    
    def test_init_service(self):
        """サービス初期化テスト"""
        from app.services.part_service import PartService
        
        service = PartService(self.mock_part_repository)
        
        assert service._part_repository == self.mock_part_repository
        assert hasattr(service, '_logger')
    
    @pytest.mark.asyncio
    async def test_get_all_categories(self):
        """全カテゴリ取得テスト"""
        from app.services.part_service import PartService
        
        # モックリポジトリの設定
        self.mock_part_repository.get_categories = AsyncMock(return_value=[self.sample_category])
        
        service = PartService(self.mock_part_repository)
        categories = await service.get_all_categories()
        
        assert len(categories) == 1
        assert categories[0].name == "謡"
        
        # リポジトリが呼ばれたことを確認
        self.mock_part_repository.get_categories.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_category(self):
        """カテゴリ作成テスト"""
        from app.services.part_service import PartService
        from app.schemas.part_schemas import CategoryCreate
        
        # モックリポジトリの設定
        self.mock_part_repository.create_category = AsyncMock(return_value=self.sample_category)
        
        service = PartService(self.mock_part_repository)
        category_data = CategoryCreate(
            name="踊",
            description="踊のパート",
            attributes={"type": "dance"}
        )
        
        category = await service.create_category(category_data)
        
        assert category.name == "謡"  # mockで返される値
        
        # リポジトリが正しいデータで呼ばれたことを確認
        self.mock_part_repository.create_category.assert_called_once()
        call_args = self.mock_part_repository.create_category.call_args[0][0]
        assert call_args["name"] == "踊"
    
    @pytest.mark.asyncio
    async def test_get_all_parts(self):
        """全パート取得テスト"""
        from app.services.part_service import PartService
        
        # モックリポジトリの設定
        self.mock_part_repository.get_parts = AsyncMock(return_value=[self.sample_part])
        
        service = PartService(self.mock_part_repository)
        parts = await service.get_all_parts()
        
        assert len(parts) == 1
        assert parts[0].name == "シテ"
        
        self.mock_part_repository.get_parts.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_part_details(self):
        """パート詳細取得テスト"""
        from app.services.part_service import PartService
        
        # モックリポジトリの設定
        self.mock_part_repository.get_part = AsyncMock(return_value=self.sample_part)
        
        service = PartService(self.mock_part_repository)
        part = await service.get_part_details(self.part_id)
        
        assert part.id == self.part_id
        assert part.name == "シテ"
        
        self.mock_part_repository.get_part.assert_called_once_with(self.part_id)
    
    @pytest.mark.asyncio
    async def test_create_part(self):
        """パート作成テスト"""
        from app.services.part_service import PartService
        from app.schemas.part_schemas import PartCreate
        
        # モックリポジトリの設定
        self.mock_part_repository.create_part = AsyncMock(return_value=self.sample_part)
        
        service = PartService(self.mock_part_repository)
        part_data = PartCreate(
            category_id=1,
            name="シテ",
            code="SHITE",
            description="主役パート",
            requirements={"experience_years": 5}
        )
        
        part = await service.create_part(part_data)
        
        assert part.name == "シテ"
        
        # リポジトリが正しいデータで呼ばれたことを確認
        self.mock_part_repository.create_part.assert_called_once()
        call_args = self.mock_part_repository.create_part.call_args[0][0]
        assert call_args["name"] == "シテ"
        assert call_args["code"] == "SHITE"
    
    @pytest.mark.asyncio
    async def test_get_part_hierarchy(self):
        """パート階層取得テスト"""
        from app.services.part_service import PartService
        
        # モック階層データ
        mock_tree = {
            "parts": [
                {
                    "id": str(self.part_id),
                    "name": "シテ",
                    "children": []
                }
            ]
        }
        self.mock_part_repository.get_part_tree = AsyncMock(return_value=mock_tree)
        
        service = PartService(self.mock_part_repository)
        hierarchy = await service.get_part_hierarchy()
        
        assert "parts" in hierarchy
        assert len(hierarchy["parts"]) == 1
        assert hierarchy["parts"][0]["name"] == "シテ"
        
        self.mock_part_repository.get_part_tree.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_category_parts(self):
        """カテゴリ別パート取得テスト"""
        from app.services.part_service import PartService
        
        # モックリポジトリの設定
        self.mock_part_repository.get_parts_by_category = AsyncMock(return_value=[self.sample_part])
        
        service = PartService(self.mock_part_repository)
        parts = await service.get_category_parts(1)
        
        assert len(parts) == 1
        assert parts[0].category_id == 1
        
        self.mock_part_repository.get_parts_by_category.assert_called_once_with(1)
    
    @pytest.mark.asyncio
    async def test_validate_part_structure(self):
        """パート構造検証テスト"""
        from app.services.part_service import PartService
        
        # モックリポジトリの設定
        self.mock_part_repository.get_part = AsyncMock(return_value=self.sample_part)
        self.mock_part_repository.get_child_parts = AsyncMock(return_value=[])
        
        service = PartService(self.mock_part_repository)
        is_valid = await service.validate_part_structure(self.part_id)
        
        assert isinstance(is_valid, bool)
        assert is_valid is True  # 有効なパートとして返される
        
        self.mock_part_repository.get_part.assert_called_once_with(self.part_id)
    
    @pytest.mark.asyncio
    async def test_deactivate_part(self):
        """パート無効化テスト"""
        from app.services.part_service import PartService
        
        # 無効化後のパートモック
        deactivated_part = Mock()
        deactivated_part.id = self.part_id
        deactivated_part.is_active = False
        deactivated_part.name = "シテ"
        
        self.mock_part_repository.update_part = AsyncMock(return_value=deactivated_part)
        
        service = PartService(self.mock_part_repository)
        part = await service.deactivate_part(self.part_id)
        
        assert part.is_active is False
        
        # 無効化のためにupdate_partが呼ばれたことを確認
        self.mock_part_repository.update_part.assert_called_once()
        call_args = self.mock_part_repository.update_part.call_args[0]
        assert call_args[0] == self.part_id
        assert call_args[1]["is_active"] is False
    
    @pytest.mark.asyncio
    async def test_reactivate_part(self):
        """パート再有効化テスト"""
        from app.services.part_service import PartService
        
        # 再有効化後のパートモック
        reactivated_part = Mock()
        reactivated_part.id = self.part_id
        reactivated_part.is_active = True
        reactivated_part.name = "シテ"
        
        self.mock_part_repository.update_part = AsyncMock(return_value=reactivated_part)
        
        service = PartService(self.mock_part_repository)
        part = await service.reactivate_part(self.part_id)
        
        assert part.is_active is True
        
        # 再有効化のためにupdate_partが呼ばれたことを確認
        self.mock_part_repository.update_part.assert_called_once()
        call_args = self.mock_part_repository.update_part.call_args[0]
        assert call_args[0] == self.part_id
        assert call_args[1]["is_active"] is True