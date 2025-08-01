"""
UserRepository - データアクセス層の実装
Supabaseのusersテーブルに対するCRUD操作を提供
"""
import logging
from typing import List, Optional, Dict, Any
from supabase import Client
from app.core.exceptions import handle_supabase_errors

logger = logging.getLogger(__name__)


class UserRepository:
    """
    ユーザーデータへのアクセスを管理するリポジトリクラス
    すべてのデータベース操作をカプセル化
    """
    
    def __init__(self, client: Client):
        """
        Args:
            client: Supabaseクライアントインスタンス
        """
        self.client = client
        self.table_name = "users"
    
    @handle_supabase_errors("find_all")
    async def find_all(self) -> List[Dict[str, Any]]:
        """
        すべてのユーザーを取得
        
        Returns:
            ユーザー情報のリスト
        """
        response = self.client.table(self.table_name).select('*').execute()
        data = response.data or []
        logger.info(f"Found {len(data)} users in {self.table_name} table")
        return data
    
    @handle_supabase_errors("find_by_id")
    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        IDでユーザーを取得
        
        Args:
            user_id: ユーザーID
            
        Returns:
            ユーザー情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).select('*').eq('id', user_id).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Found user with id: {user_id}")
            return response.data[0]
        
        logger.info(f"User not found with id: {user_id}")
        return None
    
    @handle_supabase_errors("find_by_email")
    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        メールアドレスでユーザーを取得
        
        Args:
            email: メールアドレス
            
        Returns:
            ユーザー情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).select('*').eq('email', email).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"Found user with email: {email}")
            return response.data[0]
        
        logger.info(f"User not found with email: {email}")
        return None
    
    @handle_supabase_errors("create")
    async def create(self, user_data: dict) -> Dict[str, Any]:
        """
        新しいユーザーをデータベースに作成
        
        Args:
            user_data: ユーザー情報
            
        Returns:
            作成されたユーザー情報
        """
        response = self.client.table(self.table_name).insert(user_data).execute()
        if response.data:
            logger.info(f"User created successfully: {user_data.get('email', 'unknown')}")
            return response.data[0]
        
        logger.error(f"Failed to create user: {user_data.get('email', 'unknown')}")
        return {}
    
    @handle_supabase_errors("update")
    async def update(self, user_id: str, user_data: dict) -> Optional[Dict[str, Any]]:
        """
        ユーザー情報を更新
        
        Args:
            user_id: ユーザーID
            user_data: 更新するデータ
            
        Returns:
            更新されたユーザー情報、見つからない場合はNone
        """
        response = self.client.table(self.table_name).update(user_data).eq('id', user_id).execute()
        if response.data and len(response.data) > 0:
            logger.info(f"User updated successfully: {user_id}")
            return response.data[0]
        
        logger.warning(f"User not found for update: {user_id}")
        return None
    
    @handle_supabase_errors("delete")
    async def delete(self, user_id: str) -> bool:
        """
        ユーザーを削除
        
        Args:
            user_id: ユーザーID
            
        Returns:
            削除成功時True
        """
        self.client.table(self.table_name).delete().eq('id', user_id).execute()
        logger.info(f"User deleted successfully: {user_id}")
        return True
    
    @handle_supabase_errors("count")
    async def count(self) -> int:
        """
        ユーザー数を取得
        
        Returns:
            ユーザー数
        """
        response = self.client.table(self.table_name).select('id', count='exact').execute()
        count = response.count if hasattr(response, 'count') else 0
        logger.info(f"Total users count: {count}")
        return count