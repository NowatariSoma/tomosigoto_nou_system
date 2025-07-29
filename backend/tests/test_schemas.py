"""
Pydantic Schemas のテスト
"""
import pytest
from datetime import datetime
from pydantic import ValidationError
from app.schemas.pdf_export import (
    PDFExportOptions, 
    PDFExportResponse, 
    PDFTemplateInfo
)


class TestPDFExportOptions:
    """PDFエクスポートオプションスキーマテストクラス"""

    def test_valid_pdf_export_options(self):
        """有効なPDFエクスポートオプションテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            part_id="part-1",
            format="detailed",
            paper_size="A4",
            orientation="portrait",
            font_size=10,
            include_details=True
        )
        
        assert options.start_date == "2024-01-01"
        assert options.end_date == "2024-01-31"
        assert options.part_id == "part-1"
        assert options.format == "detailed"
        assert options.paper_size == "A4"
        assert options.orientation == "portrait"
        assert options.font_size == 10
        assert options.include_details is True

    def test_pdf_export_options_with_defaults(self):
        """デフォルト値を使用したPDFエクスポートオプションテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        # デフォルト値の確認
        assert options.part_id is None
        assert options.format == "standard"
        assert options.paper_size == "A4"
        assert options.orientation == "portrait"
        assert options.font_size == 10
        assert options.include_details is False

    def test_invalid_date_format(self):
        """無効な日付形式テスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="invalid-date",
                end_date="2024-01-31"
            )

    def test_invalid_date_range(self):
        """無効な日付範囲テスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-31",
                end_date="2024-01-01"  # 開始日より前の終了日
            )

    @pytest.mark.parametrize("invalid_paper_size", [
        "INVALID", "a4", "Letter", "CUSTOM"
    ])
    def test_invalid_paper_size(self, invalid_paper_size):
        """無効な用紙サイズテスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-01",
                end_date="2024-01-31",
                paper_size=invalid_paper_size
            )

    @pytest.mark.parametrize("valid_paper_size", [
        "A4", "A3", "B4", "B5", "letter"
    ])
    def test_valid_paper_sizes(self, valid_paper_size):
        """有効な用紙サイズテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            paper_size=valid_paper_size
        )
        assert options.paper_size == valid_paper_size

    @pytest.mark.parametrize("invalid_orientation", [
        "vertical", "horizontal", "PORTRAIT", "LANDSCAPE"
    ])
    def test_invalid_orientation(self, invalid_orientation):
        """無効な向きテスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-01",
                end_date="2024-01-31",
                orientation=invalid_orientation
            )

    @pytest.mark.parametrize("valid_orientation", ["portrait", "landscape"])
    def test_valid_orientations(self, valid_orientation):
        """有効な向きテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            orientation=valid_orientation
        )
        assert options.orientation == valid_orientation

    @pytest.mark.parametrize("invalid_font_size", [7, 15, 0, -1, 100])
    def test_invalid_font_size(self, invalid_font_size):
        """無効なフォントサイズテスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-01",
                end_date="2024-01-31",
                font_size=invalid_font_size
            )

    @pytest.mark.parametrize("valid_font_size", [8, 10, 12, 14])
    def test_valid_font_sizes(self, valid_font_size):
        """有効なフォントサイズテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            font_size=valid_font_size
        )
        assert options.font_size == valid_font_size

    @pytest.mark.parametrize("invalid_format", [
        "DETAILED", "simple", "complex", "full"
    ])
    def test_invalid_format(self, invalid_format):
        """無効なフォーマットテスト"""
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-01",
                end_date="2024-01-31",
                format=invalid_format
            )

    @pytest.mark.parametrize("valid_format", ["standard", "detailed", "summary"])
    def test_valid_formats(self, valid_format):
        """有効なフォーマットテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            format=valid_format
        )
        assert options.format == valid_format

    def test_empty_part_id(self):
        """空のパートIDテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            part_id=""
        )
        assert options.part_id == ""

    def test_long_part_id(self):
        """長いパートIDテスト"""
        long_part_id = "a" * 256
        with pytest.raises(ValidationError):
            PDFExportOptions(
                start_date="2024-01-01",
                end_date="2024-01-31",
                part_id=long_part_id
            )

    def test_json_serialization(self):
        """JSON シリアライゼーションテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            part_id="part-1",
            include_details=True
        )
        
        json_data = options.model_dump()
        
        assert json_data["start_date"] == "2024-01-01"
        assert json_data["end_date"] == "2024-01-31"
        assert json_data["part_id"] == "part-1"
        assert json_data["include_details"] is True

    def test_model_validation_from_dict(self):
        """辞書からのモデル検証テスト"""
        data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "paper_size": "A4",
            "orientation": "portrait"
        }
        
        options = PDFExportOptions(**data)
        
        assert options.start_date == "2024-01-01"
        assert options.end_date == "2024-01-31"


class TestPDFExportResponse:
    """PDFエクスポートレスポンススキーマテストクラス"""

    def test_successful_pdf_export_response(self):
        """成功時のPDFエクスポートレスポンステスト"""
        response = PDFExportResponse(
            status="success",
            export_id="test-export-123",
            download_url="/pdf-exports/test-export-123/download",
            message="PDFエクスポートが完了しました"
        )
        
        assert response.status == "success"
        assert response.export_id == "test-export-123"
        assert response.download_url == "/pdf-exports/test-export-123/download"
        assert response.message == "PDFエクスポートが完了しました"
        assert response.error_message is None

    def test_failed_pdf_export_response(self):
        """失敗時のPDFエクスポートレスポンステスト"""
        response = PDFExportResponse(
            status="failed",
            error_message="PDF生成に失敗しました"
        )
        
        assert response.status == "failed"
        assert response.error_message == "PDF生成に失敗しました"
        assert response.export_id is None
        assert response.download_url is None
        assert response.message is None

    @pytest.mark.parametrize("invalid_status", [
        "SUCCESS", "FAILED", "pending", "completed", "error"
    ])
    def test_invalid_status(self, invalid_status):
        """無効なステータステスト"""
        with pytest.raises(ValidationError):
            PDFExportResponse(
                status=invalid_status
            )

    @pytest.mark.parametrize("valid_status", ["success", "failed", "processing"])
    def test_valid_statuses(self, valid_status):
        """有効なステータステスト"""
        response = PDFExportResponse(status=valid_status)
        assert response.status == valid_status

    def test_export_id_validation(self):
        """エクスポートID検証テスト"""
        # 正常なエクスポートID
        response = PDFExportResponse(
            status="success",
            export_id="valid-export-123"
        )
        assert response.export_id == "valid-export-123"

    def test_long_export_id(self):
        """長いエクスポートIDテスト"""
        long_id = "a" * 256
        with pytest.raises(ValidationError):
            PDFExportResponse(
                status="success",
                export_id=long_id
            )

    def test_empty_export_id(self):
        """空のエクスポートIDテスト"""
        with pytest.raises(ValidationError):
            PDFExportResponse(
                status="success",
                export_id=""
            )

    def test_url_validation(self):
        """URL検証テスト"""
        valid_urls = [
            "/pdf-exports/123/download",
            "/api/v1/pdf-exports/export-456/download",
            "https://example.com/pdf/download"
        ]
        
        for url in valid_urls:
            response = PDFExportResponse(
                status="success",
                export_id="test-123",
                download_url=url
            )
            assert response.download_url == url

    def test_json_serialization_success(self):
        """成功レスポンスのJSON シリアライゼーションテスト"""
        response = PDFExportResponse(
            status="success",
            export_id="test-export-123",
            download_url="/pdf-exports/test-export-123/download",
            message="完了しました"
        )
        
        json_data = response.model_dump()
        
        assert json_data["status"] == "success"
        assert json_data["export_id"] == "test-export-123"
        assert json_data["download_url"] == "/pdf-exports/test-export-123/download"
        assert json_data["message"] == "完了しました"
        assert json_data["error_message"] is None

    def test_json_serialization_failed(self):
        """失敗レスポンスのJSON シリアライゼーションテスト"""
        response = PDFExportResponse(
            status="failed",
            error_message="エラーが発生しました"
        )
        
        json_data = response.model_dump()
        
        assert json_data["status"] == "failed"
        assert json_data["error_message"] == "エラーが発生しました"
        assert json_data["export_id"] is None
        assert json_data["download_url"] is None
        assert json_data["message"] is None


class TestPDFTemplateInfo:
    """PDFテンプレート情報スキーマテストクラス"""

    def test_valid_template_info(self):
        """有効なテンプレート情報テスト"""
        template = PDFTemplateInfo(
            id="default",
            name="標準テンプレート",
            description="基本的なレイアウトテンプレート"
        )
        
        assert template.id == "default"
        assert template.name == "標準テンプレート"
        assert template.description == "基本的なレイアウトテンプレート"

    def test_template_info_without_description(self):
        """説明なしのテンプレート情報テスト"""
        template = PDFTemplateInfo(
            id="simple",
            name="シンプルテンプレート"
        )
        
        assert template.id == "simple"
        assert template.name == "シンプルテンプレート"
        assert template.description is None

    def test_empty_template_id(self):
        """空のテンプレートIDテスト"""
        with pytest.raises(ValidationError):
            PDFTemplateInfo(
                id="",
                name="テンプレート"
            )

    def test_empty_template_name(self):
        """空のテンプレート名テスト"""
        with pytest.raises(ValidationError):
            PDFTemplateInfo(
                id="test",
                name=""
            )

    def test_long_template_fields(self):
        """長いテンプレートフィールドテスト"""
        # 長いID
        with pytest.raises(ValidationError):
            PDFTemplateInfo(
                id="a" * 101,  # 100文字制限を超える
                name="テンプレート"
            )
        
        # 長い名前
        with pytest.raises(ValidationError):
            PDFTemplateInfo(
                id="test",
                name="a" * 201  # 200文字制限を超える
            )

    def test_special_characters_in_template_id(self):
        """テンプレートIDの特殊文字テスト"""
        # 有効な文字
        valid_ids = ["default", "template-1", "template_v2", "simple123"]
        
        for template_id in valid_ids:
            template = PDFTemplateInfo(
                id=template_id,
                name="テスト"
            )
            assert template.id == template_id

    def test_japanese_template_info(self):
        """日本語テンプレート情報テスト"""
        template = PDFTemplateInfo(
            id="japanese_template",
            name="日本語テンプレート",
            description="日本語フォントを使用した詳細なレイアウトテンプレート"
        )
        
        assert template.name == "日本語テンプレート"
        assert "日本語フォント" in template.description

    def test_json_serialization(self):
        """JSON シリアライゼーションテスト"""
        template = PDFTemplateInfo(
            id="test_template",
            name="テストテンプレート",
            description="テスト用のテンプレートです"
        )
        
        json_data = template.model_dump()
        
        assert json_data["id"] == "test_template"
        assert json_data["name"] == "テストテンプレート"
        assert json_data["description"] == "テスト用のテンプレートです"

    def test_template_list_serialization(self):
        """テンプレートリストのシリアライゼーションテスト"""
        templates = [
            PDFTemplateInfo(id="default", name="標準"),
            PDFTemplateInfo(id="detailed", name="詳細"),
            PDFTemplateInfo(id="summary", name="サマリー")
        ]
        
        json_data = [template.model_dump() for template in templates]
        
        assert len(json_data) == 3
        assert json_data[0]["id"] == "default"
        assert json_data[1]["id"] == "detailed"
        assert json_data[2]["id"] == "summary"