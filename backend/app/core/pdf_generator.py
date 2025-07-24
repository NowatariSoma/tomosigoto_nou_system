from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import letter, A4, A3, B4, B5
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from typing import Dict, List, Any
from datetime import datetime
from pathlib import Path

from app.core.pdf_templates import TemplateEngine
from app.schemas.pdf_export import PDFExportOptions


class PDFGenerator:
    """スケジュールデータを使用してPDFファイルを実際に生成するクラス"""
    
    def __init__(self, template_engine: TemplateEngine = None, config: Dict = None):
        """
        PDF生成エンジンの初期化
        
        Args:
            template_engine: テンプレートエンジン
            config: 設定辞書
        """
        self.template_engine = template_engine or TemplateEngine()
        self.config = config or {}
        
        # フォントを登録
        self._register_fonts()
        
        # スタイルシートを取得
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def create_pdf_from_template(self, template_name: str, data: Dict) -> BytesIO:
        """
        テンプレートからPDF生成
        
        Args:
            template_name: テンプレート名
            data: テンプレートに渡すデータ
            
        Returns:
            生成されたPDFのByteIOオブジェクト
        """
        try:
            # HTMLをレンダリング（今回は直接PDFを生成）
            return self._create_pdf_directly(data)
        except Exception as e:
            raise Exception(f"テンプレートからのPDF生成に失敗しました: {str(e)}")
    
    def create_schedule_pdf(self, schedule_data: Dict, options: PDFExportOptions) -> BytesIO:
        """
        スケジュール専用PDF生成
        
        Args:
            schedule_data: スケジュールデータ
            options: PDF出力オプション
            
        Returns:
            生成されたPDFのByteIOオブジェクト
        """
        try:
            # PDFデータを準備
            pdf_data = self._prepare_table_data(schedule_data)
            
            # PDFを生成
            buffer = BytesIO()
            
            # ページレイアウトを設定
            page_layout = self._create_page_layout(options)
            
            doc = SimpleDocTemplate(
                buffer,
                pagesize=page_layout['page_size'],
                rightMargin=page_layout['margin'],
                leftMargin=page_layout['margin'],
                topMargin=page_layout['margin'],
                bottomMargin=page_layout['margin']
            )
            
            # コンテンツを構築
            content = []
            
            # タイトル
            title_style = ParagraphStyle(
                'Title',
                parent=self.styles['Title'],
                fontSize=options.font_size + 4,
                alignment=TA_CENTER,
                fontName='NotoSansJP'
            )
            title = Paragraph("練習スケジュール", title_style)
            content.append(title)
            content.append(Spacer(1, 12))
            
            # 期間情報
            period_style = ParagraphStyle(
                'Period',
                parent=self.styles['Normal'],
                fontSize=options.font_size + 2,
                alignment=TA_CENTER,
                fontName='NotoSansJP'
            )
            period_text = f"{options.start_date.strftime('%Y年%m月%d日')} ～ {options.end_date.strftime('%Y年%m月%d日')}"
            if 'part_name' in schedule_data:
                period_text += f"（{schedule_data['part_name']}）"
            
            period = Paragraph(period_text, period_style)
            content.append(period)
            content.append(Spacer(1, 20))
            
            # スケジュールテーブル
            if pdf_data:
                table = Table(pdf_data)
                table_style = self._create_table_style(options)
                table.setStyle(table_style)
                content.append(table)
            else:
                no_data_style = ParagraphStyle(
                    'NoData',
                    parent=self.styles['Normal'],
                    fontSize=options.font_size,
                    alignment=TA_CENTER,
                    fontName='NotoSansJP'
                )
                no_data = Paragraph("指定された期間にスケジュールがありません", no_data_style)
                content.append(no_data)
            
            # フッター情報
            content.append(Spacer(1, 30))
            footer_style = ParagraphStyle(
                'Footer',
                parent=self.styles['Normal'],
                fontSize=options.font_size - 2,
                alignment=TA_CENTER,
                fontName='NotoSansJP',
                textColor=colors.grey
            )
            footer_text = f"生成日時: {datetime.now().strftime('%Y年%m月%d日 %H:%M')}"
            footer = Paragraph(footer_text, footer_style)
            content.append(footer)
            
            # PDFを構築
            doc.build(content)
            buffer.seek(0)
            
            return buffer
            
        except Exception as e:
            raise Exception(f"スケジュールPDFの生成に失敗しました: {str(e)}")
    
    def add_header_footer(self, pdf: BytesIO, options: Dict) -> BytesIO:
        """
        ヘッダー・フッター追加
        
        Args:
            pdf: PDFデータ
            options: オプション辞書
            
        Returns:
            ヘッダー・フッター付きPDF
        """
        # 今回はSimpleDocTemplateで直接処理するため、そのまま返す
        return pdf
    
    def apply_styling(self, pdf: BytesIO, options: Dict) -> BytesIO:
        """
        スタイル適用
        
        Args:
            pdf: PDFデータ
            options: スタイルオプション
            
        Returns:
            スタイル適用済みPDF
        """
        # 今回はテーブル生成時に直接適用するため、そのまま返す
        return pdf
    
    def _prepare_table_data(self, schedule_data: Dict) -> List[List]:
        """
        テーブルデータ準備
        
        Args:
            schedule_data: スケジュールデータ
            
        Returns:
            テーブル用データ
        """
        if not schedule_data.get('schedules'):
            return []
        
        # ヘッダー行
        headers = ['日付', '時間', 'セッション']
        if schedule_data.get('include_details', True):
            headers.extend(['詳細', '担当者'])
        
        table_data = [headers]
        
        # データ行
        for schedule in schedule_data['schedules']:
            row = [
                schedule.get('date', '').strftime('%m/%d') if hasattr(schedule.get('date'), 'strftime') else str(schedule.get('date', '')),
                f"{schedule.get('start_time', '')} - {schedule.get('end_time', '')}",
                schedule.get('session_name', '')
            ]
            
            if schedule_data.get('include_details', True):
                row.extend([
                    schedule.get('description', '') or '',
                    schedule.get('assigned_user', '') or ''
                ])
            
            table_data.append(row)
        
        return table_data
    
    def _create_page_layout(self, options: PDFExportOptions) -> Dict:
        """
        ページレイアウト設定
        
        Args:
            options: PDF出力オプション
            
        Returns:
            レイアウト設定辞書
        """
        # 用紙サイズを決定
        size_map = {
            'A4': A4,
            'A3': A3,
            'B4': B4,
            'B5': B5,
            'Letter': letter
        }
        
        page_size = size_map.get(options.paper_size, A4)
        
        # 向きを調整
        if options.orientation == 'landscape':
            page_size = (page_size[1], page_size[0])  # 幅と高さを入れ替え
        
        return {
            'page_size': page_size,
            'margin': 0.75 * inch,
            'orientation': options.orientation
        }
    
    def _register_fonts(self) -> None:
        """フォント登録"""
        try:
            # システムにあるフォントを試す（実際の実装では適切なフォントパスを指定）
            # 今回はデフォルトフォントを使用
            pass
        except Exception:
            # フォント登録に失敗した場合はデフォルトを使用
            pass
    
    def _create_table_style(self, options: PDFExportOptions) -> List:
        """
        テーブルスタイル定義
        
        Args:
            options: PDF出力オプション
            
        Returns:
            テーブルスタイルリスト
        """
        return TableStyle([
            # 全体の設定
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), options.font_size + 1),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # データ行の設定
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), options.font_size),
            ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
            
            # 罫線
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            
            # 行の高さ調整
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ])
    
    def _setup_custom_styles(self):
        """カスタムスタイルの設定"""
        # 日本語フォント用のスタイルを追加
        self.styles.add(ParagraphStyle(
            name='Japanese',
            parent=self.styles['Normal'],
            fontName='NotoSansJP',
            fontSize=10,
            leading=12,
        ))
    
    def _create_pdf_directly(self, data: Dict) -> BytesIO:
        """
        直接PDF生成（テンプレートを使わない場合）
        
        Args:
            data: PDFに含めるデータ
            
        Returns:
            生成されたPDF
        """
        buffer = BytesIO()
        
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        content = []
        
        # タイトル
        title = Paragraph(data.get('title', 'Document'), self.styles['Title'])
        content.append(title)
        content.append(Spacer(1, 12))
        
        # 内容
        if 'content' in data:
            content_p = Paragraph(data['content'], self.styles['Normal'])
            content.append(content_p)
        
        doc.build(content)
        buffer.seek(0)
        
        return buffer