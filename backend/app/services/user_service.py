import logging
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status

from app.repositories.user_repository import UserRepository
from app.core.exceptions import APIException
from app.core.error_messages import ErrorMessage

logger = logging.getLogger(__name__)


class UserService:
    """
    ユーザー関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """
    
    def __init__(self, user_repository: UserRepository, auth_client):
        """
        Args:
            user_repository: UserRepositoryインスタンス
            auth_client: Supabase認証クライアント
        """
        self.repository = user_repository
        self.auth_client = auth_client
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """すべてのユーザーを取得"""
        return await self.repository.find_all()
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """IDでユーザーを取得"""
        user = await self.repository.find_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        return user
    
    async def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """JWTトークンを検証"""
        try:
            response = self.auth_client.get_user(token)
            
            if hasattr(response, 'user') and response.user:
                return response.user.dict()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None
    
    async def create_user(self, user_data: dict) -> Dict[str, Any]:
        """ユーザーを作成（認証とDB両方）"""
        # 既存ユーザーチェック
        existing_user = await self.repository.find_by_email(user_data["email"])
        if existing_user:
            raise APIException(ErrorMessage.USER_ALREADY_EXISTS)
        
        # Supabase Authでユーザーを作成
        auth_response = self.auth_client.admin.create_user({
            "email": user_data["email"],
            "password": user_data["password"],
            "email_confirm": True  # メール確認を自動で有効にする
        })
        
        if not auth_response.user:
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
        
        # DBに保存するユーザー情報
        user_record = {
            "id": auth_response.user.id,
            "email": user_data["email"],
            "created_at": auth_response.user.created_at.isoformat() if auth_response.user.created_at else None,
            "updated_at": auth_response.user.updated_at.isoformat() if auth_response.user.updated_at else None
        }
        
        # リポジトリを通してDBに保存
        created_user = await self.repository.create(user_record)
        logger.info(f"User created successfully: {user_data['email']}")
        return created_user
    
    async def delete_user(self, user_id: str) -> bool:
        """ユーザーを削除（DBと認証両方から）"""
        # ユーザーの存在確認
        user = await self.repository.find_by_id(user_id)
        if not user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        # まずDBから削除
        await self.repository.delete(user_id)
        
        # 次にSupabase Authからも削除
        try:
            self.auth_client.admin.delete_user(user_id)
        except Exception as e:
            logger.error(f"Failed to delete user from auth: {str(e)}")
            # DBから削除済みなので、エラーは警告のみ
        
        logger.info(f"User deleted successfully: {user_id}")
        return True
    
    async def update_user(self, user_id: str, user_data: dict) -> Optional[Dict[str, Any]]:
        """ユーザー情報を更新"""
        # ユーザーの存在確認
        existing_user = await self.repository.find_by_id(user_id)
        if not existing_user:
            raise APIException(ErrorMessage.USER_NOT_FOUND)
        
        # 更新データを準備
        update_data = {}
        if "email" in user_data:
            update_data["email"] = user_data["email"]
        if "name" in user_data:
            update_data["name"] = user_data["name"]
        
        if not update_data:
            return existing_user
        
        # リポジトリを通して更新
        updated_user = await self.repository.update(user_id, update_data)
        logger.info(f"User updated successfully: {user_id}")
        return updated_user