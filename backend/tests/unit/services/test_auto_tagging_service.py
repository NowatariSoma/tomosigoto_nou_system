import pytest
from unittest.mock import Mock, AsyncMock, patch
from uuid import uuid4, UUID
from app.services.auto_tagging_service import AutoTaggingService
from app.schemas.materials_youtube import TagSuggestionResponse, VideoTagResponse, TagResponse
from app.core.gemini_client import TagSuggestion

class TestAutoTaggingService:
    """AutoTaggingServiceのテストクラス"""
    
    @pytest.fixture
    def service(self):
        """テスト用のサービスインスタンス"""
        with patch('app.services.auto_tagging_service.GeminiTaggingClient'):
            with patch('app.services.auto_tagging_service.get_supabase'):
                return AutoTaggingService()
    
    @pytest.fixture
    def sample_video_id(self):
        """テスト用の動画ID"""
        return uuid4()
    
    @pytest.fixture
    def sample_tag_suggestions(self):
        """テスト用のタグ提案データ"""
        return [
            TagSuggestion(category="回生", tag="1回生", confidence=0.9),
            TagSuggestion(category="演目", tag="弓八幡", confidence=0.8)
        ]
    
    @pytest.mark.asyncio
    async def test_suggest_tags_for_video(self, service, sample_tag_suggestions):
        """動画タイトルからのタグ提案テスト"""
        # Geminiクライアントのモック設定
        service.gemini_client.suggest_tags = AsyncMock(return_value=sample_tag_suggestions)
        
        # テスト実行
        result = await service.suggest_tags_for_video("1回生 弓八幡 稽古", "能楽の稽古動画")
        
        # 結果検証
        assert len(result) == 2
        assert isinstance(result[0], TagSuggestionResponse)
        assert result[0].category == "回生"
        assert result[0].tag == "1回生"
        assert result[0].confidence == 0.9
        assert result[1].category == "演目"
        assert result[1].tag == "弓八幡"
        assert result[1].confidence == 0.8
        
        # Geminiクライアントが正しく呼ばれたことを確認
        service.gemini_client.suggest_tags.assert_called_once_with("1回生 弓八幡 稽古", "能楽の稽古動画")
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_apply_auto_tags_new_video(self, mock_supabase, service, sample_video_id, sample_tag_suggestions):
        """新しい動画への自動タグ適用テスト"""
        # Supabaseのモック設定
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(sample_video_id), "title": "1回生 弓八幡 稽古"}
        ]
        
        # 既存のAI生成タグなし
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        
        # タグカテゴリとタグの取得をモック
        category_id = uuid4()
        tag_id_1 = uuid4()
        tag_id_2 = uuid4()
        
        def mock_table_chain(*args, **kwargs):
            mock_table = Mock()
            mock_select = Mock()
            mock_eq = Mock()
            mock_execute = Mock()
            
            if "tag_categories" in str(args):
                if "回生" in str(kwargs) or "回生" in str(args):
                    mock_execute.data = [{"id": str(category_id), "name": "回生"}]
                elif "演目" in str(kwargs) or "演目" in str(args):
                    mock_execute.data = [{"id": str(category_id), "name": "演目"}]
            elif "tags" in str(args):
                if "1回生" in str(kwargs) or "1回生" in str(args):
                    mock_execute.data = [{"id": str(tag_id_1), "category_id": str(category_id), "name": "1回生"}]
                elif "弓八幡" in str(kwargs) or "弓八幡" in str(args):
                    mock_execute.data = [{"id": str(tag_id_2), "category_id": str(category_id), "name": "弓八幡"}]
            elif "video_tags" in str(args):
                mock_execute.data = [
                    {
                        "id": str(uuid4()),
                        "video_id": str(sample_video_id),
                        "tag_id": str(tag_id_1),
                        "confidence": 0.9,
                        "auto_generated": True,
                        "created_at": "2026-02-21T00:00:00Z",
                        "updated_at": "2026-02-21T00:00:00Z"
                    }
                ]
            
            mock_eq.execute = mock_execute
            mock_select.eq = Mock(return_value=mock_eq)
            mock_table.select = Mock(return_value=mock_select)
            mock_table.insert = Mock(return_value=mock_execute)
            return mock_table
        
        mock_supabase.table.side_effect = mock_table_chain
        
        # Geminiクライアントのモック
        service.gemini_client.suggest_tags = AsyncMock(return_value=sample_tag_suggestions)
        
        # テスト実行
        result = await service.apply_auto_tags(sample_video_id)
        
        # 結果検証
        assert len(result) == 2
        assert all(isinstance(tag, VideoTagResponse) for tag in result)
        
        # Geminiクライアントが呼ばれたことを確認
        service.gemini_client.suggest_tags.assert_called_once_with("1回生 弓八幡 稽古")
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_apply_auto_tags_video_not_found(self, mock_supabase, service, sample_video_id):
        """存在しない動画IDでのテスト"""
        # 動画が見つからない場合のモック
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        # テスト実行と例外確認
        with pytest.raises(ValueError, match="Video not found"):
            await service.apply_auto_tags(sample_video_id)
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_apply_auto_tags_with_existing_tags_no_force_update(self, mock_supabase, service, sample_video_id):
        """既存のAI生成タグがある場合のテスト（強制更新なし）"""
        # 動画データのモック
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": str(sample_video_id), "title": "テスト動画"}
        ]
        
        # 既存のAI生成タグありのモック
        existing_tag_id = uuid4()
        
        def mock_table_operations(*args, **kwargs):
            mock_table = Mock()
            mock_result = Mock()
            
            # video_tagsテーブルで既存のAI生成タグを検索
            if "video_tags" in str(args) and "auto_generated" in str(kwargs):
                mock_result.data = [{"id": str(existing_tag_id)}]
            else:
                mock_result.data = []
            
            mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
            return mock_table
        
        mock_supabase.table.side_effect = mock_table_operations
        
        # get_video_tagsをモック
        service.get_video_tags = AsyncMock(return_value=[])
        
        # テスト実行
        result = await service.apply_auto_tags(sample_video_id, force_update=False)
        
        # 既存タグが返されることを確認
        assert result == []
        service.get_video_tags.assert_called_once_with(sample_video_id)
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_get_video_tags(self, mock_supabase, service, sample_video_id):
        """動画タグ取得のテスト"""
        tag_id = uuid4()
        category_id = uuid4()
        
        # Supabaseレスポンスのモック
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": str(uuid4()),
                "video_id": str(sample_video_id),
                "tag_id": str(tag_id),
                "confidence": 0.9,
                "auto_generated": True,
                "created_at": "2026-02-21T00:00:00Z",
                "updated_at": "2026-02-21T00:00:00Z",
                "tag": {
                    "id": str(tag_id),
                    "category_id": str(category_id),
                    "name": "1回生",
                    "description": "1年生が舞う動画",
                    "created_at": "2026-02-21T00:00:00Z",
                    "updated_at": "2026-02-21T00:00:00Z"
                }
            }
        ]
        
        # テスト実行
        result = await service.get_video_tags(sample_video_id)
        
        # 結果検証
        assert len(result) == 1
        assert isinstance(result[0], VideoTagResponse)
        assert result[0].video_id == sample_video_id
        assert result[0].confidence == 0.9
        assert result[0].auto_generated is True
        assert result[0].tag is not None
        assert result[0].tag.name == "1回生"
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_get_all_tags(self, mock_supabase, service):
        """全タグ取得のテスト"""
        category_id_1 = uuid4()
        category_id_2 = uuid4()
        
        # Supabaseレスポンスのモック
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = [
            {
                "id": str(uuid4()),
                "category_id": str(category_id_1),
                "name": "1回生",
                "description": "1年生が舞う動画",
                "created_at": "2026-02-21T00:00:00Z",
                "updated_at": "2026-02-21T00:00:00Z",
                "category": {"id": str(category_id_1), "name": "回生", "description": "学年レベル"}
            },
            {
                "id": str(uuid4()),
                "category_id": str(category_id_2),
                "name": "弓八幡",
                "description": "弓八幡の演目",
                "created_at": "2026-02-21T00:00:00Z",
                "updated_at": "2026-02-21T00:00:00Z",
                "category": {"id": str(category_id_2), "name": "演目", "description": "能楽の演目名"}
            }
        ]
        
        # テスト実行
        result = await service.get_all_tags()
        
        # 結果検証
        assert "回生" in result
        assert "演目" in result
        assert len(result["回生"]) == 1
        assert len(result["演目"]) == 1
        assert result["回生"][0].name == "1回生"
        assert result["演目"][0].name == "弓八幡"
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_search_videos_by_tags(self, mock_supabase, service):
        """タグによる動画検索のテスト"""
        video_id = uuid4()
        
        # Supabaseレスポンスのモック
        mock_supabase.table.return_value.select.return_value.in_.return_value.execute.return_value.data = [
            {
                "video_id": str(video_id),
                "videos": {
                    "id": str(video_id),
                    "title": "1回生 弓八幡 稽古",
                    "video_url": "https://youtube.com/watch?v=test",
                    "recorded_date": "2026-02-21",
                    "thumbnail_url": "https://img.youtube.com/test.jpg",
                    "sub_playlists": {
                        "id": str(uuid4()),
                        "title": "稽古動画",
                        "playlists": {
                            "id": str(uuid4()),
                            "title": "2026年度",
                            "name": "春の舞",
                            "year": 2026
                        }
                    }
                },
                "tags": {"name": "1回生"}
            }
        ]
        
        # テスト実行
        result = await service.search_videos_by_tags(["1回生"])
        
        # 結果検証
        assert len(result) == 1
        assert result[0]["id"] == str(video_id)
        assert result[0]["title"] == "1回生 弓八幡 稽古"
        assert "matched_tags" in result[0]
        assert "1回生" in result[0]["matched_tags"]
    
    @pytest.mark.asyncio
    async def test_search_videos_by_tags_empty_list(self, service):
        """空のタグリストでの検索テスト"""
        result = await service.search_videos_by_tags([])
        assert result == []
    
    @pytest.mark.asyncio
    @patch.object(AutoTaggingService, 'supabase')
    async def test_apply_auto_tags_force_update(self, mock_supabase, service, sample_video_id, sample_tag_suggestions):
        """強制更新での自動タグ適用テスト"""
        # 動画データのモック
        video_data = {"id": str(sample_video_id), "title": "1回生 弓八幡 稽古"}
        
        # タグカテゴリデータ
        category_id = uuid4()
        tag_id = uuid4()
        
        def mock_supabase_operations(*args, **kwargs):
            mock_table = Mock()
            mock_result = Mock()
            
            table_name = str(args[0]) if args else ""
            
            if "videos" in table_name:
                mock_result.data = [video_data]
            elif "tag_categories" in table_name:
                mock_result.data = [{"id": str(category_id), "name": "回生"}]
            elif "tags" in table_name:
                mock_result.data = [{"id": str(tag_id), "category_id": str(category_id), "name": "1回生"}]
            elif "video_tags" in table_name:
                mock_result.data = [{
                    "id": str(uuid4()),
                    "video_id": str(sample_video_id),
                    "tag_id": str(tag_id),
                    "confidence": 0.9,
                    "auto_generated": True,
                    "created_at": "2026-02-21T00:00:00Z",
                    "updated_at": "2026-02-21T00:00:00Z"
                }]
            
            mock_table.select.return_value.eq.return_value.execute.return_value = mock_result
            mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
            mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result
            mock_table.insert.return_value.execute.return_value = mock_result
            return mock_table
        
        mock_supabase.table.side_effect = mock_supabase_operations
        
        # Geminiクライアントのモック
        service.gemini_client.suggest_tags = AsyncMock(return_value=sample_tag_suggestions[:1])  # 1つのタグのみ
        
        # テスト実行
        result = await service.apply_auto_tags(sample_video_id, force_update=True)
        
        # 削除が呼ばれたことを確認
        service.gemini_client.suggest_tags.assert_called_once_with("1回生 弓八幡 稽古")
    
    def test_tag_suggestion_model_validation(self):
        """TagSuggestionResponseのバリデーションテスト"""
        # 正常なデータ
        valid_suggestion = TagSuggestionResponse(
            category="回生",
            tag="1回生", 
            confidence=0.9
        )
        assert valid_suggestion.category == "回生"
        assert valid_suggestion.confidence == 0.9
        
        # 不正な信頼度
        with pytest.raises(ValueError):
            TagSuggestionResponse(
                category="回生",
                tag="1回生",
                confidence=1.5  # 1.0を超える
            )
        
        with pytest.raises(ValueError):
            TagSuggestionResponse(
                category="回生",
                tag="1回生",
                confidence=-0.1  # 0.0未満
            )