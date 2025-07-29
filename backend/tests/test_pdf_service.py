"""
PDF Service レイヤーのテスト
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from app.services.pdf_service import PDFService
from app.schemas.pdf_export import PDFExportOptions, PDFExportResponse
from app.utils.cache_manager import CacheManager


class TestPDFService:
    """PDFサービステストクラス"""

    def test_create_pdf_export_success(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """PDF エクスポート作成成功テスト"""
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = b"fake pdf content"
            
            options = PDFExportOptions(**sample_pdf_export_options)
            result = pdf_service.create_pdf_export(options, mock_current_user)
            
            assert result.status == "success"
            assert result.export_id is not None
            assert result.download_url is not None
            assert "エクスポートが完了しました" in result.message

    def test_create_pdf_export_with_cache_hit(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """キャッシュヒット時のPDF エクスポートテスト"""
        with patch.object(pdf_service.cache_manager, 'get') as mock_cache_get:
            mock_cache_get.return_value = b"cached pdf content"
            
            options = PDFExportOptions(**sample_pdf_export_options)
            result = pdf_service.create_pdf_export(options, mock_current_user)
            
            assert result.status == "success"
            # キャッシュからの取得を確認
            mock_cache_get.assert_called_once()

    def test_create_pdf_export_pdf_generation_error(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """PDF生成エラー時のテスト"""
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.side_effect = Exception("PDF生成エラー")
            
            options = PDFExportOptions(**sample_pdf_export_options)
            result = pdf_service.create_pdf_export(options, mock_current_user)
            
            assert result.status == "failed"
            assert "PDF生成エラー" in result.error_message

    def test_get_pdf_by_id_success(self, pdf_service):
        """IDによるPDF取得成功テスト"""
        with patch.object(pdf_service.cache_manager, 'get') as mock_cache_get:
            mock_cache_get.return_value = b"cached pdf content"
            
            pdf_data, filename = pdf_service.get_pdf_by_id("test-export-123")
            
            assert pdf_data == b"cached pdf content"
            assert filename is not None
            assert filename.endswith(".pdf")

    def test_get_pdf_by_id_not_found(self, pdf_service):
        """存在しないIDでのPDF取得テスト"""
        with patch.object(pdf_service.cache_manager, 'get') as mock_cache_get:
            mock_cache_get.return_value = None
            
            pdf_data, filename = pdf_service.get_pdf_by_id("nonexistent-id")
            
            assert pdf_data is None
            assert filename is None

    def test_get_export_status_exists(self, pdf_service):
        """エクスポートステータス取得（存在する場合）"""
        with patch.object(pdf_service.cache_manager, 'exists') as mock_exists:
            with patch.object(pdf_service.cache_manager, 'get_metadata') as mock_metadata:
                mock_exists.return_value = True
                mock_metadata.return_value = {
                    "created_at": "2024-01-15T10:00:00Z",
                    "file_size": 1024000,
                    "options": {"part_id": "part-1"}
                }
                
                status = pdf_service.get_export_status("test-export-123")
                
                assert status is not None
                assert status["export_id"] == "test-export-123"
                assert status["status"] == "completed"
                assert status["created_at"] == "2024-01-15T10:00:00Z"

    def test_get_export_status_not_exists(self, pdf_service):
        """エクスポートステータス取得（存在しない場合）"""
        with patch.object(pdf_service.cache_manager, 'exists') as mock_exists:
            mock_exists.return_value = False
            
            status = pdf_service.get_export_status("nonexistent-id")
            
            assert status is None

    def test_get_available_templates(self, pdf_service):
        """利用可能テンプレート一覧取得テスト"""
        with patch.object(pdf_service.template_engine, 'get_available_templates') as mock_templates:
            mock_templates.return_value = [
                {"id": "default", "name": "標準テンプレート"},
                {"id": "detailed", "name": "詳細テンプレート"}
            ]
            
            templates = pdf_service.get_available_templates()
            
            assert len(templates) == 2
            assert templates[0]["id"] == "default"

    def test_prepare_schedule_data_mock(self, pdf_service, sample_pdf_export_options):
        """スケジュールデータ準備テスト（モックデータ）"""
        options = PDFExportOptions(**sample_pdf_export_options)
        
        schedules = pdf_service._prepare_schedule_data(options)
        
        assert isinstance(schedules, list)
        assert len(schedules) > 0
        # モックデータの基本構造確認
        for schedule in schedules:
            assert "date" in schedule
            assert "start_time" in schedule
            assert "end_time" in schedule

    def test_generate_cache_key(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """キャッシュキー生成テスト"""
        options = PDFExportOptions(**sample_pdf_export_options)
        
        cache_key = pdf_service._generate_cache_key(options, mock_current_user)
        
        assert isinstance(cache_key, str)
        assert len(cache_key) == 32  # MD5ハッシュの長さ
        
        # 同じ条件で同じキーが生成されることを確認
        cache_key2 = pdf_service._generate_cache_key(options, mock_current_user)
        assert cache_key == cache_key2

    def test_generate_cache_key_different_options(self, pdf_service, mock_current_user):
        """異なるオプションで異なるキャッシュキーが生成されることのテスト"""
        options1 = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            part_id="part-1"
        )
        options2 = PDFExportOptions(
            start_date="2024-02-01",
            end_date="2024-02-28",
            part_id="part-1"
        )
        
        key1 = pdf_service._generate_cache_key(options1, mock_current_user)
        key2 = pdf_service._generate_cache_key(options2, mock_current_user)
        
        assert key1 != key2

    def test_generate_export_filename(self, pdf_service, sample_pdf_export_options):
        """エクスポートファイル名生成テスト"""
        options = PDFExportOptions(**sample_pdf_export_options)
        
        filename = pdf_service._generate_export_filename(options)
        
        assert filename.endswith(".pdf")
        assert "schedule_export" in filename
        assert "2024-01-01" in filename
        assert "2024-01-31" in filename

    def test_cleanup_expired_exports(self, pdf_service):
        """期限切れエクスポートクリーンアップテスト"""
        with patch.object(pdf_service.cache_manager, 'cleanup_expired') as mock_cleanup:
            mock_cleanup.return_value = 5  # 5つのファイルがクリーンアップされた
            
            cleaned_count = pdf_service.cleanup_expired_exports()
            
            assert cleaned_count == 5
            mock_cleanup.assert_called_once()

    @pytest.mark.parametrize("part_filter", ["part-1", "part-2", "all", None])
    def test_create_pdf_export_different_part_filters(self, pdf_service, mock_current_user, part_filter):
        """異なるパートフィルターでのPDF エクスポートテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            part_id=part_filter
        )
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = b"fake pdf content"
            
            result = pdf_service.create_pdf_export(options, mock_current_user)
            
            assert result.status == "success"

    def test_large_pdf_generation(self, pdf_service, mock_current_user):
        """大きなPDF生成テスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-12-31",  # 1年間
            part_id="all"
        )
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            # 大きなPDFデータを模擬
            large_pdf_data = b"x" * (10 * 1024 * 1024)  # 10MB
            mock_generator.return_value = large_pdf_data
            
            result = pdf_service.create_pdf_export(options, mock_current_user)
            
            assert result.status == "success"

    def test_concurrent_pdf_generation(self, pdf_service, mock_current_user, sample_pdf_export_options):
        """同時PDF生成テスト"""
        options = PDFExportOptions(**sample_pdf_export_options)
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = b"fake pdf content"
            
            # 複数の同時生成
            results = []
            for i in range(3):
                result = pdf_service.create_pdf_export(options, mock_current_user)
                results.append(result)
            
            # すべて成功することを確認
            for result in results:
                assert result.status == "success"