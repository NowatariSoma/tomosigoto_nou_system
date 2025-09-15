import logging
from typing import Any, Dict, List, Optional
from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class PartsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table_name = "practice_parts"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").order("sort_order").execute()
            data = response.data or []
            logger.info(f"Found {len(data)} parts in {self.table_name} table")
            return data
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist, returning empty list: {e}")
            return []

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, part_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").eq("id", part_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Found part with id {part_id}")
                return data[0]
            else:
                logger.warning(f"Part with id {part_id} not found")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("find_by_name")
    async def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").eq("name", name).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Found part with name {name}")
                return data[0]
            else:
                logger.warning(f"Part with name {name} not found")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("create")
    async def create(self, part_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).insert(part_data).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Created part: {data[0]}")
                return data[0]
            else:
                logger.error("Failed to create part")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("update")
    async def update(self, part_id: str, part_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).update(part_data).eq("id", part_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Updated part with id {part_id}")
                return data[0]
            else:
                logger.warning(f"Part with id {part_id} not found for update")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("delete")
    async def delete(self, part_id: str) -> bool:
        try:
            response = self.client.table(self.table_name).delete().eq("id", part_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Deleted part with id {part_id}")
                return True
            else:
                logger.warning(f"Part with id {part_id} not found for deletion")
                return False
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return False
