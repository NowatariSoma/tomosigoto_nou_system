import pytest
from unittest.mock import Mock, AsyncMock, patch
import os
from app.core.gemini_client import GeminiTaggingClient, TagSuggestion

class TestGeminiTaggingClient:
    """GeminiTaggingClientのテストクラス"""
    
    @pytest.fixture
    def mock_env_vars(self):
        """環境変数をモック"""
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-api-key"}):
            yield
    
    @pytest.fixture
    def client(self, mock_env_vars):
        """テスト用のクライアントインスタンス"""
        with patch('google.generativeai.configure'):
            with patch('google.generativeai.GenerativeModel'):
                return GeminiTaggingClient()
    
    def test_init_without_api_key(self):
        """API キーが設定されていない場合のテスト"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="GEMINI_API_KEY environment variable is required"):
                GeminiTaggingClient()
    
    def test_init_with_api_key(self, mock_env_vars):
        """API キーが正しく設定されている場合のテスト"""
        with patch('google.generativeai.configure') as mock_configure:
            with patch('google.generativeai.GenerativeModel') as mock_model:
                client = GeminiTaggingClient()
                mock_configure.assert_called_once_with(api_key="test-api-key")
                mock_model.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_suggest_tags_success(self, client):
        """正常なタグ提案のテスト"""
        # モックレスポンスを設定
        mock_part = Mock()
        mock_part.function_call = Mock()
        mock_part.function_call.name = "suggest_tags"
        mock_part.function_call.args = {
            "suggestions": [
                {
                    "category": "回生",
                    "tag": "1回生",
                    "confidence": 0.9
                },
                {
                    "category": "演目",
                    "tag": "弓八幡",
                    "confidence": 0.8
                }
            ]
        }
        
        mock_candidate = Mock()
        mock_candidate.content.parts = [mock_part]
        
        mock_response = Mock()
        mock_response.candidates = [mock_candidate]
        
        client.model.generate_content = Mock(return_value=mock_response)
        
        # テスト実行
        result = await client.suggest_tags("1回生 弓八幡 稽古")
        
        # 結果検証
        assert len(result) == 2
        assert result[0].category == "回生"
        assert result[0].tag == "1回生"
        assert result[0].confidence == 0.9
        assert result[1].category == "演目"
        assert result[1].tag == "弓八幡"
        assert result[1].confidence == 0.8
    
    @pytest.mark.asyncio
    async def test_suggest_tags_no_function_call(self, client):
        """Function Callingが失敗した場合のテスト"""
        mock_response = Mock()
        mock_response.candidates = []
        
        client.model.generate_content = Mock(return_value=mock_response)
        
        # テスト実行
        result = await client.suggest_tags("テスト動画")
        
        # 空のリストが返されることを確認
        assert result == []
    
    @pytest.mark.asyncio
    async def test_suggest_tags_api_error(self, client):
        """API エラーが発生した場合のテスト"""
        client.model.generate_content = Mock(side_effect=Exception("API Error"))
        
        # テスト実行
        result = await client.suggest_tags("テスト動画")
        
        # 空のリストが返されることを確認
        assert result == []
    
    @pytest.mark.asyncio
    async def test_suggest_tags_with_description(self, client):
        """動画説明も含めたタグ提案のテスト"""
        mock_part = Mock()
        mock_part.function_call = Mock()
        mock_part.function_call.name = "suggest_tags"
        mock_part.function_call.args = {
            "suggestions": [
                {
                    "category": "先生",
                    "tag": "先生",
                    "confidence": 0.95
                }
            ]
        }
        
        mock_candidate = Mock()
        mock_candidate.content.parts = [mock_part]
        
        mock_response = Mock()
        mock_response.candidates = [mock_candidate]
        
        client.model.generate_content = Mock(return_value=mock_response)
        
        # テスト実行
        result = await client.suggest_tags("能楽稽古", "先生による指導動画")
        
        # 結果検証
        assert len(result) == 1
        assert result[0].category == "先生"
        assert result[0].tag == "先生"
        assert result[0].confidence == 0.95
    
    def test_get_available_tags(self, client):
        """利用可能なタグの取得テスト"""
        result = client.get_available_tags()
        
        expected_tags = {
            "回生": ["1回生", "2回生", "3回生", "4回生"],
            "先生": ["先生", "学生"],
            "演目": ["弓八幡", "羽衣", "敦盛"]
        }
        
        assert result == expected_tags
    
    @pytest.mark.asyncio
    async def test_suggest_tags_invalid_confidence(self, client):
        """不正な信頼度値の場合のテスト"""
        mock_part = Mock()
        mock_part.function_call = Mock()
        mock_part.function_call.name = "suggest_tags"
        mock_part.function_call.args = {
            "suggestions": [
                {
                    "category": "回生",
                    "tag": "1回生",
                    "confidence": 1.5  # 不正な値（1.0を超える）
                }
            ]
        }
        
        mock_candidate = Mock()
        mock_candidate.content.parts = [mock_part]
        
        mock_response = Mock()
        mock_response.candidates = [mock_candidate]
        
        client.model.generate_content = Mock(return_value=mock_response)
        
        # Pydanticのバリデーションエラーで例外が発生することを確認
        with pytest.raises(Exception):
            await client.suggest_tags("テスト動画")