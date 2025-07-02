import logging
from typing import List, Optional, Dict, Any
from supabase import create_client, Client, PostgrestAPIError, AuthError
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Supabaseとの連携を行うサービスクラス"""
    
    def __init__(self):
        if not settings.SUPABASE_URL:
            raise ValueError("SUPABASE_URL must be set in environment variables")
        
        # アノンキーまたはサービスロールキーのどちらかを使用
        api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if not api_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set")
        
        try:
            self.supabase: Client = create_client(settings.SUPABASE_URL, api_key)
            logger.info(f"Supabase client initialized with URL: {settings.SUPABASE_URL}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """すべてのユーザーを取得（userテーブルから）"""
        try:
            response = self.supabase.table('users').select('*').execute()
            if response.data:
                logger.info(f"Found {len(response.data)} users in users table")
                return response.data
            
            logger.info("No users found in users table")
            return []
                
        except PostgrestAPIError as e:
            logger.error(f"Supabase client error fetching users: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        except AuthError as e:
            logger.error(f"Supabase auth error fetching users: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching users: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """IDでユーザーを取得（userテーブルから）"""
        try:
            response = self.supabase.table('users').select('*').eq('id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
                
            return None
                
        except PostgrestAPIError as e:
            logger.error(f"Supabase client error fetching user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        except AuthError as e:
            logger.error(f"Supabase auth error fetching user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    async def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """JWTトークンを検証"""
        try:
            response = self.supabase.auth.get_user(token)
            
            if hasattr(response, 'user') and response.user:
                return response.user.dict()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}")
            return None

    async def get_table_list(self) -> List[str]:
        """利用可能なテーブル一覧を取得（デバッグ用）"""
        try:
            response = self.supabase.table('users').select('*').limit(1).execute()
            return ['users']
        except:
            return []

    async def create_user(self, user_data: dict) -> Dict[str, Any]:
        """ユーザーを作成"""
        try:
            # Supabase Authでユーザーを作成
            auth_response = self.supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True  # メール確認を自動で有効にする
            })
            
            if not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user"
                )
            
            # usersテーブルに追加情報を保存
            user_record = {
                "id": auth_response.user.id,
                "email": user_data["email"],
                "created_at": auth_response.user.created_at.isoformat() if auth_response.user.created_at else None,
                "updated_at": auth_response.user.updated_at.isoformat() if auth_response.user.updated_at else None
            }
            
            # usersテーブルに挿入
            db_response = self.supabase.table('users').insert(user_record).execute()
            
            if db_response.data:
                logger.info(f"User created successfully: {user_data['email']}")
                return db_response.data[0]
            else:
                # Authユーザーは作成されたが、DBレコードの作成に失敗
                logger.warning(f"User created in auth but failed to save to users table: {user_data['email']}")
                return user_record
                
        except PostgrestAPIError as e:
            logger.error(f"Supabase client error creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        except AuthError as e:
            logger.error(f"Supabase auth error creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
        except Exception as e:
            logger.error(f"Unexpected error creating user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    async def delete_user(self, user_id: str) -> bool:
        """ユーザーを削除"""
        try:
            # まずusersテーブルから削除
            db_response = self.supabase.table('users').delete().eq('id', user_id).execute()
            
            # Supabase Authからも削除
            auth_response = self.supabase.auth.admin.delete_user(user_id)
            
            logger.info(f"User deleted successfully: {user_id}")
            return True
                
        except PostgrestAPIError as e:
            logger.error(f"Supabase client error deleting user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        except AuthError as e:
            logger.error(f"Supabase auth error deleting user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
        except Exception as e:
            logger.error(f"Unexpected error deleting user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )

    # nameはない
    async def update_user(self, user_id: str, user_data: dict) -> Optional[Dict[str, Any]]:
        """ユーザー情報を更新"""
        try:
            # 更新データを準備
            update_data = {}
            if "email" in user_data:
                update_data["email"] = user_data["email"]
            if "name" in user_data:
                update_data["name"] = user_data["name"]
            
            if not update_data:
                return await self.get_user_by_id(user_id)
            
            # usersテーブルを更新
            response = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"User updated successfully: {user_id}")
                return response.data[0]
            
            return None
                
        except PostgrestAPIError as e:
            logger.error(f"Supabase client error updating user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection error"
            )
        except AuthError as e:
            logger.error(f"Supabase auth error updating user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )
        except Exception as e:
            logger.error(f"Unexpected error updating user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )


# シングルトンインスタンス
supabase_service = SupabaseService() 