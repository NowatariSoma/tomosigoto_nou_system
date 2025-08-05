"""
VenueRepository - データアクセス層の実装
Supabaseのvenuesテーブルに対するCRUD操作を提供
"""
import logging
from typing import List, Optional, Dict, Any
from supabase import Client
from app.core.exceptions import handle_supabase_errors

logger = logging.getLogger(__name__)


class VenueRepository:
    """
    会場データへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """
    
    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "venues"
    
    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """
        すべての会場を取得
        
        Returns:
            会場情報のリスト
        """
        response = self.client.table(self.table_name).select('*').execute()
        data = response.data or []
        logger.info(f"Found {len(data)} venues in {self.table_name} table")
        return data
    
    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, venue_id: str) -> Optional[Dict[str, Any]]:
        """
        IDで会場を取得
        
        Args:
            venue_id: 会場ID
            
        Returns:
            会場情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).select('*').eq('id', venue_id).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Found venue with id: {venue_id}")
            return response.data[0]
        
        logger.info(f"Venue not found with id: {venue_id}")
        return None
    
    @handle_supabase_errors("find_by_name")
    async def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        名前で会場を取得
        
        Args:
            name: 会場名
            
        Returns:
            会場情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).select('*').eq('name', name).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Found venue with name: {name}")
            return response.data[0]
        
        logger.info(f"Venue not found with name: {name}")
        return None
    
    @handle_supabase_errors("create")
    async def create(self, venue_data: dict) -> Dict[str, Any]:
        """
        新しい会場をデータベースに作成
        
        Args:
            venue_data: 会場情報
            
        Returns:
            作成された会場情報
        """
        response = self.client.table(self.table_name).insert(venue_data).execute()
        if response.data:
            logger.info(f"Venue created successfully: {venue_data.get('name', 'unknown')}")
            return response.data[0]
        
        logger.error(f"Failed to create venue: {venue_data.get('name', 'unknown')}")
        return {}
    
    @handle_supabase_errors("update")
    async def update(self, venue_id: str, venue_data: dict) -> Optional[Dict[str, Any]]:
        """
        会場情報を更新
        
        Args:
            venue_id: 会場ID
            venue_data: 更新するデータ
            
        Returns:
            更新された会場情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).update(venue_data).eq('id', venue_id).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Venue updated successfully: {venue_id}")
            return response.data[0]
        
        logger.warning(f"Venue not found for update: {venue_id}")
        return None
    
    @handle_supabase_errors("delete")
    async def delete(self, venue_id: str) -> bool:
        """
        会場を削除
        
        Args:
            venue_id: 会場ID
            
        Returns:
            削除成功時True、失敗時False
        """
        response = self.client.table(self.table_name).delete().eq('id', venue_id).execute()
        # 削除されたレコード数をチェック
        if response.data and len(response.data) > 0:
            logger.info(f"Venue deleted successfully: {venue_id}")
            return True
        else:
            logger.warning(f"No venue found to delete: {venue_id}")
            return False
    
    @handle_supabase_errors("count")
    async def count(self) -> int:
        """
        会場数を取得
        
        Returns:
            会場数
        """
        response = self.client.table(self.table_name).select('id', count='exact').execute()
        count = response.count if hasattr(response, 'count') else 0
        logger.info(f"Total venues count: {count}")
        return count