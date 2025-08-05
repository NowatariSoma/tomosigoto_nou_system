import logging
from typing import List, Optional, Dict, Any

from app.repositories.venue_repository import VenueRepository
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage

logger = logging.getLogger(__name__)


class VenueService:
    """
    会場関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """
    
    def __init__(self, venue_repository: VenueRepository):
        """
        Args:
            venue_repository: VenueRepositoryインスタンス
        """
        self.repository = venue_repository
    
    async def get_all_venues(self) -> List[Dict[str, Any]]:
        """すべての会場を取得"""
        return await self.repository.find_all()
    
    async def get_venue_by_id(self, venue_id: str) -> Optional[Dict[str, Any]]:
        """IDで会場を取得"""
        venue = await self.repository.find_by_id(venue_id)
        if not venue:
            raise APIException(ErrorMessage.VENUE_NOT_FOUND)
        return venue
    
    async def create_venue(self, venue_data: dict) -> Dict[str, Any]:
        """会場を作成"""
        # 既存会場名チェック
        existing_venue = await self.repository.find_by_name(venue_data["name"])
        if existing_venue:
            raise APIException(ErrorMessage.VENUE_ALREADY_EXISTS)
        
        # リポジトリを通してDBに保存
        created_venue = await self.repository.create(venue_data)
        logger.info(f"Venue created successfully: {venue_data['name']}")
        return created_venue
    
    async def update_venue(self, venue_id: str, venue_data: dict) -> Optional[Dict[str, Any]]:
        """会場情報を更新"""
        # 会場の存在確認
        existing_venue = await self.repository.find_by_id(venue_id)
        if not existing_venue:
            raise APIException(ErrorMessage.VENUE_NOT_FOUND)
        
        # 更新データを準備
        update_data = {}
        if "name" in venue_data:
            update_data["name"] = venue_data["name"]
        
        if not update_data:
            return existing_venue
        
        # リポジトリを通して更新
        updated_venue = await self.repository.update(venue_id, update_data)
        logger.info(f"Venue updated successfully: {venue_id}")
        return updated_venue
    
    async def delete_venue(self, venue_id: str) -> bool:
        """会場を削除"""
        # 会場の存在確認
        venue = await self.repository.find_by_id(venue_id)
        if not venue:
            raise APIException(ErrorMessage.VENUE_NOT_FOUND)
        
        # リポジトリを通して削除
        success = await self.repository.delete(venue_id)
        if success:
            logger.info(f"Venue deleted successfully: {venue_id}")
        else:
            logger.error(f"Failed to delete venue: {venue_id}")
        
        return success