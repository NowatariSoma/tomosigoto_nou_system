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

    def test_generate_schedule_pdf_success(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """PDF エクスポート作成成功テスト"""
        from io import BytesIO
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = BytesIO(b"fake pdf content")
            
            options = PDFExportOptions(**sample_pdf_export_options)
            user_id = mock_current_user.get("user_id", 1)
            result = pdf_service.generate_schedule_pdf(options, user_id)
            
            assert result.status == "completed"
            assert result.export_id is not None
            assert result.download_url is not None

    def test_generate_schedule_pdf_with_cache_hit(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """キャッシュヒット時のPDF エクスポートテスト"""
        from io import BytesIO
        with patch.object(pdf_service, '_check_existing_export') as mock_cache_check:
            mock_response = PDFExportResponse(
                export_id="cached-id",
                status="completed",
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=24),
                download_url="/api/pdf-exports/cached-id/download"
            )
            mock_cache_check.return_value = mock_response
            
            options = PDFExportOptions(**sample_pdf_export_options)
            user_id = mock_current_user.get("user_id", 1)
            result = pdf_service.generate_schedule_pdf(options, user_id)
            
            assert result.status == "completed"
            assert result.export_id == "cached-id"

    def test_generate_schedule_pdf_generation_error(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """PDF生成エラー時のテスト"""
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.side_effect = Exception("PDF生成エラー")
            
            options = PDFExportOptions(**sample_pdf_export_options)
            user_id = mock_current_user.get("user_id", 1)
            result = pdf_service.generate_schedule_pdf(options, user_id)
            
            assert result.status == "failed"
            assert "PDF生成エラー" in result.error_message

    def test_get_pdf_by_id_success(self, pdf_service):
        """IDによるPDF取得成功テスト"""
        from io import BytesIO
        with patch.object(pdf_service.cache_manager, 'get_cached_file') as mock_cache_get:
            mock_pdf_data = BytesIO(b"cached pdf content")
            mock_metadata = {"filename": "test_schedule.pdf"}
            mock_cache_get.return_value = (mock_pdf_data, mock_metadata)
            
            pdf_data, filename = pdf_service.get_pdf_by_id("test-export-123")
            
            assert pdf_data.getvalue() == b"cached pdf content"
            assert filename == "test_schedule.pdf"

    def test_get_pdf_by_id_not_found(self, pdf_service):
        """存在しないIDでのPDF取得テスト"""
        with patch.object(pdf_service.cache_manager, 'get_cached_file') as mock_cache_get:
            mock_cache_get.return_value = None
            
            try:
                pdf_service.get_pdf_by_id("nonexistent-id")
                assert False, "例外が発生するべき"
            except Exception as e:
                assert "PDFの取得に失敗しました" in str(e)

    def test_get_export_status_exists(self, pdf_service):
        """エクスポートステータス取得（存在する場合）"""
        from io import BytesIO
        with patch.object(pdf_service.cache_manager, 'get_cached_file') as mock_cache_get:
            mock_pdf_data = BytesIO(b"cached pdf content")
            mock_metadata = {
                "created_at": "2024-01-15T10:00:00",
                "expires_at": 1705321200.0,  # timestamp
                "options": {"part_id": "part-1"}
            }
            mock_cache_get.return_value = (mock_pdf_data, mock_metadata)
            
            status = pdf_service.get_export_status("test-export-123")
            
            assert status is not None
            assert status.export_id == "test-export-123"
            assert status.status == "completed"

    def test_get_export_status_not_exists(self, pdf_service):
        """エクスポートステータス取得（存在しない場合）"""
        with patch.object(pdf_service.cache_manager, 'get_cached_file') as mock_cache_get:
            mock_cache_get.return_value = None
            
            status = pdf_service.get_export_status("nonexistent-id")
            
            assert status.status == "not_found"
            assert status.export_id == "nonexistent-id"

    def test_get_available_templates(self, pdf_service):
        """利用可能テンプレート一覧取得テスト"""
        with patch.object(pdf_service.template_engine, 'list_templates') as mock_templates:
            from app.schemas.pdf_export import PDFTemplateInfo
            mock_templates.return_value = [
                PDFTemplateInfo(id="default", name="標準テンプレート", description="標準"),
                PDFTemplateInfo(id="detailed", name="詳細テンプレート", description="詳細")
            ]
            
            templates = pdf_service.get_available_templates()
            
            assert len(templates) == 2
            assert templates[0].id == "default"

    def test_get_schedule_data_mock(self, pdf_service, sample_pdf_export_options):
        """スケジュールデータ準備テスト（モックデータ）"""
        options = PDFExportOptions(**sample_pdf_export_options)
        
        schedule_data = pdf_service._get_schedule_data(options)
        
        assert isinstance(schedule_data, dict)
        assert "schedules" in schedule_data
        assert len(schedule_data["schedules"]) > 0
        # モックデータの基本構造確認
        for schedule in schedule_data["schedules"]:
            assert "date" in schedule
            assert "start_time" in schedule
            assert "end_time" in schedule

    def test_generate_cache_key(self, pdf_service, sample_pdf_export_options, mock_current_user):
        """キャッシュキー生成テスト"""
        options = PDFExportOptions(**sample_pdf_export_options)
        user_id = mock_current_user.get("user_id", 1)
        
        cache_key = pdf_service._generate_cache_key(options, user_id)
        
        assert isinstance(cache_key, str)
        assert len(cache_key) == 32  # MD5ハッシュの長さ
        
        # 同じ条件で同じキーが生成されることを確認
        cache_key2 = pdf_service._generate_cache_key(options, user_id)
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
        
        user_id = mock_current_user.get("user_id", 1)
        key1 = pdf_service._generate_cache_key(options1, user_id)
        key2 = pdf_service._generate_cache_key(options2, user_id)
        
        assert key1 != key2


    @pytest.mark.parametrize("part_filter", [1, 2, None])
    def test_generate_schedule_pdf_different_part_filters(self, pdf_service, mock_current_user, part_filter):
        """異なるパートフィルターでのPDF エクスポートテスト"""
        from io import BytesIO
        from datetime import date
        options = PDFExportOptions(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            part_id=part_filter
        )
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = BytesIO(b"fake pdf content")
            
            user_id = mock_current_user.get("user_id", 1)
            result = pdf_service.generate_schedule_pdf(options, user_id)
            
            assert result.status == "completed"

    def test_large_pdf_generation(self, pdf_service, mock_current_user):
        """大きなPDF生成テスト"""
        from io import BytesIO
        from datetime import date
        options = PDFExportOptions(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),  # 1年間
            part_id=None
        )
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            # 大きなPDFデータを模擬
            large_pdf_data = BytesIO(b"x" * (10 * 1024 * 1024))  # 10MB
            mock_generator.return_value = large_pdf_data
            
            user_id = mock_current_user.get("user_id", 1)
            result = pdf_service.generate_schedule_pdf(options, user_id)
            
            assert result.status == "completed"

    def test_concurrent_pdf_generation(self, pdf_service, mock_current_user, sample_pdf_export_options):
        """同時PDF生成テスト"""
        from io import BytesIO
        options = PDFExportOptions(**sample_pdf_export_options)
        
        with patch.object(pdf_service.pdf_generator, 'create_schedule_pdf') as mock_generator:
            mock_generator.return_value = BytesIO(b"fake pdf content")
            
            # 複数の同時生成
            results = []
            user_id = mock_current_user.get("user_id", 1)
            for i in range(3):
                result = pdf_service.generate_schedule_pdf(options, user_id)
                results.append(result)
            
            # すべて成功することを確認
            for result in results:
                assert result.status == "completed"