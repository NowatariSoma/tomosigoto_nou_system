"""
会場サービスのテスト
"""
import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime, date, time
from uuid import uuid4
from typing import List, Optional, Dict, Any

from app.services.venue_service import VenueService
from app.schemas.venue_schemas import (
    VenueCreate, VenueUpdate, VenueResponse,
    AvailabilitySlotCreate, RecurringSlotCreate
)
from app.core.exceptions import VenueNotFoundError, VenueCodeDuplicateError


@pytest.fixture
def mock_venue_repository():
    """モック会場リポジトリ"""
    return Mock()


@pytest.fixture
def venue_service(mock_venue_repository):
    """会場サービスインスタンス"""
    return VenueService(mock_venue_repository)


@pytest.fixture
def sample_venue_response():
    """サンプル会場レスポンス"""
    return {
        "id": str(uuid4()),
        "name": "テスト会場",
        "code": "TEST001",
        "address": "東京都渋谷区test1-1-1",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "venue_type": "会議室",
        "capacity": 50,
        "contact_info": "03-1234-5678",
        "description": "テスト用の会場です",
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }


class TestVenueService:
    """会場サービスのテスト"""

    @pytest.mark.asyncio
    async def test_create_venue_success(self, venue_service, mock_venue_repository, sample_venue_response):
        """会場作成成功のテスト"""
        # テストデータ
        venue_create = VenueCreate(
            name="新規会場",
            code="NEW001",
            address="東京都新宿区new1-1-1",
            venue_type="ホール",
            capacity=100
        )
        
        # モックの設定
        mock_venue_repository.get_venue_by_code = AsyncMock(return_value=None)  # 重複なし
        mock_venue_repository.create_venue = AsyncMock(return_value=sample_venue_response)
        
        # テスト実行
        result = await venue_service.create_venue(venue_create)
        
        # 検証
        assert result is not None
        assert result["name"] == "テスト会場"
        mock_venue_repository.get_venue_by_code.assert_called_once_with("NEW001")
        mock_venue_repository.create_venue.assert_called_once_with(venue_create)

    @pytest.mark.asyncio
    async def test_create_venue_duplicate_code_error(self, venue_service, mock_venue_repository, sample_venue_response):
        """会場作成時の重複コードエラーのテスト"""
        venue_create = VenueCreate(
            name="重複会場",
            code="TEST001",  # 既存コード
            address="test",
            venue_type="会議室",
            capacity=30
        )
        
        # モックの設定（既存会場が見つかる）
        mock_venue_repository.get_venue_by_code = AsyncMock(return_value=sample_venue_response)
        
        # テスト実行・検証
        with pytest.raises(VenueCodeDuplicateError):
            await venue_service.create_venue(venue_create)
        
        # create_venueは呼ばれない
        mock_venue_repository.create_venue.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_venue_by_id_found(self, venue_service, mock_venue_repository, sample_venue_response):
        """ID指定での会場取得（見つかった場合）のテスト"""
        venue_id = sample_venue_response["id"]
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        
        # テスト実行
        result = await venue_service.get_venue_by_id(venue_id)
        
        # 検証
        assert result is not None
        assert result["id"] == venue_id
        mock_venue_repository.get_venue_by_id.assert_called_once_with(venue_id)

    @pytest.mark.asyncio
    async def test_get_venue_by_id_not_found(self, venue_service, mock_venue_repository):
        """ID指定での会場取得（見つからない場合）のテスト"""
        venue_id = str(uuid4())
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=None)
        
        # テスト実行・検証
        with pytest.raises(VenueNotFoundError):
            await venue_service.get_venue_by_id(venue_id)

    @pytest.mark.asyncio
    async def test_get_all_venues(self, venue_service, mock_venue_repository):
        """全会場取得のテスト"""
        venues_data = [
            {"id": str(uuid4()), "name": "会場1", "code": "VENUE001", "is_active": True},
            {"id": str(uuid4()), "name": "会場2", "code": "VENUE002", "is_active": True}
        ]
        
        # モックの設定
        mock_venue_repository.get_all_venues = AsyncMock(return_value=venues_data)
        
        # テスト実行
        result = await venue_service.get_all_venues()
        
        # 検証
        assert len(result) == 2
        assert result[0]["name"] == "会場1"
        assert result[1]["name"] == "会場2"

    @pytest.mark.asyncio
    async def test_get_active_venues_only(self, venue_service, mock_venue_repository):
        """アクティブな会場のみ取得のテスト"""
        venues_data = [
            {"id": str(uuid4()), "name": "アクティブ会場", "code": "ACTIVE001", "is_active": True},
            {"id": str(uuid4()), "name": "非アクティブ会場", "code": "INACTIVE001", "is_active": False}
        ]
        
        # モックの設定
        mock_venue_repository.get_all_venues = AsyncMock(return_value=venues_data)
        
        # テスト実行
        result = await venue_service.get_active_venues()
        
        # 検証
        assert len(result) == 1
        assert result[0]["name"] == "アクティブ会場"
        assert result[0]["is_active"] is True

    @pytest.mark.asyncio
    async def test_update_venue_success(self, venue_service, mock_venue_repository, sample_venue_response):
        """会場更新成功のテスト"""
        venue_id = sample_venue_response["id"]
        venue_update = VenueUpdate(
            name="更新後会場名",
            capacity=80
        )
        
        updated_venue = sample_venue_response.copy()
        updated_venue["name"] = "更新後会場名"
        updated_venue["capacity"] = 80
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        mock_venue_repository.update_venue = AsyncMock(return_value=updated_venue)
        
        # テスト実行
        result = await venue_service.update_venue(venue_id, venue_update)
        
        # 検証
        assert result["name"] == "更新後会場名"
        assert result["capacity"] == 80
        mock_venue_repository.update_venue.assert_called_once_with(venue_id, venue_update)

    @pytest.mark.asyncio
    async def test_update_venue_not_found(self, venue_service, mock_venue_repository):
        """会場更新時の会場未発見エラーのテスト"""
        venue_id = str(uuid4())
        venue_update = VenueUpdate(name="更新")
        
        # モックの設定（会場が見つからない）
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=None)
        
        # テスト実行・検証
        with pytest.raises(VenueNotFoundError):
            await venue_service.update_venue(venue_id, venue_update)

    @pytest.mark.asyncio
    async def test_delete_venue_success(self, venue_service, mock_venue_repository, sample_venue_response):
        """会場削除成功のテスト"""
        venue_id = sample_venue_response["id"]
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        mock_venue_repository.delete_venue = AsyncMock(return_value=True)
        
        # テスト実行
        result = await venue_service.delete_venue(venue_id)
        
        # 検証
        assert result is True
        mock_venue_repository.delete_venue.assert_called_once_with(venue_id)

    @pytest.mark.asyncio
    async def test_deactivate_venue_instead_of_delete(self, venue_service, mock_venue_repository, sample_venue_response):
        """会場削除の代わりに非アクティブ化のテスト"""
        venue_id = sample_venue_response["id"]
        
        # 削除に失敗する場合のモック設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        mock_venue_repository.delete_venue = AsyncMock(return_value=False)
        
        deactivated_venue = sample_venue_response.copy()
        deactivated_venue["is_active"] = False
        mock_venue_repository.update_venue = AsyncMock(return_value=deactivated_venue)
        
        # テスト実行
        result = await venue_service.delete_venue(venue_id)
        
        # 検証
        assert result is True
        # 非アクティブ化のためのupdateが呼ばれる
        mock_venue_repository.update_venue.assert_called_once()


class TestVenueAvailabilityService:
    """会場利用可能時間サービスのテスト"""

    @pytest.mark.asyncio
    async def test_create_availability_slot_success(self, venue_service, mock_venue_repository, sample_venue_response):
        """利用可能時間枠作成成功のテスト"""
        venue_id = sample_venue_response["id"]
        slot_create = AvailabilitySlotCreate(
            venue_id=venue_id,
            slot_date=date(2025, 8, 15),
            start_time=time(10, 0),
            end_time=time(16, 0),
            status="available",
            cost=8000.0
        )
        
        expected_slot = {
            "id": str(uuid4()),
            "venue_id": venue_id,
            "slot_date": date(2025, 8, 15),
            "start_time": time(10, 0),
            "end_time": time(16, 0),
            "status": "available",
            "cost": 8000.0,
            "created_at": datetime.now()
        }
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        mock_venue_repository.create_availability_slot = AsyncMock(return_value=expected_slot)
        
        # テスト実行
        result = await venue_service.create_availability_slot(slot_create)
        
        # 検証
        assert result is not None
        assert result["venue_id"] == venue_id
        assert result["cost"] == 8000.0

    @pytest.mark.asyncio
    async def test_get_available_slots_by_date_range(self, venue_service, mock_venue_repository):
        """日付範囲での利用可能時間枠取得のテスト"""
        venue_id = str(uuid4())
        start_date = date(2025, 8, 1)
        end_date = date(2025, 8, 31)
        
        available_slots = [
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": date(2025, 8, 15),
                "status": "available",
                "cost": 5000.0
            },
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": date(2025, 8, 20),
                "status": "available",
                "cost": 6000.0
            }
        ]
        
        # モックの設定
        mock_venue_repository.get_availability_slots_by_date_range = AsyncMock(return_value=available_slots)
        
        # テスト実行
        result = await venue_service.get_available_slots_by_date_range(venue_id, start_date, end_date)
        
        # 検証
        assert len(result) == 2
        assert all(slot["status"] == "available" for slot in result)

    @pytest.mark.asyncio
    async def test_book_availability_slot(self, venue_service, mock_venue_repository):
        """利用可能時間枠の予約のテスト"""
        slot_id = str(uuid4())
        
        original_slot = {
            "id": slot_id,
            "venue_id": str(uuid4()),
            "status": "available",
            "cost": 5000.0
        }
        
        booked_slot = original_slot.copy()
        booked_slot["status"] = "booked"
        
        # モックの設定
        mock_venue_repository.get_availability_slot_by_id = AsyncMock(return_value=original_slot)
        mock_venue_repository.update_availability_slot_status = AsyncMock(return_value=booked_slot)
        
        # テスト実行
        result = await venue_service.book_availability_slot(slot_id)
        
        # 検証
        assert result["status"] == "booked"
        mock_venue_repository.update_availability_slot_status.assert_called_once_with(slot_id, "booked")


class TestVenueRecurringSlotService:
    """会場定期予約枠サービスのテスト"""

    @pytest.mark.asyncio
    async def test_create_recurring_slot_success(self, venue_service, mock_venue_repository, sample_venue_response):
        """定期予約枠作成成功のテスト"""
        venue_id = sample_venue_response["id"]
        recurring_create = RecurringSlotCreate(
            venue_id=venue_id,
            day_of_week=1,  # 月曜日
            start_time=time(9, 0),
            end_time=time(18, 0),
            valid_from=date(2025, 8, 1),
            valid_until=date(2025, 12, 31),
            recurrence_rule="weekly"
        )
        
        expected_recurring_slot = {
            "id": str(uuid4()),
            "venue_id": venue_id,
            "day_of_week": 1,
            "start_time": time(9, 0),
            "end_time": time(18, 0),
            "recurrence_rule": "weekly",
            "is_active": True,
            "created_at": datetime.now()
        }
        
        # モックの設定
        mock_venue_repository.get_venue_by_id = AsyncMock(return_value=sample_venue_response)
        mock_venue_repository.create_recurring_slot = AsyncMock(return_value=expected_recurring_slot)
        
        # テスト実行
        result = await venue_service.create_recurring_slot(recurring_create)
        
        # 検証
        assert result is not None
        assert result["day_of_week"] == 1
        assert result["recurrence_rule"] == "weekly"

    @pytest.mark.asyncio
    async def test_generate_availability_slots_from_recurring(self, venue_service, mock_venue_repository):
        """定期予約枠からの利用可能時間枠生成のテスト"""
        venue_id = str(uuid4())
        recurring_slots = [
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "day_of_week": 1,  # 月曜日
                "start_time": time(9, 0),
                "end_time": time(17, 0),
                "is_active": True
            }
        ]
        
        generated_slots = [
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": date(2025, 8, 4),  # 月曜日
                "start_time": time(9, 0),
                "end_time": time(17, 0),
                "status": "available"
            },
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": date(2025, 8, 11),  # 次の月曜日
                "start_time": time(9, 0),
                "end_time": time(17, 0),
                "status": "available"
            }
        ]
        
        # モックの設定
        mock_venue_repository.get_recurring_slots_by_venue = AsyncMock(return_value=recurring_slots)
        mock_venue_repository.bulk_create_availability_slots = AsyncMock(return_value=generated_slots)
        
        # テスト実行
        start_date = date(2025, 8, 1)
        end_date = date(2025, 8, 31)
        result = await venue_service.generate_availability_slots_from_recurring(venue_id, start_date, end_date)
        
        # 検証
        assert len(result) == 2
        assert all(slot["venue_id"] == venue_id for slot in result)
        assert all(slot["status"] == "available" for slot in result)