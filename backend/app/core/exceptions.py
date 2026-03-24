import logging
from functools import wraps
from typing import Any

import psycopg2
from fastapi import HTTPException, status

from app.core.error_messages import ErrorMessage

logger = logging.getLogger(__name__)


class APIException(HTTPException):
    """API例外 - HTTPExceptionを拡張して統一的なエラーレスポンス形式を提供"""

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

        self.message = message
        self.detail = {"error_code": str(error_obj), "error_msg": message}

        logger.error(f"APIException: {self.detail}")

        super().__init__(self.status_code, self.detail)


def handle_db_errors(operation_name: str = "operation"):
    """psycopg2エラーを集約ハンドリングするデコレータ"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except psycopg2.Error as e:
                logger.error(f"Database error in {operation_name}: {e}")
                raise APIException(ErrorMessage.DATABASE_ERROR)
            except HTTPException:
                raise
            except APIException:
                raise
            except Exception as e:
                logger.error(f"Unexpected error in {operation_name}: {e}", exc_info=True)
                raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
        return wrapper
    return decorator


def create_error_response(message: str, error: Exception) -> dict[str, Any]:
    return {
        "status": "error",
        "error_message": str(error),
        "error_type": type(error).__name__,
    }


def create_success_response(data: Any, message: str | None = None) -> dict[str, Any]:
    response: dict[str, Any] = {"status": "success"}
    if message:
        response["message"] = message
    if isinstance(data, list):
        response["count"] = len(data)
        response["data"] = data
    else:
        response["data"] = data
    return response
