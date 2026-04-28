"""シンプルな動作確認テスト"""

import pytest
from unittest.mock import Mock
from fastapi.testclient import TestClient
from app.main import app


class TestSimpleExample:
    """基本的なテストの動作確認"""
    
    def test_addition(self):
        """単純な計算テスト"""
        assert 2 + 2 == 4
    
    def test_string_operations(self):
        """文字列操作のテスト"""
        text = "Hello World"
        assert text.lower() == "hello world"
        assert text.upper() == "HELLO WORLD"
        assert len(text) == 11
    
    def test_list_operations(self):
        """リスト操作のテスト"""
        numbers = [1, 2, 3, 4, 5]
        assert len(numbers) == 5
        assert sum(numbers) == 15
        assert max(numbers) == 5
        assert min(numbers) == 1
    
    def test_dictionary_operations(self):
        """辞書操作のテスト"""
        user = {
            "id": 1,
            "name": "Test User",
            "email": "test@example.com"
        }
        assert user["id"] == 1
        assert user.get("name") == "Test User"
        assert "email" in user
        assert user.get("age") is None
    
    @pytest.mark.parametrize("input,expected", [
        (1, 1),
        (2, 4),
        (3, 9),
        (4, 16),
        (5, 25),
    ])
    def test_parametrized_square(self, input, expected):
        """パラメータ化テストの例"""
        assert input ** 2 == expected
    
    def test_mock_example(self):
        """モックの使用例"""
        mock_service = Mock()
        mock_service.get_user.return_value = {"id": 1, "name": "Mock User"}
        
        result = mock_service.get_user(1)
        assert result["name"] == "Mock User"
        mock_service.get_user.assert_called_once_with(1)
    

    def test_api_health_check(self):
        """APIヘルスチェックエンドポイントのテスト"""
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_exception_handling(self):
        """例外処理のテスト"""
        def divide(a, b):
            if b == 0:
                raise ValueError("Division by zero")
            return a / b
        
        assert divide(10, 2) == 5
        
        with pytest.raises(ValueError, match="Division by zero"):
            divide(10, 0)
    
    @pytest.fixture
    def sample_data(self):
        """フィクスチャの例"""
        return {
            "users": [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"},
            ],
            "total": 2
        }
    
    def test_using_fixture(self, sample_data):
        """フィクスチャを使用したテスト"""
        assert sample_data["total"] == 2
        assert len(sample_data["users"]) == 2
        assert sample_data["users"][0]["name"] == "Alice"


class TestGroupedTests:
    """グループ化されたテストの例"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """各テストメソッド実行前のセットアップ"""
        self.test_value = 42
        yield
        # クリーンアップコード（必要な場合）
    
    def test_setup_value(self):
        """セットアップで設定した値のテスト"""
        assert self.test_value == 42
    
    def test_modify_value(self):
        """値の変更テスト"""
        self.test_value = 100
        assert self.test_value == 100
    
    @pytest.mark.skip(reason="デモンストレーション用のスキップ")
    def test_skipped(self):
        """スキップされるテスト"""
        assert False  # このテストは実行されない
    
    @pytest.mark.xfail(reason="既知の問題")
    def test_expected_failure(self):
        """失敗が予期されるテスト"""
        assert False  # 失敗するが、xfailとしてマークされる