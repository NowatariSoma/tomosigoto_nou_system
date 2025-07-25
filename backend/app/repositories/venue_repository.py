"""
会場リポジトリ - データアクセスレイヤー
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from uuid import UUID

from app.services.supabase_service import SupabaseService
from app.schemas.venue_schemas import (
    VenueCreate, VenueUpdate,
    VenueAttributeCreate, VenueAttributeUpdate,
    AvailabilitySlotCreate, AvailabilitySlotUpdate,
    RecurringSlotCreate, RecurringSlotUpdate
)
from app.core.exceptions import handle_supabase_errors

logger = logging.getLogger(__name__)


class VenueRepository:
    """会場リポジトリクラス"""
    
    def __init__(self, supabase_service: SupabaseService):
        self.supabase_service = supabase_service

    # 会場マスター関連メソッド
    @handle_supabase_errors("create_venue")
    async def create_venue(self, venue_create: VenueCreate) -> Optional[Dict[str, Any]]:
        """会場を作成"""
        venue_data = venue_create.model_dump()
        
        response = self.supabase_service.supabase.table('venues').insert(venue_data).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Venue created successfully: {venue_data.get('name')}")
            return response.data[0]
        return None

    @handle_supabase_errors("get_venue_by_id")
    async def get_venue_by_id(self, venue_id: str) -> Optional[Dict[str, Any]]:
        """IDで会場を取得"""
        response = self.supabase_service.supabase.table('venues').select('*').eq('id', venue_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("get_venue_by_code")
    async def get_venue_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """コードで会場を取得"""
        response = self.supabase_service.supabase.table('venues').select('*').eq('code', code).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("get_all_venues")
    async def get_all_venues(self) -> List[Dict[str, Any]]:
        """全会場を取得"""
        response = self.supabase_service.supabase.table('venues').select('*').eq('is_active', True).execute()
        
        if response.data:
            logger.info(f"Found {len(response.data)} venues")
            return response.data
        return []

    @handle_supabase_errors("update_venue")
    async def update_venue(self, venue_id: str, venue_update: VenueUpdate) -> Optional[Dict[str, Any]]:
        """会場を更新"""
        update_data = venue_update.model_dump(exclude_unset=True)
        if not update_data:
            # 更新データがない場合は現在のデータを返す
            return await self.get_venue_by_id(venue_id)
        
        response = self.supabase_service.supabase.table('venues').update(update_data).eq('id', venue_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Venue updated successfully: {venue_id}")
            return response.data[0]
        return None

    @handle_supabase_errors("delete_venue")
    async def delete_venue(self, venue_id: str) -> bool:
        """会場を削除"""
        response = self.supabase_service.supabase.table('venues').delete().eq('id', venue_id).execute()
        
        if response.data:
            logger.info(f"Venue deleted successfully: {venue_id}")
            return True
        return False

    # 会場属性関連メソッド
    @handle_supabase_errors("create_venue_attribute")
    async def create_venue_attribute(self, attribute_create: VenueAttributeCreate) -> Optional[Dict[str, Any]]:
        """会場属性を作成"""
        attribute_data = attribute_create.model_dump()
        
        response = self.supabase_service.supabase.table('venue_attributes').insert(attribute_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("get_venue_attributes")
    async def get_venue_attributes(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の属性一覧を取得"""
        response = self.supabase_service.supabase.table('venue_attributes').select('*').eq('venue_id', venue_id).execute()
        
        if response.data:
            return response.data
        return []

    @handle_supabase_errors("update_venue_attribute")
    async def update_venue_attribute(self, attribute_id: str, attribute_update: VenueAttributeUpdate) -> Optional[Dict[str, Any]]:
        """会場属性を更新"""
        update_data = attribute_update.model_dump(exclude_unset=True)
        if not update_data:
            return None
        
        response = self.supabase_service.supabase.table('venue_attributes').update(update_data).eq('id', attribute_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("delete_venue_attribute")
    async def delete_venue_attribute(self, attribute_id: str) -> bool:
        """会場属性を削除"""
        response = self.supabase_service.supabase.table('venue_attributes').delete().eq('id', attribute_id).execute()
        
        if response.data:
            return True
        return False

    # 利用可能時間枠関連メソッド
    @handle_supabase_errors("create_availability_slot")
    async def create_availability_slot(self, slot_create: AvailabilitySlotCreate) -> Optional[Dict[str, Any]]:
        """利用可能時間枠を作成"""
        slot_data = slot_create.model_dump()
        # dateとtimeオブジェクトを文字列に変換
        if 'slot_date' in slot_data:
            slot_data['slot_date'] = slot_data['slot_date'].isoformat()
        if 'start_time' in slot_data:
            slot_data['start_time'] = slot_data['start_time'].isoformat()
        if 'end_time' in slot_data:
            slot_data['end_time'] = slot_data['end_time'].isoformat()
        
        response = self.supabase_service.supabase.table('availability_slots').insert(slot_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("get_availability_slots_by_venue")
    async def get_availability_slots_by_venue(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の利用可能時間枠一覧を取得"""
        response = self.supabase_service.supabase.table('availability_slots').select('*').eq('venue_id', venue_id).execute()
        
        if response.data:
            return response.data
        return []

    @handle_supabase_errors("get_availability_slots_by_date_range")
    async def get_availability_slots_by_date_range(self, venue_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """日付範囲で利用可能時間枠を取得"""
        response = (self.supabase_service.supabase.table('availability_slots')
                   .select('*')
                   .eq('venue_id', venue_id)
                   .gte('slot_date', start_date.isoformat())
                   .lte('slot_date', end_date.isoformat())
                   .execute())
        
        if response.data:
            return response.data
        return []

    @handle_supabase_errors("get_availability_slot_by_id")
    async def get_availability_slot_by_id(self, slot_id: str) -> Optional[Dict[str, Any]]:
        """IDで利用可能時間枠を取得"""
        response = self.supabase_service.supabase.table('availability_slots').select('*').eq('id', slot_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("update_availability_slot")
    async def update_availability_slot(self, slot_id: str, slot_update: AvailabilitySlotUpdate) -> Optional[Dict[str, Any]]:
        """利用可能時間枠を更新"""
        update_data = slot_update.model_dump(exclude_unset=True)
        if not update_data:
            return None
        
        # dateとtimeオブジェクトを文字列に変換
        if 'slot_date' in update_data:
            update_data['slot_date'] = update_data['slot_date'].isoformat()
        if 'start_time' in update_data:
            update_data['start_time'] = update_data['start_time'].isoformat()
        if 'end_time' in update_data:
            update_data['end_time'] = update_data['end_time'].isoformat()
        
        response = self.supabase_service.supabase.table('availability_slots').update(update_data).eq('id', slot_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("update_availability_slot_status")
    async def update_availability_slot_status(self, slot_id: str, status: str) -> Optional[Dict[str, Any]]:
        """利用可能時間枠のステータスを更新"""
        response = self.supabase_service.supabase.table('availability_slots').update({'status': status}).eq('id', slot_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("delete_availability_slot")
    async def delete_availability_slot(self, slot_id: str) -> bool:
        """利用可能時間枠を削除"""
        response = self.supabase_service.supabase.table('availability_slots').delete().eq('id', slot_id).execute()
        
        if response.data:
            return True
        return False

    # 定期予約枠関連メソッド
    @handle_supabase_errors("create_recurring_slot")
    async def create_recurring_slot(self, recurring_create: RecurringSlotCreate) -> Optional[Dict[str, Any]]:
        """定期予約枠を作成"""
        recurring_data = recurring_create.model_dump()
        # dateとtimeオブジェクトを文字列に変換
        if 'valid_from' in recurring_data:
            recurring_data['valid_from'] = recurring_data['valid_from'].isoformat()
        if 'valid_until' in recurring_data:
            recurring_data['valid_until'] = recurring_data['valid_until'].isoformat()
        if 'start_time' in recurring_data:
            recurring_data['start_time'] = recurring_data['start_time'].isoformat()
        if 'end_time' in recurring_data:
            recurring_data['end_time'] = recurring_data['end_time'].isoformat()
        
        response = self.supabase_service.supabase.table('recurring_slots').insert(recurring_data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("get_recurring_slots_by_venue")
    async def get_recurring_slots_by_venue(self, venue_id: str) -> List[Dict[str, Any]]:
        """会場の定期予約枠一覧を取得"""
        response = (self.supabase_service.supabase.table('recurring_slots')
                   .select('*')
                   .eq('venue_id', venue_id)
                   .eq('is_active', True)
                   .execute())
        
        if response.data:
            return response.data
        return []

    @handle_supabase_errors("update_recurring_slot")
    async def update_recurring_slot(self, slot_id: str, slot_update: RecurringSlotUpdate) -> Optional[Dict[str, Any]]:
        """定期予約枠を更新"""
        update_data = slot_update.model_dump(exclude_unset=True)
        if not update_data:
            return None
        
        # dateとtimeオブジェクトを文字列に変換
        if 'valid_from' in update_data:
            update_data['valid_from'] = update_data['valid_from'].isoformat()
        if 'valid_until' in update_data:
            update_data['valid_until'] = update_data['valid_until'].isoformat()
        if 'start_time' in update_data:
            update_data['start_time'] = update_data['start_time'].isoformat()
        if 'end_time' in update_data:
            update_data['end_time'] = update_data['end_time'].isoformat()
        
        response = self.supabase_service.supabase.table('recurring_slots').update(update_data).eq('id', slot_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    @handle_supabase_errors("delete_recurring_slot")
    async def delete_recurring_slot(self, slot_id: str) -> bool:
        """定期予約枠を削除"""
        response = self.supabase_service.supabase.table('recurring_slots').delete().eq('id', slot_id).execute()
        
        if response.data:
            return True
        return False

    @handle_supabase_errors("bulk_create_availability_slots")
    async def bulk_create_availability_slots(self, slots_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """利用可能時間枠を一括作成"""
        # dateとtimeオブジェクトを文字列に変換
        processed_slots = []
        for slot_data in slots_data:
            processed_slot = slot_data.copy()
            if 'slot_date' in processed_slot:
                processed_slot['slot_date'] = processed_slot['slot_date'].isoformat()
            if 'start_time' in processed_slot:
                processed_slot['start_time'] = processed_slot['start_time'].isoformat()
            if 'end_time' in processed_slot:
                processed_slot['end_time'] = processed_slot['end_time'].isoformat()
            processed_slots.append(processed_slot)
        
        response = self.supabase_service.supabase.table('availability_slots').insert(processed_slots).execute()
        
        if response.data:
            logger.info(f"Bulk created {len(response.data)} availability slots")
            return response.data
        return []