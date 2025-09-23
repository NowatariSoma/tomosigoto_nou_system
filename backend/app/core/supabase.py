from supabase import create_client, Client
from app.core.config import settings
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def get_supabase() -> Client:
    """
    Supabaseクライアントを依存性注入で提供
    
    Returns:
        Client: Supabaseクライアント
        
    Raises:
        ValueError: 必要な環境変数が設定されていない場合
    """
    if not settings.SUPABASE_URL:
        raise ValueError("SUPABASE_URL must be set in environment variables")
    
    # サービスロールキーを優先、なければアノンキーを使用
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not api_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set")
    
    client = create_client(settings.SUPABASE_URL, api_key)
    return client


def handle_supabase_errors(operation_name: str):
    """
    Supabase操作のエラーハンドリングデコレータ
    
    Args:
        operation_name: 操作名（ログ用）
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Supabase operation '{operation_name}' failed: {e}")
                raise
        return wrapper
    return decorator