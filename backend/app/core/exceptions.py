import logging
from typing import Dict, Any, Optional
from functools import wraps
from supabase import PostgrestAPIError, AuthError
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


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
                logger.error(f"Database error in {operation_name}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database connection error"
                )
            except AuthError as e:
                logger.error(f"Authentication error in {operation_name}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication error"
                )
            except HTTPException:
                # Re-raise HTTP exceptions without modification
                raise
            except Exception as e:
                logger.error(f"Unexpected error in {operation_name}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Internal server error"
                )
        return wrapper
    return decorator


def create_error_response(message: str, error: Exception) -> Dict[str, Any]:
    """
    Create a consistent error response format for debug endpoints.
    """
    return {
        "status": "error",
        "error_message": str(error),
        "error_type": type(error).__name__
    }


def create_success_response(data: Any, message: Optional[str] = None) -> Dict[str, Any]:
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