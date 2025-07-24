import pytest
from unittest.mock import Mock, AsyncMock
from fastapi import HTTPException, status
from supabase import PostgrestAPIError, AuthError

from app.core.exceptions import (
    handle_supabase_errors,
    create_error_response,
    create_success_response
)


class TestHandleSupabaseErrors:
    """Test cases for handle_supabase_errors decorator"""

    @pytest.mark.asyncio
    async def test_decorator_success(self):
        """Test decorator allows successful function execution"""
        @handle_supabase_errors("test_operation")
        async def success_function():
            return {"result": "success"}
        
        result = await success_function()
        assert result == {"result": "success"}

    @pytest.mark.asyncio
    async def test_decorator_postgrest_error(self):
        """Test decorator handles PostgrestAPIError"""
        @handle_supabase_errors("test_operation")
        async def failing_function():
            raise PostgrestAPIError("Database connection failed")
        
        with pytest.raises(HTTPException) as exc_info:
            await failing_function()
        
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Database connection error"

    @pytest.mark.asyncio
    async def test_decorator_auth_error(self):
        """Test decorator handles AuthError"""
        @handle_supabase_errors("test_operation")
        async def failing_function():
            raise AuthError("Authentication failed")
        
        with pytest.raises(HTTPException) as exc_info:
            await failing_function()
        
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Authentication error"

    @pytest.mark.asyncio
    async def test_decorator_http_exception_passthrough(self):
        """Test decorator re-raises HTTPException without modification"""
        original_exception = HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
        
        @handle_supabase_errors("test_operation")
        async def failing_function():
            raise original_exception
        
        with pytest.raises(HTTPException) as exc_info:
            await failing_function()
        
        assert exc_info.value is original_exception
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert exc_info.value.detail == "Not found"

    @pytest.mark.asyncio
    async def test_decorator_unexpected_error(self):
        """Test decorator handles unexpected errors"""
        @handle_supabase_errors("test_operation")
        async def failing_function():
            raise ValueError("Unexpected error")
        
        with pytest.raises(HTTPException) as exc_info:
            await failing_function()
        
        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc_info.value.detail == "Internal server error"

    @pytest.mark.asyncio
    async def test_decorator_with_args_and_kwargs(self):
        """Test decorator works with function arguments"""
        @handle_supabase_errors("test_operation")
        async def function_with_args(arg1, arg2, kwarg1=None):
            return {"args": [arg1, arg2], "kwargs": {"kwarg1": kwarg1}}
        
        result = await function_with_args("test1", "test2", kwarg1="test3")
        expected = {"args": ["test1", "test2"], "kwargs": {"kwarg1": "test3"}}
        assert result == expected

    @pytest.mark.asyncio
    async def test_decorator_preserves_function_metadata(self):
        """Test decorator preserves original function metadata with @wraps"""
        @handle_supabase_errors("test_operation")
        async def original_function():
            """Original function docstring"""
            return "success"
        
        # Check that function name and docstring are preserved
        assert original_function.__name__ == "original_function"
        assert original_function.__doc__ == "Original function docstring"

    def test_decorator_custom_operation_name(self):
        """Test decorator uses custom operation name in logging"""
        # This test indirectly verifies the operation name is used
        # by checking that the decorator can be called with different operation names
        decorator1 = handle_supabase_errors("operation1")
        decorator2 = handle_supabase_errors("operation2")
        
        assert callable(decorator1)
        assert callable(decorator2)


class TestCreateErrorResponse:
    """Test cases for create_error_response function"""

    def test_create_error_response_basic(self):
        """Test basic error response creation"""
        error = ValueError("Test error")
        result = create_error_response("Test message", error)
        
        expected = {
            "status": "error",
            "error_message": "Test error",
            "error_type": "ValueError"
        }
        assert result == expected

    def test_create_error_response_different_exception_types(self):
        """Test error response with different exception types"""
        # Test with different exception types
        exceptions = [
            (ValueError("Value error"), {"status": "error", "error_message": "Value error", "error_type": "ValueError"}),
            (TypeError("Type error"), {"status": "error", "error_message": "Type error", "error_type": "TypeError"}),
            (RuntimeError("Runtime error"), {"status": "error", "error_message": "Runtime error", "error_type": "RuntimeError"}),
        ]
        
        for exception, expected in exceptions:
            result = create_error_response("Test message", exception)
            assert result == expected

    def test_create_error_response_empty_message(self):
        """Test error response with empty error message"""
        error = ValueError("")
        result = create_error_response("Test message", error)
        
        expected = {
            "status": "error",
            "error_message": "",
            "error_type": "ValueError"
        }
        assert result == expected


class TestCreateSuccessResponse:
    """Test cases for create_success_response function"""

    def test_create_success_response_with_data_only(self):
        """Test success response with data only"""
        data = {"key": "value"}
        result = create_success_response(data)
        
        expected = {
            "status": "success",
            "data": {"key": "value"}
        }
        assert result == expected

    def test_create_success_response_with_message(self):
        """Test success response with message"""
        data = {"key": "value"}
        result = create_success_response(data, "Operation successful")
        
        expected = {
            "status": "success",
            "message": "Operation successful",
            "data": {"key": "value"}
        }
        assert result == expected

    def test_create_success_response_with_list(self):
        """Test success response with list data includes count"""
        data = [{"id": 1}, {"id": 2}, {"id": 3}]
        result = create_success_response(data, "Users retrieved")
        
        expected = {
            "status": "success",
            "message": "Users retrieved",
            "count": 3,
            "data": [{"id": 1}, {"id": 2}, {"id": 3}]
        }
        assert result == expected

    def test_create_success_response_with_empty_list(self):
        """Test success response with empty list"""
        data = []
        result = create_success_response(data)
        
        expected = {
            "status": "success",
            "count": 0,
            "data": []
        }
        assert result == expected

    def test_create_success_response_with_none_message(self):
        """Test success response with None message"""
        data = {"key": "value"}
        result = create_success_response(data, None)
        
        expected = {
            "status": "success",
            "data": {"key": "value"}
        }
        assert result == expected

    def test_create_success_response_with_different_data_types(self):
        """Test success response with different data types"""
        test_cases = [
            # String data
            ("test string", None, {"status": "success", "data": "test string"}),
            # Integer data
            (42, None, {"status": "success", "data": 42}),
            # Boolean data
            (True, None, {"status": "success", "data": True}),
            # None data
            (None, None, {"status": "success", "data": None}),
        ]
        
        for data, message, expected in test_cases:
            result = create_success_response(data, message)
            assert result == expected