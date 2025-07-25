"""
会場リポジトリのテスト
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date, time
from uuid import uuid4
from typing import List, Optional, Dict, Any

from app.repositories.venue_repository import VenueRepository
from app.schemas.venue_schemas import VenueCreate, VenueUpdate, AvailabilitySlotCreate, RecurringSlotCreate


@pytest.fixture
def mock_supabase_service():
    """モックSupabaseサービス"""
    mock_service = Mock()
    mock_service.supabase = Mock()
    mock_service.supabase.table = Mock()
    return mock_service


@pytest.fixture
def venue_repository(mock_supabase_service):
    """会場リポジトリインスタンス"""
    return VenueRepository(mock_supabase_service)


@pytest.fixture
def sample_venue_data():
    """サンプル会場データ"""
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


@pytest.fixture
def sample_availability_slot_data():
    """サンプル利用可能時間枠データ"""
    venue_id = str(uuid4())
    return {
        "id": str(uuid4()),
        "venue_id": venue_id,
        "slot_date": date(2025, 8, 1),
        "start_time": time(9, 0),
        "end_time": time(17, 0),
        "status": "available",
        "cost": 5000.0,
        "constraints": {"min_participants": 5, "max_participants": 30},
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }


class TestVenueRepository:
    """会場リポジトリのテスト"""

    @pytest.mark.asyncio
    async def test_create_venue_success(self, venue_repository, mock_supabase_service):
        """会場作成成功のテスト"""
        # テストデータ
        venue_create = VenueCreate(
            name="新規会場",
            code="NEW001",
            address="東京都新宿区new1-1-1",
            venue_type="ホール",
            capacity=100
        )
        
        expected_venue_id = str(uuid4())
        mock_response = Mock()
        mock_response.data = [{
            "id": expected_venue_id,
            "name": "新規会場",
            "code": "NEW001",
            "address": "東京都新宿区new1-1-1",
            "venue_type": "ホール",
            "capacity": 100,
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.create_venue(venue_create)
        
        # 検証
        assert result is not None
        assert result["id"] == expected_venue_id
        assert result["name"] == "新規会場"
        mock_supabase_service.supabase.table.assert_called_with("venues")

    @pytest.mark.asyncio
    async def test_get_venue_by_id_found(self, venue_repository, mock_supabase_service, sample_venue_data):
        """ID指定での会場取得（見つかった場合）のテスト"""
        venue_id = sample_venue_data["id"]
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = [sample_venue_data]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_venue_by_id(venue_id)
        
        # 検証
        assert result is not None
        assert result["id"] == venue_id
        assert result["name"] == "テスト会場"

    @pytest.mark.asyncio
    async def test_get_venue_by_id_not_found(self, venue_repository, mock_supabase_service):
        """ID指定での会場取得（見つからない場合）のテスト"""
        venue_id = str(uuid4())
        
        # モックレスポンス（データなし）
        mock_response = Mock()
        mock_response.data = []
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_venue_by_id(venue_id)
        
        # 検証
        assert result is None

    @pytest.mark.asyncio
    async def test_get_all_venues(self, venue_repository, mock_supabase_service):
        """全会場取得のテスト"""
        # テストデータ
        venues_data = [
            {"id": str(uuid4()), "name": "会場1", "code": "VENUE001"},
            {"id": str(uuid4()), "name": "会場2", "code": "VENUE002"}
        ]
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = venues_data
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_all_venues()
        
        # 検証
        assert len(result) == 2
        assert result[0]["name"] == "会場1"
        assert result[1]["name"] == "会場2"

    @pytest.mark.asyncio
    async def test_update_venue_success(self, venue_repository, mock_supabase_service, sample_venue_data):
        """会場更新成功のテスト"""
        venue_id = sample_venue_data["id"]
        venue_update = VenueUpdate(
            name="更新後会場名",
            capacity=80
        )
        
        # 更新後のデータ
        updated_data = sample_venue_data.copy()
        updated_data["name"] = "更新後会場名"
        updated_data["capacity"] = 80
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = [updated_data]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.update_venue(venue_id, venue_update)
        
        # 検証
        assert result is not None
        assert result["name"] == "更新後会場名"
        assert result["capacity"] == 80

    @pytest.mark.asyncio
    async def test_delete_venue_success(self, venue_repository, mock_supabase_service):
        """会場削除成功のテスト"""
        venue_id = str(uuid4())
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = [{"id": venue_id}]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.delete_venue(venue_id)
        
        # 検証
        assert result is True

    @pytest.mark.asyncio
    async def test_get_venue_by_code(self, venue_repository, mock_supabase_service, sample_venue_data):
        """会場コード指定での取得のテスト"""
        venue_code = sample_venue_data["code"]
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = [sample_venue_data]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_venue_by_code(venue_code)
        
        # 検証
        assert result is not None
        assert result["code"] == venue_code


class TestAvailabilitySlotRepository:
    """利用可能時間枠リポジトリのテスト"""

    @pytest.mark.asyncio
    async def test_create_availability_slot(self, venue_repository, mock_supabase_service):
        """利用可能時間枠作成のテスト"""
        venue_id = str(uuid4())
        slot_create = AvailabilitySlotCreate(
            venue_id=venue_id,
            slot_date=date(2025, 8, 15),
            start_time=time(10, 0),
            end_time=time(16, 0),
            status="available",
            cost=8000.0
        )
        
        expected_slot_id = str(uuid4())
        mock_response = Mock()
        mock_response.data = [{
            "id": expected_slot_id,
            "venue_id": venue_id,
            "slot_date": "2025-08-15",
            "start_time": "10:00:00",
            "end_time": "16:00:00",
            "status": "available",
            "cost": 8000.0,
            "created_at": datetime.now().isoformat()
        }]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.create_availability_slot(slot_create)
        
        # 検証
        assert result is not None
        assert result["id"] == expected_slot_id
        assert result["venue_id"] == venue_id

    @pytest.mark.asyncio
    async def test_get_availability_slots_by_venue(self, venue_repository, mock_supabase_service):
        """会場別利用可能時間枠取得のテスト"""
        venue_id = str(uuid4())
        slots_data = [
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": "2025-08-01",
                "start_time": "09:00:00",
                "end_time": "17:00:00",
                "status": "available",
                "cost": 5000.0
            },
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "slot_date": "2025-08-02",
                "start_time": "10:00:00",
                "end_time": "16:00:00",
                "status": "booked",
                "cost": 6000.0
            }
        ]
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = slots_data
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_availability_slots_by_venue(venue_id)
        
        # 検証
        assert len(result) == 2
        assert all(slot["venue_id"] == venue_id for slot in result)


class TestRecurringSlotRepository:
    """定期予約枠リポジトリのテスト"""

    @pytest.mark.asyncio
    async def test_create_recurring_slot(self, venue_repository, mock_supabase_service):
        """定期予約枠作成のテスト"""
        venue_id = str(uuid4())
        recurring_create = RecurringSlotCreate(
            venue_id=venue_id,
            day_of_week=1,  # 月曜日
            start_time=time(9, 0),
            end_time=time(18, 0),
            valid_from=date(2025, 8, 1),
            valid_until=date(2025, 12, 31),
            recurrence_rule="weekly"
        )
        
        expected_slot_id = str(uuid4())
        mock_response = Mock()
        mock_response.data = [{
            "id": expected_slot_id,
            "venue_id": venue_id,
            "day_of_week": 1,
            "start_time": "09:00:00",
            "end_time": "18:00:00",
            "valid_from": "2025-08-01",
            "valid_until": "2025-12-31",
            "recurrence_rule": "weekly",
            "is_active": True,
            "created_at": datetime.now().isoformat()
        }]
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.create_recurring_slot(recurring_create)
        
        # 検証
        assert result is not None
        assert result["id"] == expected_slot_id
        assert result["day_of_week"] == 1
        assert result["recurrence_rule"] == "weekly"

    @pytest.mark.asyncio
    async def test_get_recurring_slots_by_venue(self, venue_repository, mock_supabase_service):
        """会場別定期予約枠取得のテスト"""
        venue_id = str(uuid4())
        recurring_slots_data = [
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "day_of_week": 1,
                "start_time": "09:00:00",
                "end_time": "18:00:00",
                "recurrence_rule": "weekly",
                "is_active": True
            },
            {
                "id": str(uuid4()),
                "venue_id": venue_id,
                "day_of_week": 3,
                "start_time": "13:00:00",
                "end_time": "17:00:00",
                "recurrence_rule": "weekly",
                "is_active": True
            }
        ]
        
        # モックレスポンス
        mock_response = Mock()
        mock_response.data = recurring_slots_data
        
        # モックの設定
        mock_supabase_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        # テスト実行
        result = await venue_repository.get_recurring_slots_by_venue(venue_id)
        
        # 検証
        assert len(result) == 2
        assert all(slot["venue_id"] == venue_id for slot in result)
        assert result[0]["day_of_week"] == 1
        assert result[1]["day_of_week"] == 3