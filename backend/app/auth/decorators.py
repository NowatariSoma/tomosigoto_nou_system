"""
権限チェックデコレータ

このモジュールは以下の機能を提供します：
- 権限要求デコレータ
- ロール要求デコレータ
- リソース権限デコレータ
- リソース所有者デコレータ
"""

from typing import Callable, Any, Optional
from functools import wraps
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPAuthorizationCredentials
import logging

from app.auth.roles import RoleManager
from app.auth.permissions import PermissionManager
from app.auth.db_adapter import SupabaseDBAdapter
from app.services.supabase_service import SupabaseService
from app.core.config import settings

logger = logging.getLogger(__name__)

# グローバルインスタンス（シングルトンパターン）
_supabase_service: Optional[SupabaseService] = None
_role_manager: Optional[RoleManager] = None
_permission_manager: Optional[PermissionManager] = None


def require_permission(permission: str) -> Callable:
    """権限要求デコレータ（FastAPI Depends用）"""
    async def check_permission_dependency(request: Request) -> str:
        """権限チェック依存関数"""
        try:
            # ユーザーID取得
            user_id = await get_user_id_from_request(request)
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="認証が必要です"
                )
            
            # 権限チェック
            role_manager = get_role_manager()
            permission_manager = get_permission_manager()
            
            has_permission = await permission_manager.check_permission(
                user_id, permission, role_manager
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=403,
                    detail=f"権限が不足しています: {permission}"
                )
            
            return user_id
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Permission check failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="認証処理中にエラーが発生しました"
            )
    
    return Depends(check_permission_dependency)


def require_role(role_name: str) -> Callable:
    """ロール要求デコレータ（FastAPI Depends用）"""
    async def check_role_dependency(request: Request) -> str:
        """ロールチェック依存関数"""
        try:
            # ユーザーID取得
            user_id = await get_user_id_from_request(request)
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="認証が必要です"
                )
            
            # ロールチェック
            role_manager = get_role_manager()
            has_role = await role_manager.has_role(user_id, role_name)
            
            if not has_role:
                raise HTTPException(
                    status_code=403,
                    detail=f"必要なロールがありません: {role_name}"
                )
            
            return user_id
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Role check failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="認証処理中にエラーが発生しました"
            )
    
    return Depends(check_role_dependency)


def resource_permission(resource_type: str, action: str) -> Callable:
    """リソース権限デコレータ（FastAPI Depends用）"""
    async def check_resource_permission_dependency(request: Request) -> str:
        """リソース権限チェック依存関数"""
        try:
            # ユーザーID取得
            user_id = await get_user_id_from_request(request)
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="認証が必要です"
                )
            
            # リソース権限チェック
            role_manager = get_role_manager()
            permission_manager = get_permission_manager()
            
            has_permission = await permission_manager.check_resource_permission(
                user_id, resource_type, action, role_manager
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=403,
                    detail=f"リソース権限が不足しています: {resource_type}:{action}"
                )
            
            return user_id
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Resource permission check failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="認証処理中にエラーが発生しました"
            )
    
    return Depends(check_resource_permission_dependency)


def resource_owner(resource_type: str, id_param: str) -> Callable:
    """リソース所有者デコレータ（FastAPI Depends用）"""
    async def check_resource_owner_dependency(request: Request) -> str:
        """リソース所有者チェック依存関数"""
        try:
            # ユーザーID取得
            user_id = await get_user_id_from_request(request)
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="認証が必要です"
                )
            
            # パスパラメータからリソースID取得
            resource_id = request.path_params.get(id_param)
            if not resource_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"リソースIDが指定されていません: {id_param}"
                )
            
            # 管理者チェック（管理者は全リソースにアクセス可能）
            role_manager = get_role_manager()
            is_admin = await role_manager.has_role(user_id, "admin")
            
            if is_admin:
                return user_id
            
            # オーナーシップチェック
            permission_manager = get_permission_manager()
            is_owner = await permission_manager.check_ownership(
                user_id, resource_type, resource_id
            )
            
            if not is_owner:
                raise HTTPException(
                    status_code=403,
                    detail=f"リソースへのアクセス権限がありません: {resource_type}:{resource_id}"
                )
            
            return user_id
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Resource owner check failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="認証処理中にエラーが発生しました"
            )
    
    return Depends(check_resource_owner_dependency)


async def get_user_id_from_request(request: Request) -> Optional[str]:
    """リクエストからユーザーID取得"""
    try:
        # Authorizationヘッダーからトークン取得
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ", 1)[1] if len(auth_header.split(" ", 1)) > 1 else None
        if not token:
            return None
        
        # JWTトークン検証
        supabase_service = get_supabase_service()
        user_data = await supabase_service.verify_jwt_token(token)
        
        if user_data and 'id' in user_data:
            return user_data['id']
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to get user ID from request: {e}")
        return None


def get_supabase_service() -> SupabaseService:
    """SupabaseService取得（シングルトン）"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service


def get_role_manager() -> RoleManager:
    """RoleManager取得（シングルトン）"""
    global _role_manager
    if _role_manager is None:
        supabase_service = get_supabase_service()
        db_adapter = SupabaseDBAdapter(supabase_service)
        
        # 設定ファイルのパスを指定
        config_path = "/home/runner/work/tomosigoto_nou_system/tomosigoto_nou_system/backend/config/roles.json"
        _role_manager = RoleManager(db_adapter, config_path)
    
    return _role_manager


def get_permission_manager() -> PermissionManager:
    """PermissionManager取得（シングルトン）"""
    global _permission_manager
    if _permission_manager is None:
        supabase_service = get_supabase_service()
        db_adapter = SupabaseDBAdapter(supabase_service)
        
        # 設定ファイルのパスを指定
        config_path = "/home/runner/work/tomosigoto_nou_system/tomosigoto_nou_system/backend/config/roles.json"
        _permission_manager = PermissionManager(config_path, db_adapter)
    
    return _permission_manager