"""
StageService のユニットテスト

NOTE: StageService は StageRepositoryProtocol を受け取るパターン。
"""
import pytest
from unittest.mock import AsyncMock, Mock
from uuid import UUID, uuid4
from datetime import date

from app.services.stage_service import StageService
from app.core.exceptions import APIException
from tests.helpers.factories import make_stage


class TestStageService:
    """StageService のテスト"""

    def setup_method(self):
        self.stage_data = make_stage(
            id=str(uuid4()),
            name="テスト舞台",
            description="テスト用",
            performance_date="2024-06-15",
            status="active",
            created_at="2024-01-01T00:00:00.000Z",
            updated_at="2024-01-01T00:00:00.000Z",
        )

    def _make_service(self):
        """テスト用のモックリポジトリでServiceを作成"""
        mock_repository = AsyncMock()
        service = StageService(stage_repository=mock_repository)
        return service, mock_repository

    # ===== get_all_stages =====

    @pytest.mark.asyncio
    async def test_get_all_stages_success(self):
        """全舞台取得 - 正常"""
        service, mock_repo = self._make_service()
        mock_repo.find_all.return_value = [self.stage_data]

        result = await service.get_all_stages()

        assert len(result) == 1
        assert result[0].name == "テスト舞台"

    @pytest.mark.asyncio
    async def test_get_all_stages_empty(self):
        """全舞台取得 - 空"""
        service, mock_repo = self._make_service()
        mock_repo.find_all.return_value = []

        result = await service.get_all_stages()

        assert result == []

    @pytest.mark.asyncio
    async def test_get_all_stages_no_data(self):
        """全舞台取得 - data=None"""
        service, mock_repo = self._make_service()
        mock_repo.find_all.return_value = None

        result = await service.get_all_stages()

        assert result == []

    # ===== get_stage_by_id =====

    @pytest.mark.asyncio
    async def test_get_stage_by_id_success(self):
        """ID指定で舞台取得 - 正常"""
        stage_id = self.stage_data["id"]
        service, mock_repo = self._make_service()
        mock_repo.find_by_id.return_value = self.stage_data

        result = await service.get_stage_by_id(stage_id)

        assert result.name == "テスト舞台"

    @pytest.mark.asyncio
    async def test_get_stage_by_id_not_found(self):
        """ID指定で舞台取得 - 存在しない"""
        service, mock_repo = self._make_service()
        mock_repo.find_by_id.return_value = None

        with pytest.raises(APIException):
            await service.get_stage_by_id(str(uuid4()))

    @pytest.mark.asyncio
    async def test_get_stage_by_id_invalid_uuid(self):
        """ID指定で舞台取得 - 無効なUUID"""
        service, mock_repo = self._make_service()

        with pytest.raises(APIException):
            await service.get_stage_by_id("invalid-uuid")

    # ===== create_stage =====

    @pytest.mark.asyncio
    async def test_create_stage_success(self):
        """舞台作成 - 正常"""
        service, mock_repo = self._make_service()
        mock_repo.create.return_value = self.stage_data

        result = await service.create_stage(
            {"name": "テスト舞台", "status": "active"}
        )

        assert result.name == "テスト舞台"

    @pytest.mark.asyncio
    async def test_create_stage_empty_response(self):
        """舞台作成 - 空レスポンス"""
        service, mock_repo = self._make_service()
        mock_repo.create.return_value = {}

        with pytest.raises(APIException):
            await service.create_stage({"name": "テスト"})

    # ===== update_stage =====

    @pytest.mark.asyncio
    async def test_update_stage_success(self):
        """舞台更新 - 正常"""
        stage_id = self.stage_data["id"]
        service, mock_repo = self._make_service()
        mock_repo.exists.return_value = True
        mock_repo.update.return_value = self.stage_data

        result = await service.update_stage(stage_id, {"name": "更新舞台"})

        assert result.name == "テスト舞台"  # モックデータそのまま返る

    @pytest.mark.asyncio
    async def test_update_stage_not_found(self):
        """舞台更新 - 存在しない"""
        service, mock_repo = self._make_service()
        mock_repo.exists.return_value = False

        with pytest.raises(APIException):
            await service.update_stage(str(uuid4()), {"name": "更新"})

    @pytest.mark.asyncio
    async def test_update_stage_invalid_uuid(self):
        """舞台更新 - 無効なUUID"""
        service, mock_repo = self._make_service()

        with pytest.raises(APIException):
            await service.update_stage("invalid", {"name": "更新"})

    # ===== delete_stage =====

    @pytest.mark.asyncio
    async def test_delete_stage_success(self):
        """舞台削除 - 正常"""
        stage_id = self.stage_data["id"]
        service, mock_repo = self._make_service()
        mock_repo.exists.return_value = True
        mock_repo.delete.return_value = True

        # 例外を発生しなければ成功
        await service.delete_stage(stage_id)

    @pytest.mark.asyncio
    async def test_delete_stage_not_found(self):
        """舞台削除 - 存在しない"""
        service, mock_repo = self._make_service()
        mock_repo.exists.return_value = False

        with pytest.raises(APIException):
            await service.delete_stage(str(uuid4()))

    # ===== get_stages_by_status =====

    @pytest.mark.asyncio
    async def test_get_stages_by_status_active(self):
        """ステータスで舞台取得 - active"""
        service, mock_repo = self._make_service()
        mock_repo.find_by_status.return_value = [self.stage_data]

        result = await service.get_stages_by_status("active")

        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_stages_by_status_invalid(self):
        """ステータスで舞台取得 - 無効なステータス"""
        service, mock_repo = self._make_service()

        with pytest.raises(APIException):
            await service.get_stages_by_status("unknown")

    # ===== _serialize_dates =====

    def test_serialize_dates(self):
        """日付型のシリアライズ"""
        service, _ = self._make_service()
        data = {
            "name": "テスト",
            "performance_date": date(2024, 6, 15),
        }

        result = service._serialize_dates(data)

        assert result["performance_date"] == "2024-06-15"
        assert result["name"] == "テスト"

    def test_serialize_dates_no_dates(self):
        """日付型なしデータのシリアライズ"""
        service, _ = self._make_service()
        data = {"name": "テスト", "status": "active"}

        result = service._serialize_dates(data)

        assert result == data
