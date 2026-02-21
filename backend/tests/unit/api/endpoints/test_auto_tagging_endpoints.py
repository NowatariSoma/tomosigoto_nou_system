import pytest
from unittest.mock import Mock, AsyncMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.materials_youtube import TagSuggestionResponse, VideoTagResponse, TagResponse

client = TestClient(app)

class TestAutoTaggingEndpoints:
    """自動タグ生成エンドポイントのテストクラス"""
    
    @pytest.fixture
    def sample_video_id(self):
        """テスト用の動画ID"""
        return uuid4()
    
    @pytest.fixture
    def sample_tag_suggestions(self):
        """テスト用のタグ提案データ"""
        return [
            TagSuggestionResponse(category="回生", tag="1回生", confidence=0.9),
            TagSuggestionResponse(category="演目", tag="弓八幡", confidence=0.8)
        ]
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_suggest_tags_success(self, mock_service_class, sample_tag_suggestions):
        """タグ提案エンドポイントの正常系テスト"""
        # AutoTaggingServiceのモック
        mock_service = Mock()
        mock_service.suggest_tags_for_video = AsyncMock(return_value=sample_tag_suggestions)
        mock_service_class.return_value = mock_service
        
        # テストデータ
        request_data = {
            "video_title": "1回生 弓八幡 稽古",
            "video_description": "能楽の稽古動画"
        }
        
        # APIコール
        response = client.post("/api/materials/suggest-tags", json=request_data)
        
        # レスポンス検証
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["category"] == "回生"
        assert data[0]["tag"] == "1回生"
        assert data[0]["confidence"] == 0.9
        assert data[1]["category"] == "演目"
        assert data[1]["tag"] == "弓八幡"
        assert data[1]["confidence"] == 0.8
        
        # サービスメソッドが正しく呼ばれたことを確認
        mock_service.suggest_tags_for_video.assert_called_once_with(
            "1回生 弓八幡 稽古", 
            "能楽の稽古動画"
        )
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_suggest_tags_service_error(self, mock_service_class):
        """タグ提案エンドポイントのエラー系テスト"""
        # AutoTaggingServiceがエラーを投げるモック
        mock_service = Mock()
        mock_service.suggest_tags_for_video = AsyncMock(side_effect=Exception("Gemini API Error"))
        mock_service_class.return_value = mock_service
        
        # テストデータ
        request_data = {
            "video_title": "テスト動画"
        }
        
        # APIコール
        response = client.post("/api/materials/suggest-tags", json=request_data)
        
        # エラーレスポンス検証
        assert response.status_code == 500
        assert "タグ提案に失敗しました" in response.json()["detail"]
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_apply_auto_tags_success(self, mock_service_class, sample_video_id):
        """自動タグ適用エンドポイントの正常系テスト"""
        tag_id = uuid4()
        video_tag_response = VideoTagResponse(
            id=uuid4(),
            video_id=sample_video_id,
            tag_id=tag_id,
            confidence=0.9,
            auto_generated=True,
            tag=TagResponse(
                id=tag_id,
                category_id=uuid4(),
                name="1回生",
                description="1年生が舞う動画"
            )
        )
        
        # AutoTaggingServiceのモック
        mock_service = Mock()
        mock_service.apply_auto_tags = AsyncMock(return_value=[video_tag_response])
        mock_service_class.return_value = mock_service
        
        # APIコール
        response = client.post(f"/api/materials/videos/{sample_video_id}/auto-tag")
        
        # レスポンス検証
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["video_id"] == str(sample_video_id)
        assert data[0]["confidence"] == 0.9
        assert data[0]["auto_generated"] is True
        
        # サービスメソッドが正しく呼ばれたことを確認
        mock_service.apply_auto_tags.assert_called_once_with(sample_video_id, False)
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_apply_auto_tags_video_not_found(self, mock_service_class, sample_video_id):
        """存在しない動画IDでの自動タグ適用テスト"""
        # AutoTaggingServiceがValueErrorを投げるモック
        mock_service = Mock()
        mock_service.apply_auto_tags = AsyncMock(side_effect=ValueError(f"Video not found: {sample_video_id}"))
        mock_service_class.return_value = mock_service
        
        # APIコール
        response = client.post(f"/api/materials/videos/{sample_video_id}/auto-tag")
        
        # エラーレスポンス検証
        assert response.status_code == 404
        assert f"Video not found: {sample_video_id}" in response.json()["detail"]
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_get_video_tags_success(self, mock_service_class, sample_video_id):
        """動画タグ取得エンドポイントの正常系テスト"""
        tag_id = uuid4()
        video_tag_response = VideoTagResponse(
            id=uuid4(),
            video_id=sample_video_id,
            tag_id=tag_id,
            confidence=0.9,
            auto_generated=True,
            tag=TagResponse(
                id=tag_id,
                category_id=uuid4(),
                name="1回生",
                description="1年生が舞う動画"
            )
        )
        
        # AutoTaggingServiceのモック
        mock_service = Mock()
        mock_service.get_video_tags = AsyncMock(return_value=[video_tag_response])
        mock_service_class.return_value = mock_service
        
        # APIコール
        response = client.get(f"/api/materials/videos/{sample_video_id}/tags")
        
        # レスポンス検証
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["video_id"] == str(sample_video_id)
        assert data[0]["tag"]["name"] == "1回生"
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_get_all_tags_success(self, mock_service_class):
        """全タグ取得エンドポイントの正常系テスト"""
        tags_by_category = {
            "回生": [
                TagResponse(
                    id=uuid4(),
                    category_id=uuid4(),
                    name="1回生",
                    description="1年生が舞う動画"
                )
            ],
            "演目": [
                TagResponse(
                    id=uuid4(),
                    category_id=uuid4(),
                    name="弓八幡",
                    description="弓八幡の演目"
                )
            ]
        }
        
        # AutoTaggingServiceのモック
        mock_service = Mock()
        mock_service.get_all_tags = AsyncMock(return_value=tags_by_category)
        mock_service_class.return_value = mock_service
        
        # APIコール
        response = client.get("/api/materials/tags")
        
        # レスポンス検証
        assert response.status_code == 200
        data = response.json()
        assert "回生" in data
        assert "演目" in data
        assert len(data["回生"]) == 1
        assert data["回生"][0]["name"] == "1回生"
        assert data["演目"][0]["name"] == "弓八幡"
    
    @patch('app.api.endpoints.materials_youtube.AutoTaggingService')
    def test_search_videos_by_tags_success(self, mock_service_class):
        """タグ検索エンドポイントの正常系テスト"""
        video_id = uuid4()
        search_result = [
            {
                "id": str(video_id),
                "title": "1回生 弓八幡 稽古",
                "matched_tags": ["1回生", "弓八幡"]
            }
        ]
        
        # AutoTaggingServiceのモック
        mock_service = Mock()
        mock_service.search_videos_by_tags = AsyncMock(return_value=search_result)
        mock_service_class.return_value = mock_service
        
        # APIコール
        response = client.get("/api/materials/search/by-tags?tags=1回生&tags=弓八幡")
        
        # レスポンス検証
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(video_id)
        assert "1回生" in data[0]["matched_tags"]
        assert "弓八幡" in data[0]["matched_tags"]
        
        # サービスメソッドが正しく呼ばれたことを確認
        mock_service.search_videos_by_tags.assert_called_once_with(["1回生", "弓八幡"])
    
    def test_suggest_tags_invalid_request(self):
        """不正なリクエストでのタグ提案テスト"""
        # video_titleが空の場合
        request_data = {
            "video_title": "",
            "video_description": "テスト説明"
        }
        
        response = client.post("/api/materials/suggest-tags", json=request_data)
        
        # バリデーションエラーが返されることを確認
        assert response.status_code == 422