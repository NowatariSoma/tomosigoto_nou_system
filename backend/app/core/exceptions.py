import logging
from typing import Any
from functools import wraps
from supabase import PostgrestAPIError, AuthError
from fastapi import HTTPException, status

from app.core.error_messages import ErrorMessage

logger = logging.getLogger(__name__)


class APIException(HTTPException):
    """API例外
    
    HTTPExceptionを拡張して、統一的なエラーレスポンス形式を提供
    """
    
    default_status_code = status.HTTP_400_BAD_REQUEST
    
    def __init__(
        self,
        error: Any,
        status_code: int = default_status_code,
        headers: dict[str, Any] | None = None,
    ) -> None:
        self.headers = headers
        try:
            error_obj = error()
        except Exception:
            error_obj = error
        
        if hasattr(error_obj, "text"):
            try:
                message = error_obj.text.format(getattr(error_obj, "param", ""))
            except Exception:
                message = error_obj.text
        else:
            message = str(error_obj)
        
        if hasattr(error_obj, "status_code"):
            self.status_code = error_obj.status_code
        else:
            self.status_code = status_code
        
        self.detail = {"error_code": str(error_obj), "error_msg": message}
        
        logger.error(f"{operation_name if 'operation_name' in locals() else 'Unknown operation'}: {self.detail}")
        
        super().__init__(self.status_code, self.detail)


def handle_supabase_errors(operation_name: str = "operation"):
    """
    Decorator to handle common Supabase errors in a centralized way.
    Reduces repetitive error handling code throughout the application.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except PostgrestAPIError as e:
                # 詳細なエラー情報をログに出力
                logger.error(f"Database error in {operation_name}: {str(e)}")
                logger.error(f"Error details: code={getattr(e, 'code', None)}, message={getattr(e, 'message', None)}, details={getattr(e, 'details', None)}")
                # デバッグ用：エラーの全属性を出力
                logger.error(f"PostgrestAPIError attributes: {dir(e)}")
                logger.error(f"PostgrestAPIError __dict__: {e.__dict__ if hasattr(e, '__dict__') else 'No __dict__'}")
                raise APIException(ErrorMessage.DATABASE_ERROR)
            except AuthError as e:
                logger.error(f"Authentication error in {operation_name}: {str(e)}")
                raise APIException(ErrorMessage.AUTHENTICATION_ERROR)
            except HTTPException:
                # Re-raise HTTP exceptions without modification
                raise
            except Exception as e:
                logger.error(f"Unexpected error in {operation_name}: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                logger.error(f"Exception details: {e.__dict__ if hasattr(e, '__dict__') else 'No __dict__'}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
        return wrapper
    return decorator


def create_error_response(message: str, error: Exception) -> dict[str, Any]:
    """
    Create a consistent error response format for debug endpoints.
    """
    return {
        "status": "error",
        "error_message": str(error),
        "error_type": type(error).__name__
    }


def create_success_response(data: Any, message: str | None = None) -> dict[str, Any]:
    """
    Create a consistent success response format for debug endpoints.
    """
    response = {"status": "success"}
    if message:
        response["message"] = message
    if isinstance(data, list):
        response["count"] = len(data)
        response["data"] = data
    else:
        response["data"] = data
    return response