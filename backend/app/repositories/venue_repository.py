from supabase import Client
from typing import List, Optional, Dict, Any

from app.core.exceptions import handle_supabase_errors

class VenueRepository:

    def __init__(self, client: Client):
        self.client = client
        self.table_name = "venues"

    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        response = await self.client.table(self.table_name).select('*').execute()

        return response.data
    
    
