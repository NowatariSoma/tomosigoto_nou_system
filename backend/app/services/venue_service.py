from typing import List, Optional, Dict, Any

from app.repositories.venue_repository import VenueRepository
from app.core.exceptions import handle_supabase_errors

class VenueService:
    """ 会場についての機能を実装するクラス """
    def __init__(self, venue_repository: VenueRepository, auth_client):
        self.repository = venue_repository
        self.auth_client = auth_client

    @handle_supabase_errors("get_all_venues")
    async def get_all_venues(self) -> List[Dict[str, Any]]:
        """ すべての会場を取得 """
        return await self.repository.find_all()
    
    # @handle_supabase_errors("get_venue")
    # async def get_venue(self, venue_id) -> Dict[str, Any]:
    #     """ 指定した会場情報を取得 """
    #     response = self.supabase.table('venues').select('*').eq('id', venue_id).execute()

    #     return response.data[0]
    
    # @handle_supabase_errors("create_venue")
    # async def create_venue(self, venue_data) -> Dict[str, Any]:
    #     """ 会場を作成 """
    #     response = self.supabase.table('venues').insert(venue_data).execute()

    #     return response.data[0]
    
    # @handle_supabase_errors("update_venue")
    # async def update_venue(self, venue_id, venue_data) -> Dict[str, Any]:
    #     """ 指定した会場情報を更新 """
    #     response = self.supabase.table('venues').update(venue_data).eq("id", venue_id).execute()

    #     return response.data[0]

    # @handle_supabase_errors("remove_venue")
    # async def remove_venue(self, venue_id) -> bool:
    #     """ 指定した会場を削除 """
    #     response = self.supabase.table('venues').delete().eq('id',venue_id).execute()
        
    #     return True