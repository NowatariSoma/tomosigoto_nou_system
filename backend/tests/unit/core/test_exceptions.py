"""
exceptions.py のユニットテスト

NOTE: このファイルはSupabaseからpsycopg2への移行に伴い整理済み。
      Supabase固有のデコレータ (handle_supabase_errors) は削除されたため、
      旧テストは削除した。create_error_response / create_success_response のみ残す。
"""
import pytest
from app.core.exceptions import create_error_response, create_success_response


class TestCreateErrorResponse:
    """create_error_response のテスト"""

    def test_create_error_response_basic(self):
        error = ValueError("Test error")
        result = create_error_response("Test message", error)
        assert result == {
            "status": "error",
            "error_message": "Test error",
            "error_type": "ValueError",
        }

    def test_create_error_response_different_types(self):
        for exc, etype in [
            (TypeError("Type error"), "TypeError"),
            (RuntimeError("Runtime error"), "RuntimeError"),
        ]:
            result = create_error_response("msg", exc)
            assert result["error_type"] == etype

    def test_create_error_response_empty_message(self):
        result = create_error_response("msg", ValueError(""))
        assert result["error_message"] == ""


class TestCreateSuccessResponse:
    """create_success_response のテスト"""

    def test_with_data_only(self):
        result = create_success_response({"key": "value"})
        assert result == {"status": "success", "data": {"key": "value"}}

    def test_with_message(self):
        result = create_success_response({"key": "value"}, "OK")
        assert result == {"status": "success", "message": "OK", "data": {"key": "value"}}

    def test_with_list_includes_count(self):
        result = create_success_response([1, 2, 3], "items")
        assert result["count"] == 3
        assert result["data"] == [1, 2, 3]

    def test_with_empty_list(self):
        result = create_success_response([])
        assert result["count"] == 0
        assert result["data"] == []

    def test_with_none_message(self):
        result = create_success_response({"k": "v"}, None)
        assert "message" not in result
