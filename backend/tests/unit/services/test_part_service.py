"""
PartService のユニットテスト
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import UUID, uuid4

from app.services.part_service import PartService
from app.core.exceptions import APIException
from tests.helpers.factories import make_part


class TestPartService:
    """PartService のテスト"""

    def setup_method(self):
        self.mock_repo = AsyncMock()
        self.mock_stage_repo = AsyncMock()
        self.mock_auth_client = Mock()
        self.service = PartService(
            part_repository=self.mock_repo,
            stage_repository=self.mock_stage_repo,
            auth_client=self.mock_auth_client,
        )

    # ===== get_all_parts =====

    @pytest.mark.asyncio
    async def test_get_all_parts(self):
        """全パート取得"""
        parts = [make_part(), make_part(name="パート2")]
        self.mock_repo.find_all.return_value = parts

        result = await self.service.get_all_parts()

        assert result == parts
        self.mock_repo.find_all.assert_called_once()

    # ===== get_part =====

    @pytest.mark.asyncio
    async def test_get_part_success(self):
        """ID指定でパート取得 - 正常"""
        part_id = uuid4()
        part = make_part(id=str(part_id))
        self.mock_repo.find_by_id.return_value = part

        result = await self.service.get_part(part_id)

        assert result == part

    @pytest.mark.asyncio
    async def test_get_part_not_found(self):
        """ID指定でパート取得 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.get_part(uuid4())

    # ===== get_active_parts =====

    @pytest.mark.asyncio
    async def test_get_active_parts(self):
        """アクティブパートのみ取得"""
        parts = [make_part(status="active")]
        self.mock_repo.find_active.return_value = parts

        result = await self.service.get_active_parts()

        assert result == parts

    # ===== create_part =====

    @pytest.mark.asyncio
    async def test_create_part_success(self):
        """パート作成 - 正常"""
        stage_id = str(uuid4())
        part_data = {"name": "新パート", "stage_id": stage_id}
        created = make_part(name="新パート", stage_id=stage_id)

        self.mock_stage_repo.exists.return_value = True
        self.mock_repo.find_by_name.return_value = None
        self.mock_repo.create.return_value = created

        result = await self.service.create_part(part_data)

        assert result == created

    @pytest.mark.asyncio
    async def test_create_part_stage_not_found(self):
        """パート作成 - 舞台が存在しない"""
        stage_id = str(uuid4())
        part_data = {"name": "新パート", "stage_id": stage_id}

        self.mock_stage_repo.exists.return_value = False

        with pytest.raises(APIException):
            await self.service.create_part(part_data)

        self.mock_repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_part_invalid_stage_id(self):
        """パート作成 - stage_idが無効なUUID"""
        part_data = {"name": "新パート", "stage_id": "not-a-uuid"}

        with pytest.raises(APIException):
            await self.service.create_part(part_data)

    @pytest.mark.asyncio
    async def test_create_part_duplicate_name(self):
        """パート作成 - 同名パートが存在する"""
        stage_id = str(uuid4())
        part_data = {"name": "既存パート", "stage_id": stage_id}

        self.mock_stage_repo.exists.return_value = True
        self.mock_repo.find_by_name.return_value = make_part(name="既存パート")

        with pytest.raises(APIException):
            await self.service.create_part(part_data)

        self.mock_repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_part_without_stage_id(self):
        """パート作成 - stage_idなし"""
        part_data = {"name": "新パート"}
        created = make_part(name="新パート")

        self.mock_repo.find_by_name.return_value = None
        self.mock_repo.create.return_value = created

        result = await self.service.create_part(part_data)

        assert result == created
        self.mock_stage_repo.exists.assert_not_called()

    # ===== update_part =====

    @pytest.mark.asyncio
    async def test_update_part_success(self):
        """パート更新 - 正常"""
        part_id = uuid4()
        existing = make_part(id=str(part_id), name="旧名")
        update_data = {"name": "新名"}
        updated = make_part(id=str(part_id), name="新名")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.find_by_name.return_value = None
        self.mock_repo.update.return_value = updated

        result = await self.service.update_part(part_id, update_data)

        assert result == updated

    @pytest.mark.asyncio
    async def test_update_part_not_found(self):
        """パート更新 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.update_part(uuid4(), {"name": "新名"})

    @pytest.mark.asyncio
    async def test_update_part_empty_data(self):
        """パート更新 - 空データの場合は既存を返す"""
        part_id = uuid4()
        existing = make_part(id=str(part_id))

        self.mock_repo.find_by_id.return_value = existing

        result = await self.service.update_part(part_id, {"name": None})

        assert result == existing
        self.mock_repo.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_part_duplicate_name(self):
        """パート更新 - 名前が重複する場合"""
        part_id = uuid4()
        other_part_id = str(uuid4())
        existing = make_part(id=str(part_id), name="旧名")
        existing_name_part = make_part(id=other_part_id, name="既存名")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.find_by_name.return_value = existing_name_part

        with pytest.raises(APIException):
            await self.service.update_part(part_id, {"name": "既存名"})

    # ===== remove_part =====

    @pytest.mark.asyncio
    async def test_remove_part_success(self):
        """パート削除 - 正常"""
        part_id = uuid4()
        self.mock_repo.find_by_id.return_value = make_part(id=str(part_id))
        self.mock_repo.delete.return_value = None

        result = await self.service.remove_part(part_id)

        assert result is True

    @pytest.mark.asyncio
    async def test_remove_part_not_found(self):
        """パート削除 - 存在しない"""
        self.mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await self.service.remove_part(uuid4())

    # ===== deactivate_part / activate_part =====

    @pytest.mark.asyncio
    async def test_deactivate_part_success(self):
        """パート非アクティブ化"""
        part_id = uuid4()
        existing = make_part(id=str(part_id), status="active")
        deactivated = make_part(id=str(part_id), status="inactive")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.update.return_value = deactivated

        result = await self.service.deactivate_part(part_id)

        assert result["status"] == "inactive"
        self.mock_repo.update.assert_called_once_with(part_id, {"status": "inactive"})

    @pytest.mark.asyncio
    async def test_activate_part_success(self):
        """パートアクティブ化"""
        part_id = uuid4()
        existing = make_part(id=str(part_id), status="inactive")
        activated = make_part(id=str(part_id), status="active")

        self.mock_repo.find_by_id.return_value = existing
        self.mock_repo.update.return_value = activated

        result = await self.service.activate_part(part_id)

        assert result["status"] == "active"

    # ===== get_parts_by_stage_id =====

    @pytest.mark.asyncio
    async def test_get_parts_by_stage_id_success(self):
        """舞台IDでパート取得 - 正常"""
        stage_id = str(uuid4())
        parts = [make_part(stage_id=stage_id)]

        self.mock_stage_repo.exists.return_value = True
        self.mock_repo.find_by_stage_id.return_value = parts

        result = await self.service.get_parts_by_stage_id(stage_id)

        assert result == parts

    @pytest.mark.asyncio
    async def test_get_parts_by_stage_id_not_found(self):
        """舞台IDでパート取得 - 舞台が存在しない"""
        stage_id = str(uuid4())
        self.mock_stage_repo.exists.return_value = False

        with pytest.raises(APIException):
            await self.service.get_parts_by_stage_id(stage_id)

    @pytest.mark.asyncio
    async def test_get_parts_by_stage_id_invalid(self):
        """舞台IDでパート取得 - 無効なUUID"""
        with pytest.raises(APIException):
            await self.service.get_parts_by_stage_id("not-a-uuid")

    # ===== get_part_count =====

    @pytest.mark.asyncio
    async def test_get_part_count(self):
        """パート数取得"""
        self.mock_repo.count.return_value = 5

        result = await self.service.get_part_count()

        assert result == 5
