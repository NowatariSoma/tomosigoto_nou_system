"""
会場サービス - ビジネスロジック層
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY
import calendar

from app.repositories.venue_repository import VenueRepository
from app.services.supabase_service import supabase_service
from app.schemas.venue_schemas import (
    VenueCreate, VenueUpdate, VenueResponse,
    VenueAttributeCreate, VenueAttributeUpdate,
    AvailabilitySlotCreate, AvailabilitySlotUpdate,
    RecurringSlotCreate, RecurringSlotUpdate
)
from app.core.exceptions import (
    VenueNotFoundError, VenueCodeDuplicateError,
    AvailabilitySlotNotFoundError, AvailabilitySlotConflictError
)

logger = logging.getLogger(__name__)


class VenueService:
    """会場サービスクラス"""
    
    def __init__(self, venue_repository: Optional[VenueRepository] = None):
        self.venue_repository = venue_repository or VenueRepository(supabase_service)

    # 会場マスター関連メソッド
    async def create_venue(self, venue_create: VenueCreate) -> Dict[str, Any]:
        """会場を作成"""
        # 会場コードの重複チェック
        existing_venue = await self.venue_repository.get_venue_by_code(venue_create.code)
        if existing_venue:
            raise VenueCodeDuplicateError(venue_create.code)
        
        # 会場作成
        venue = await self.venue_repository.create_venue(venue_create)
        if not venue:
            raise Exception("会場の作成に失敗しました")
        
        logger.info(f"Venue created: {venue['name']} (ID: {venue['id']})")
        return venue

    async def get_venue_by_id(self, venue_id: str) -> Dict[str, Any]:
        """IDで会場を取得"""
        venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(venue_id)
        return venue

    async def get_venue_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """コードで会場を取得"""
        return await self.venue_repository.get_venue_by_code(code)

    async def get_all_venues(self) -> List[Dict[str, Any]]:
        """全会場を取得"""
        return await self.venue_repository.get_all_venues()

    async def get_active_venues(self) -> List[Dict[str, Any]]:
        """アクティブな会場のみを取得"""
        all_venues = await self.venue_repository.get_all_venues()
        return [venue for venue in all_venues if venue.get('is_active', True)]

    async def update_venue(self, venue_id: str, venue_update: VenueUpdate) -> Dict[str, Any]:
        """会場を更新"""
        # 会場の存在確認
        existing_venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not existing_venue:
            raise VenueNotFoundError(venue_id)
        
        # 会場コードの重複チェック（コードを変更する場合）
        if venue_update.code and venue_update.code != existing_venue['code']:
            code_conflict = await self.venue_repository.get_venue_by_code(venue_update.code)
            if code_conflict:
                raise VenueCodeDuplicateError(venue_update.code)
        
        # 会場更新
        updated_venue = await self.venue_repository.update_venue(venue_id, venue_update)
        if not updated_venue:
            raise Exception("会場の更新に失敗しました")
        
        logger.info(f"Venue updated: {updated_venue['name']} (ID: {venue_id})")
        return updated_venue

    async def delete_venue(self, venue_id: str) -> bool:
        """会場を削除（または非アクティブ化）"""
        # 会場の存在確認
        existing_venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not existing_venue:
            raise VenueNotFoundError(venue_id)
        
        # まず物理削除を試行
        deleted = await self.venue_repository.delete_venue(venue_id)
        
        if not deleted:
            # 物理削除に失敗した場合は非アクティブ化
            venue_update = VenueUpdate(is_active=False)
            await self.venue_repository.update_venue(venue_id, venue_update)
            logger.info(f"Venue deactivated instead of deleted: {venue_id}")
        else:
            logger.info(f"Venue deleted: {venue_id}")
        
        return True

    # 会場属性関連メソッド
    async def create_venue_attribute(self, attribute_create: VenueAttributeCreate) -> Dict[str, Any]:
        """会場属性を作成"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(str(attribute_create.venue_id))
        if not venue:
            raise VenueNotFoundError(str(attribute_create.venue_id))
        
        attribute = await self.venue_repository.create_venue_attribute(attribute_create)
        if not attribute:
            raise Exception("会場属性の作成に失敗しました")
        
        return attribute

    async def get_venue_attributes(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の属性一覧を取得"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(venue_id)
        
        return await self.venue_repository.get_venue_attributes(venue_id)

    # 利用可能時間枠関連メソッド
    async def create_availability_slot(self, slot_create: AvailabilitySlotCreate) -> Dict[str, Any]:
        """利用可能時間枠を作成"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(str(slot_create.venue_id))
        if not venue:
            raise VenueNotFoundError(str(slot_create.venue_id))
        
        # 時間枠の競合チェック
        existing_slots = await self.venue_repository.get_availability_slots_by_date_range(
            str(slot_create.venue_id), slot_create.slot_date, slot_create.slot_date
        )
        
        for existing_slot in existing_slots:
            existing_start = datetime.strptime(existing_slot['start_time'], '%H:%M:%S').time()
            existing_end = datetime.strptime(existing_slot['end_time'], '%H:%M:%S').time()
            
            # 時間の重複チェック
            if (slot_create.start_time < existing_end and slot_create.end_time > existing_start):
                time_range = f"{slot_create.start_time}-{slot_create.end_time}"
                raise AvailabilitySlotConflictError(
                    str(slot_create.venue_id), 
                    slot_create.slot_date.isoformat(), 
                    time_range
                )
        
        slot = await self.venue_repository.create_availability_slot(slot_create)
        if not slot:
            raise Exception("利用可能時間枠の作成に失敗しました")
        
        return slot

    async def get_availability_slots_by_venue(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の利用可能時間枠一覧を取得"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(venue_id)
        
        return await self.venue_repository.get_availability_slots_by_venue(venue_id)

    async def get_available_slots_by_date_range(
        self, venue_id: str, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """日付範囲で利用可能な時間枠を取得"""
        slots = await self.venue_repository.get_availability_slots_by_date_range(
            venue_id, start_date, end_date
        )
        # 利用可能なもののみをフィルタリング
        return [slot for slot in slots if slot.get('status') == 'available']

    async def book_availability_slot(self, slot_id: str) -> Dict[str, Any]:
        """利用可能時間枠を予約"""
        # 時間枠の存在確認
        slot = await self.venue_repository.get_availability_slot_by_id(slot_id)
        if not slot:
            raise AvailabilitySlotNotFoundError(slot_id)
        
        # 予約可能状態の確認
        if slot.get('status') != 'available':
            raise Exception(f"時間枠は予約できません。現在のステータス: {slot.get('status')}")
        
        # ステータスを予約済みに更新
        updated_slot = await self.venue_repository.update_availability_slot_status(slot_id, 'booked')
        if not updated_slot:
            raise Exception("時間枠の予約に失敗しました")
        
        logger.info(f"Availability slot booked: {slot_id}")
        return updated_slot

    # 定期予約枠関連メソッド
    async def create_recurring_slot(self, recurring_create: RecurringSlotCreate) -> Dict[str, Any]:
        """定期予約枠を作成"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(str(recurring_create.venue_id))
        if not venue:
            raise VenueNotFoundError(str(recurring_create.venue_id))
        
        recurring_slot = await self.venue_repository.create_recurring_slot(recurring_create)
        if not recurring_slot:
            raise Exception("定期予約枠の作成に失敗しました")
        
        return recurring_slot

    async def get_recurring_slots_by_venue(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の定期予約枠一覧を取得"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(venue_id)
        
        return await self.venue_repository.get_recurring_slots_by_venue(venue_id)

    async def generate_availability_slots_from_recurring(
        self, venue_id: str, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """定期予約枠から利用可能時間枠を生成"""
        # 会場の存在確認
        venue = await self.venue_repository.get_venue_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(venue_id)
        
        # 定期予約枠を取得
        recurring_slots = await self.venue_repository.get_recurring_slots_by_venue(venue_id)
        
        # 生成する時間枠のリスト
        slots_to_create = []
        
        for recurring_slot in recurring_slots:
            day_of_week = recurring_slot['day_of_week']
            start_time = datetime.strptime(recurring_slot['start_time'], '%H:%M:%S').time()
            end_time = datetime.strptime(recurring_slot['end_time'], '%H:%M:%S').time()
            valid_from = datetime.strptime(recurring_slot['valid_from'], '%Y-%m-%d').date()
            valid_until = datetime.strptime(recurring_slot['valid_until'], '%Y-%m-%d').date()
            
            # 有効期間の調整
            actual_start = max(start_date, valid_from)
            actual_end = min(end_date, valid_until)
            
            if actual_start > actual_end:
                continue
            
            # 指定した曜日の日付を生成
            current_date = actual_start
            while current_date <= actual_end:
                if current_date.weekday() == (day_of_week - 1) % 7:  # Python weekday: 0=Monday, SQL: 0=Sunday
                    slot_data = {
                        'venue_id': venue_id,
                        'slot_date': current_date,
                        'start_time': start_time,
                        'end_time': end_time,
                        'status': 'available',
                        'cost': 0.0,
                        'constraints': {}
                    }
                    slots_to_create.append(slot_data)
                
                current_date += timedelta(days=1)
        
        # 一括作成
        if slots_to_create:
            created_slots = await self.venue_repository.bulk_create_availability_slots(slots_to_create)
            logger.info(f"Generated {len(created_slots)} availability slots from recurring slots")
            return created_slots
        
        return []

    # 複合取得メソッド
    async def get_venue_with_attributes(self, venue_id: str) -> Dict[str, Any]:
        """会場情報と属性を含めて取得"""
        venue = await self.get_venue_by_id(venue_id)
        attributes = await self.get_venue_attributes(venue_id)
        
        venue['attributes'] = attributes
        return venue

    async def get_venue_with_availability(self, venue_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """会場情報と利用可能時間枠を含めて取得"""
        venue = await self.get_venue_by_id(venue_id)
        availability_slots = await self.get_available_slots_by_date_range(venue_id, start_date, end_date)
        recurring_slots = await self.get_recurring_slots_by_venue(venue_id)
        
        venue['availability_slots'] = availability_slots
        venue['recurring_slots'] = recurring_slots
        return venue

    async def search_venues_by_criteria(
        self, 
        venue_type: Optional[str] = None,
        min_capacity: Optional[int] = None,
        max_capacity: Optional[int] = None,
        location_lat: Optional[float] = None,
        location_lng: Optional[float] = None,
        radius_km: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """条件で会場を検索"""
        all_venues = await self.get_all_venues()
        
        filtered_venues = []
        for venue in all_venues:
            # 会場種別でのフィルタリング
            if venue_type and venue.get('venue_type') != venue_type:
                continue
            
            # 収容人数でのフィルタリング
            capacity = venue.get('capacity')
            if capacity:
                if min_capacity and capacity < min_capacity:
                    continue
                if max_capacity and capacity > max_capacity:
                    continue
            
            # 地理的条件でのフィルタリング
            if (location_lat and location_lng and radius_km and 
                venue.get('latitude') and venue.get('longitude')):
                # 簡易的な距離計算（実際はより正確な地理計算が必要）
                lat_diff = abs(venue['latitude'] - location_lat)
                lng_diff = abs(venue['longitude'] - location_lng)
                # 1度 ≈ 111km として簡易計算
                distance_km = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111
                if distance_km > radius_km:
                    continue
            
            filtered_venues.append(venue)
        
        return filtered_venues


# シングルトンインスタンス
venue_service = VenueService()