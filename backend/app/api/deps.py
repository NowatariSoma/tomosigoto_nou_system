from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase_service import supabase_service

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """JWTトークンから現在のユーザー情報を取得"""
    token = credentials.credentials
    user = await supabase_service.verify_jwt_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """現在のアクティブなユーザーを取得"""
    # ここで必要に応じてユーザーの状態チェックを行う
    # 例: if not current_user.get("active", True):
    #         raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_supabase_service() -> object:
    """Supabaseサービスのインスタンスを取得"""
    return supabase_service 