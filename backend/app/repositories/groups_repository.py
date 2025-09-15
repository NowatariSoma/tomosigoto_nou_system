import logging
from typing import Any, Dict, List, Optional
from app.core.exceptions import handle_supabase_errors
from supabase import Client

logger = logging.getLogger(__name__)


class GroupsRepository:
    def __init__(self, client: Client):
        self.client = client
        self.table_name = "groups"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").order("sort_order").execute()
            data = response.data or []
            logger.info(f"Found {len(data)} groups in {self.table_name} table")
            return data
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist, returning empty list: {e}")
            return []

    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, group_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").eq("id", group_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Found group with id {group_id}")
                return data[0]
            else:
                logger.warning(f"Group with id {group_id} not found")
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
                logger.info(f"Found group with name {name}")
                return data[0]
            else:
                logger.warning(f"Group with name {name} not found")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("create")
    async def create(self, group_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).insert(group_data).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Created group: {data[0]}")
                return data[0]
            else:
                logger.error("Failed to create group")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("update")
    async def update(self, group_id: str, group_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).update(group_data).eq("id", group_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Updated group with id {group_id}")
                return data[0]
            else:
                logger.warning(f"Group with id {group_id} not found for update")
                return None
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return None

    @handle_supabase_errors("delete")
    async def delete(self, group_id: str) -> bool:
        try:
            response = self.client.table(self.table_name).delete().eq("id", group_id).execute()
            data = response.data
            if data and len(data) > 0:
                logger.info(f"Deleted group with id {group_id}")
                return True
            else:
                logger.warning(f"Group with id {group_id} not found for deletion")
                return False
        except Exception as e:
            logger.warning(f"Table {self.table_name} does not exist or error occurred: {e}")
            return False




