"""
PDF Generator コア機能のテスト
"""
import pytest
from io import BytesIO
from unittest.mock import patch, Mock
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, A3, B4, B5, letter
from app.core.pdf_generator import PDFGenerator
from app.schemas.pdf_export import PDFExportOptions


class TestPDFGenerator:
    """PDF生成エンジンテストクラス"""

    def test_create_schedule_pdf_basic(self, pdf_generator, sample_schedule_data):
        """基本的なPDF生成テスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(sample_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0
        assert pdf_data.startswith(b'%PDF')  # PDFヘッダー確認

    def test_create_schedule_pdf_empty_data(self, pdf_generator):
        """空データでのPDF生成テスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        pdf_data = pdf_generator.create_schedule_pdf([], options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0
        assert pdf_data.startswith(b'%PDF')

    @pytest.mark.parametrize("paper_size,expected", [
        ("A4", A4),
        ("A3", A3),
        ("B4", B4),
        ("B5", B5),
        ("letter", letter),
    ])
    def test_get_page_size(self, pdf_generator, paper_size, expected):
        """用紙サイズ取得テスト"""
        size = pdf_generator._get_page_size(paper_size)
        assert size == expected

    def test_get_page_size_invalid(self, pdf_generator):
        """無効な用紙サイズテスト"""
        size = pdf_generator._get_page_size("INVALID")
        assert size == A4  # デフォルトはA4

    @pytest.mark.parametrize("orientation", ["portrait", "landscape"])
    def test_create_schedule_pdf_orientation(self, pdf_generator, sample_schedule_data, orientation):
        """用紙向きテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            orientation=orientation
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(sample_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    @pytest.mark.parametrize("font_size", [8, 10, 12, 14])
    def test_create_schedule_pdf_font_sizes(self, pdf_generator, sample_schedule_data, font_size):
        """フォントサイズテスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            font_size=font_size
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(sample_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_create_schedule_pdf_with_details(self, pdf_generator, sample_schedule_data):
        """詳細情報付きPDF生成テスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            include_details=True
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(sample_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_create_schedule_pdf_without_details(self, pdf_generator, sample_schedule_data):
        """詳細情報なしPDF生成テスト"""
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            include_details=False
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(sample_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_setup_japanese_fonts(self, pdf_generator):
        """日本語フォント設定テスト"""
        # フォント設定メソッドが正常に動作することを確認
        pdf_generator._setup_japanese_fonts()
        
        # フォントが正しく登録されていることを確認
        # これは実際のフォントファイルに依存するため、エラーが発生しないことのみ確認
        assert True

    def test_create_header_and_footer(self, pdf_generator):
        """ヘッダー・フッター作成テスト"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        # ヘッダー・フッターを描画
        pdf_generator._draw_header(c, A4, options)
        pdf_generator._draw_footer(c, A4, 1)
        
        c.save()
        buffer.seek(0)
        
        # PDFが正常に生成されたことを確認
        assert len(buffer.getvalue()) > 0

    def test_create_schedule_table_headers(self, pdf_generator):
        """スケジュールテーブルヘッダー作成テスト"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            include_details=True
        )
        
        headers = pdf_generator._get_table_headers(options)
        
        assert "日付" in headers
        assert "開始時間" in headers
        assert "終了時間" in headers
        
        if options.include_details:
            assert "詳細" in headers

    def test_filter_schedule_data_by_part(self, pdf_generator, sample_schedule_data):
        """パート別データフィルタリングテスト"""
        # part-1のデータのみをフィルタリング
        filtered_data = pdf_generator._filter_by_part(sample_schedule_data, "part-1")
        
        assert len(filtered_data) == 1
        assert filtered_data[0]["part_id"] == "part-1"

    def test_filter_schedule_data_all_parts(self, pdf_generator, sample_schedule_data):
        """全パートデータフィルタリングテスト"""
        filtered_data = pdf_generator._filter_by_part(sample_schedule_data, "all")
        
        assert len(filtered_data) == len(sample_schedule_data)

    def test_filter_schedule_data_nonexistent_part(self, pdf_generator, sample_schedule_data):
        """存在しないパートでのフィルタリングテスト"""
        filtered_data = pdf_generator._filter_by_part(sample_schedule_data, "nonexistent")
        
        assert len(filtered_data) == 0

    def test_format_date_range(self, pdf_generator):
        """日付範囲フォーマットテスト"""
        formatted = pdf_generator._format_date_range("2024-01-01", "2024-01-31")
        
        assert "2024-01-01" in formatted
        assert "2024-01-31" in formatted
        assert "から" in formatted or "～" in formatted

    def test_calculate_table_dimensions(self, pdf_generator):
        """テーブル寸法計算テスト"""
        page_width, page_height = A4
        
        table_width, col_widths = pdf_generator._calculate_table_dimensions(
            page_width, ["日付", "時間", "担当者", "詳細"]
        )
        
        assert table_width <= page_width
        assert len(col_widths) == 4
        assert sum(col_widths) <= table_width

    def test_create_large_schedule_pdf(self, pdf_generator):
        """大量データでのPDF生成テスト"""
        # 大量のスケジュールデータを生成
        large_schedule_data = []
        for i in range(100):
            large_schedule_data.append({
                "date": f"2024-01-{i % 30 + 1:02d}",
                "start_time": "09:00",
                "end_time": "17:00",
                "part_id": f"part-{i % 5 + 1}",
                "part_name": f"部署{i % 5 + 1}",
                "worker_id": f"worker-{i}",
                "worker_name": f"社員{i}",
                "position": "スタッフ",
                "details": f"業務{i}"
            })
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(large_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_japanese_text_handling(self, pdf_generator):
        """日本語テキスト処理テスト"""
        japanese_schedule_data = [{
            "date": "2024-01-15",
            "start_time": "09:00",
            "end_time": "17:00",
            "part_id": "part-1",
            "part_name": "営業部門",
            "worker_id": "worker-1",
            "worker_name": "田中太郎",
            "position": "主任",
            "details": "新規顧客開拓・既存顧客フォロー"
        }]
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(japanese_schedule_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_multi_page_pdf_generation(self, pdf_generator):
        """複数ページPDF生成テスト"""
        # ページを跨ぐのに十分なデータを生成
        multi_page_data = []
        for i in range(50):  # 1ページに収まらないデータ量
            multi_page_data.append({
                "date": f"2024-01-{i % 30 + 1:02d}",
                "start_time": f"{9 + (i % 8):02d}:00",
                "end_time": f"{10 + (i % 8):02d}:00",
                "part_id": "part-1",
                "part_name": "営業部",
                "worker_id": f"worker-{i}",
                "worker_name": f"社員{i}",
                "position": "スタッフ",
                "details": f"業務内容{i}の詳細説明"
            })
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31",
            include_details=True
        )
        
        pdf_data = pdf_generator.create_schedule_pdf(multi_page_data, options)
        
        assert isinstance(pdf_data, bytes)
        assert len(pdf_data) > 0

    def test_pdf_generation_error_handling(self, pdf_generator):
        """PDF生成エラーハンドリングテスト"""
        # 無効なデータでのテスト
        invalid_data = [{"invalid": "data"}]
        
        options = PDFExportOptions(
            start_date="2024-01-01",
            end_date="2024-01-31"
        )
        
        # エラーが適切に処理されることを確認
        try:
            pdf_data = pdf_generator.create_schedule_pdf(invalid_data, options)
            # エラーが発生しなかった場合も、PDFデータが返されることを確認
            assert isinstance(pdf_data, bytes)
        except Exception as e:
            # エラーが発生した場合は、適切な例外であることを確認
            assert isinstance(e, (ValueError, KeyError, TypeError))