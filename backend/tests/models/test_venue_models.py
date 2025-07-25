"""
会場モデルのテスト
"""
import pytest
from datetime import datetime, date, time
from typing import Dict, Any
from uuid import UUID, uuid4

from app.schemas.venue_schemas import (
    VenueBase,
    VenueCreate,
    VenueUpdate,
    VenueResponse,
    VenueAttributeBase,
    VenueAttributeCreate,
    VenueAttributeResponse,
    AvailabilitySlotBase,
    AvailabilitySlotCreate,
    AvailabilitySlotResponse,
    RecurringSlotBase,
    RecurringSlotCreate,
    RecurringSlotResponse,
)


class TestVenueSchemas:
    """会場スキーマのテスト"""

    def test_venue_base_valid_data(self):
        """VenueBaseスキーマの有効なデータテスト"""
        venue_data = {
            "name": "テスト会場",
            "code": "TEST001",
            "address": "東京都渋谷区test1-1-1",
            "latitude": 35.6762,
            "longitude": 139.6503,
            "venue_type": "会議室",
            "capacity": 50,
            "contact_info": "03-1234-5678",
            "description": "テスト用の会場です"
        }
        venue = VenueBase(**venue_data)
        assert venue.name == "テスト会場"
        assert venue.code == "TEST001"
        assert venue.capacity == 50

    def test_venue_create_schema(self):
        """VenueCreateスキーマのテスト"""
        venue_data = {
            "name": "新規会場",
            "code": "NEW001",
            "address": "東京都新宿区new1-1-1",
            "venue_type": "ホール",
            "capacity": 100
        }
        venue = VenueCreate(**venue_data)
        assert venue.name == "新規会場"
        assert venue.is_active is True  # デフォルト値

    def test_venue_update_schema(self):
        """VenueUpdateスキーマのテスト"""
        update_data = {
            "name": "更新後会場名",
            "capacity": 80
        }
        venue_update = VenueUpdate(**update_data)
        assert venue_update.name == "更新後会場名"
        assert venue_update.capacity == 80
        # 他のフィールドはNoneのまま
        assert venue_update.address is None

    def test_venue_response_schema(self):
        """VenueResponseスキーマのテスト"""
        venue_id = str(uuid4())
        now = datetime.now()
        response_data = {
            "id": venue_id,
            "name": "レスポンス会場",
            "code": "RES001",
            "address": "東京都港区res1-1-1",
            "venue_type": "会議室",
            "capacity": 30,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        venue_response = VenueResponse(**response_data)
        assert str(venue_response.id) == venue_id
        assert venue_response.name == "レスポンス会場"
        assert venue_response.created_at == now


class TestVenueAttributeSchemas:
    """会場属性スキーマのテスト"""

    def test_venue_attribute_base(self):
        """VenueAttributeBaseスキーマのテスト"""
        attr_data = {
            "attribute_key": "equipment",
            "attribute_value": "プロジェクター",
            "attribute_type": "facility"
        }
        attr = VenueAttributeBase(**attr_data)
        assert attr.attribute_key == "equipment"
        assert attr.attribute_value == "プロジェクター"

    def test_venue_attribute_create(self):
        """VenueAttributeCreateスキーマのテスト"""
        venue_id = str(uuid4())
        attr_data = {
            "venue_id": venue_id,
            "attribute_key": "wifi",
            "attribute_value": "available",
            "attribute_type": "network"
        }
        attr_create = VenueAttributeCreate(**attr_data)
        assert str(attr_create.venue_id) == venue_id
        assert attr_create.attribute_key == "wifi"


class TestAvailabilitySlotSchemas:
    """利用可能時間枠スキーマのテスト"""

    def test_availability_slot_base(self):
        """AvailabilitySlotBaseスキーマのテスト"""
        slot_data = {
            "slot_date": date(2025, 8, 1),
            "start_time": time(9, 0),
            "end_time": time(17, 0),
            "status": "available",
            "cost": 5000.0
        }
        slot = AvailabilitySlotBase(**slot_data)
        assert slot.slot_date == date(2025, 8, 1)
        assert slot.start_time == time(9, 0)
        assert slot.cost == 5000.0

    def test_availability_slot_create(self):
        """AvailabilitySlotCreateスキーマのテスト"""
        venue_id = str(uuid4())
        slot_data = {
            "venue_id": venue_id,
            "slot_date": date(2025, 8, 15),
            "start_time": time(10, 0),
            "end_time": time(16, 0),
            "status": "available",
            "cost": 8000.0,
            "constraints": {"min_participants": 5, "max_participants": 30}
        }
        slot_create = AvailabilitySlotCreate(**slot_data)
        assert str(slot_create.venue_id) == venue_id
        assert slot_create.constraints == {"min_participants": 5, "max_participants": 30}


class TestRecurringSlotSchemas:
    """定期予約枠スキーマのテスト"""

    def test_recurring_slot_base(self):
        """RecurringSlotBaseスキーマのテスト"""
        slot_data = {
            "day_of_week": 1,  # 月曜日
            "start_time": time(9, 0),
            "end_time": time(18, 0),
            "valid_from": date(2025, 8, 1),
            "valid_until": date(2025, 12, 31),
            "recurrence_rule": "weekly"
        }
        recurring_slot = RecurringSlotBase(**slot_data)
        assert recurring_slot.day_of_week == 1
        assert recurring_slot.recurrence_rule == "weekly"
        assert recurring_slot.is_active is True  # デフォルト値

    def test_recurring_slot_create(self):
        """RecurringSlotCreateスキーマのテスト"""
        venue_id = str(uuid4())
        slot_data = {
            "venue_id": venue_id,
            "day_of_week": 5,  # 金曜日
            "start_time": time(13, 0),
            "end_time": time(17, 0),
            "valid_from": date(2025, 8, 1),
            "valid_until": date(2025, 11, 30),
            "recurrence_rule": "weekly",
            "is_active": False
        }
        recurring_create = RecurringSlotCreate(**slot_data)
        assert str(recurring_create.venue_id) == venue_id
        assert recurring_create.day_of_week == 5
        assert recurring_create.is_active is False


class TestVenueSchemaValidation:
    """会場スキーマのバリデーションテスト"""

    def test_venue_code_uniqueness_validation(self):
        """会場コードの一意性バリデーション（将来の実装想定）"""
        # 現在はスキーマレベルでのバリデーションのみ
        # データベースレベルでの一意性制約は後で実装
        venue_data = {
            "name": "会場A",
            "code": "VENUE001",
            "address": "東京都test1-1-1",
            "venue_type": "会議室",
            "capacity": 50
        }
        venue = VenueCreate(**venue_data)
        assert venue.code == "VENUE001"

    def test_venue_capacity_positive_validation(self):
        """会場収容人数の正数バリデーション"""
        with pytest.raises(ValueError):
            VenueCreate(
                name="無効会場",
                code="INVALID001",
                address="test",
                venue_type="会議室",
                capacity=-10  # 負数は無効
            )

    def test_time_slot_logical_validation(self):
        """時間枠の論理的バリデーション（開始時間 < 終了時間）"""
        # 無効な時間設定（開始時間 > 終了時間）
        with pytest.raises(ValueError):
            AvailabilitySlotBase(
                slot_date=date(2025, 8, 1),
                start_time=time(17, 0),  # 開始時間
                end_time=time(9, 0),     # 終了時間（開始時間より早い）
                status="available",
                cost=5000.0
            )

    def test_day_of_week_range_validation(self):
        """曜日範囲のバリデーション（0-6）"""
        with pytest.raises(ValueError):
            RecurringSlotBase(
                day_of_week=7,  # 無効な曜日（0-6の範囲外）
                start_time=time(9, 0),
                end_time=time(17, 0),
                valid_from=date(2025, 8, 1),
                valid_until=date(2025, 12, 31),
                recurrence_rule="weekly"
            )