from supabase import Client
from typing import List, Optional, Dict, Any

from app.core.exceptions import handle_supabase_errors

class VenueRepository:

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "venues"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        response = self.client.table(self.table_name).select('*').execute()

        return response.data
    
    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, venue_id) -> Dict[str, Any]:
        response = self.client.table('venues').select('*').eq('id', venue_id).execute()
    
        return response.data[0]
    
    @handle_supabase_errors("create")
    async def create(self, venue_data) -> Dict[str, Any]:
        response = self.client.table('venues').insert(venue_data).execute()

        return response.data[0]
    
    @handle_supabase_errors("update")
    async def update(self, venue_id, venue_data) -> Dict[str, Any]:
        response = self.client.table('venues').update(venue_data).eq("id", venue_id).execute()

        return response.data[0]
    
    @handle_supabase_errors("delete")
    async def delete(self, venue_id) -> bool:
        self.client.table('venues').delete().eq('id',venue_id).execute()

        return True
    
