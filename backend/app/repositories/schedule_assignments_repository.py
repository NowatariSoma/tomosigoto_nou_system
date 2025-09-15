import logging
from typing import Any, Dict, List, Optional
from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class ScheduleAssignmentsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table_name = "schedule_assignments"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").order("time_slot").execute()
            data = response.data or []
            logger.info(f"Found {len(data)} schedule assignments")
            return data
        except Exception as e:
            logger.error(f"Error fetching schedule assignments: {e}")
            return []

    @handle_supabase_errors("find_by_practice_slot")
    async def find_by_practice_slot(self, practice_slot_id: str) -> List[Dict[str, Any]]:
        try:
            response = (
                self.client.table(self.table_name)
                .select("*, groups(name, display_name, color), practice_parts(name, display_name)")
                .eq("practice_slot_id", practice_slot_id)
                .order("time_slot")
                .execute()
            )
            data = response.data or []
            logger.info(f"Found {len(data)} schedule assignments for practice slot {practice_slot_id}")
            return data
        except Exception as e:
            logger.error(f"Error fetching schedule assignments by practice slot: {e}")
            return []

    @handle_supabase_errors("find_by_time_and_group")
    async def find_by_time_and_group(self, practice_slot_id: str, time_slot: str, group_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = (
                self.client.table(self.table_name)
                .select("*, groups(name, display_name, color), practice_parts(name, display_name)")
                .eq("practice_slot_id", practice_slot_id)
                .eq("time_slot", time_slot)
                .eq("group_id", group_id)
                .execute()
            )
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Found schedule assignment for {time_slot} - group {group_id}")
                return data[0]
            else:
                logger.info(f"No schedule assignment found for {time_slot} - group {group_id}")
                return None
        except Exception as e:
            logger.error(f"Error fetching schedule assignment by time and group: {e}")
            return None

    @handle_supabase_errors("create")
    async def create(self, assignment_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # UUIDフィールドを文字列に変換（Supabaseは文字列で保存）
            processed_data = assignment_data.copy()
            for field in ['practice_slot_id', 'group_id', 'part_id']:
                if field in processed_data and processed_data[field]:
                    processed_data[field] = str(processed_data[field])
            
            logger.info(f"Creating schedule assignment with data: {processed_data}")
            
            response = self.client.table(self.table_name).insert(processed_data).execute()
            logger.info(f"Supabase response: {response}")
            
            if response.data and len(response.data) > 0:
                logger.info(f"Created schedule assignment: {response.data[0]['id']}")
                return response.data[0]
            else:
                logger.error("Failed to create schedule assignment: No data returned")
                logger.error(f"Response: {response}")
                raise Exception("No data returned from database insert")
        except Exception as e:
            logger.error(f"Error creating schedule assignment: {e}")
            logger.error(f"Assignment data: {assignment_data}")
            import traceback
            traceback.print_exc()
            raise

    @handle_supabase_errors("update")
    async def update(self, assignment_id: str, assignment_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = (
                self.client.table(self.table_name)
                .update(assignment_data)
                .eq("id", assignment_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                logger.info(f"Updated schedule assignment: {assignment_id}")
                return response.data[0]
            else:
                logger.error(f"Failed to update schedule assignment: {assignment_id}")
                return {}
        except Exception as e:
            logger.error(f"Error updating schedule assignment: {e}")
            raise

    @handle_supabase_errors("delete")
    async def delete(self, assignment_id: str) -> bool:
        try:
            response = self.client.table(self.table_name).delete().eq("id", assignment_id).execute()
            logger.info(f"Deleted schedule assignment: {assignment_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting schedule assignment: {e}")
            return False

    @handle_supabase_errors("upsert")
    async def upsert(self, assignment_data: Dict[str, Any]) -> Dict[str, Any]:
        """時間・グループの組み合わせで存在する場合は更新、存在しない場合は作成"""
        try:
            practice_slot_id = assignment_data.get("practice_slot_id")
            time_slot = assignment_data.get("time_slot")
            group_id = assignment_data.get("group_id")
            
            if not all([practice_slot_id, time_slot, group_id]):
                raise ValueError("practice_slot_id, time_slot, and group_id are required for upsert")
            
            # 既存の割り当てを確認（文字列に変換して検索）
            existing = await self.find_by_time_and_group(str(practice_slot_id), time_slot, str(group_id))
            
            if existing:
                # 既存の場合は更新
                return await self.update(existing["id"], assignment_data)
            else:
                # 存在しない場合は作成
                return await self.create(assignment_data)
        except Exception as e:
            logger.error(f"Error upserting schedule assignment: {e}")
            raise

