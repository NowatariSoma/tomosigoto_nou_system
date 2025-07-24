import uuid
import hashlib
from io import BytesIO
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta

from app.schemas.pdf_export import PDFExportOptions, PDFExportResponse, PDFTemplateInfo
from app.core.pdf_generator import PDFGenerator
from app.core.pdf_templates import TemplateEngine
from app.utils.cache_manager import CacheManager


class PDFService:
    """PDFの生成、管理、キャッシュなどビジネスロジックを実装するクラス"""
    
    def __init__(
        self,
        pdf_generator: PDFGenerator = None,
        cache_manager: CacheManager = None,
        schedule_service = None  # 今後実装される予定
    ):
        """
        PDFサービスの初期化
        
        Args:
            pdf_generator: PDF生成エンジン
            cache_manager: キャッシュマネージャー
            schedule_service: スケジュールサービス（今後実装予定）
        """
        self.template_engine = TemplateEngine()
        self.pdf_generator = pdf_generator or PDFGenerator(self.template_engine)
        self.cache_manager = cache_manager or CacheManager()
        self.schedule_service = schedule_service  # 今後実装される予定
    
    def generate_schedule_pdf(self, options: PDFExportOptions, user_id: int) -> PDFExportResponse:
        """
        スケジュールPDF生成
        
        Args:
            options: PDF出力オプション
            user_id: ユーザーID
            
        Returns:
            PDF出力レスポンス
        """
        try:
            # キャッシュキーを生成
            cache_key = self._generate_cache_key(options, user_id)
            
            # 既存の出力をチェック
            existing_export = self._check_existing_export(cache_key)
            if existing_export:
                return existing_export
            
            # スケジュールデータを取得
            schedule_data = self._get_schedule_data(options)
            
            # PDFデータを準備
            prepared_data = self._prepare_pdf_data(schedule_data, options)
            
            # PDFを生成
            pdf_content = self.pdf_generator.create_schedule_pdf(prepared_data, options)
            
            # キャッシュに保存
            export_response = self._cache_pdf(pdf_content, options, user_id, cache_key)
            
            return export_response
            
        except Exception as e:
            # エラーレスポンスを返す
            return PDFExportResponse(
                export_id=str(uuid.uuid4()),
                status="failed",
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=1),
                error_message=str(e)
            )
    
    def get_pdf_by_id(self, export_id: str) -> Tuple[BytesIO, str]:
        """
        生成済みPDFの取得
        
        Args:
            export_id: エクスポートID
            
        Returns:
            PDFファイルデータとファイル名のタプル
        """
        try:
            # キャッシュからPDFを取得
            cached_result = self.cache_manager.get_cached_file(export_id)
            
            if not cached_result:
                raise Exception("PDFファイルが見つからないか、期限切れです")
            
            pdf_data, metadata = cached_result
            filename = metadata.get('filename', f'schedule_{export_id}.pdf')
            
            return pdf_data, filename
            
        except Exception as e:
            raise Exception(f"PDFの取得に失敗しました: {str(e)}")
    
    def get_available_templates(self) -> List[PDFTemplateInfo]:
        """
        利用可能なテンプレート一覧取得
        
        Returns:
            利用可能なテンプレートのリスト
        """
        return self.template_engine.list_templates()
    
    def get_export_status(self, export_id: str) -> PDFExportResponse:
        """
        PDF出力ステータス確認
        
        Args:
            export_id: エクスポートID
            
        Returns:
            PDF出力ステータス
        """
        try:
            # キャッシュからメタデータを取得
            cached_result = self.cache_manager.get_cached_file(export_id)
            
            if not cached_result:
                return PDFExportResponse(
                    export_id=export_id,
                    status="not_found",
                    created_at=datetime.now(),
                    expires_at=datetime.now(),
                    error_message="指定されたエクスポートが見つかりません"
                )
            
            pdf_data, metadata = cached_result
            
            return PDFExportResponse(
                export_id=export_id,
                status="completed",
                created_at=datetime.fromisoformat(metadata.get('created_at', datetime.now().isoformat())),
                expires_at=datetime.fromtimestamp(metadata.get('expires_at', 0)),
                download_url=f"/api/pdf-exports/{export_id}/download"
            )
            
        except Exception as e:
            return PDFExportResponse(
                export_id=export_id,
                status="failed",
                created_at=datetime.now(),
                expires_at=datetime.now(),
                error_message=str(e)
            )
    
    def _get_schedule_data(self, options: PDFExportOptions) -> Dict:
        """
        スケジュールデータを取得（モック実装）
        
        Args:
            options: PDF出力オプション
            
        Returns:
            スケジュールデータ
        """
        # TODO: 実際のScheduleServiceが実装されたら置き換える
        # 今回はモックデータを返す
        from datetime import date, time
        
        mock_schedules = [
            {
                'date': options.start_date,
                'start_time': '09:00',
                'end_time': '12:00',
                'session_name': '朝練習',
                'description': '基礎練習とアンサンブル',
                'assigned_user': '田中先生',
                'part_id': options.part_id or 1
            },
            {
                'date': options.start_date,
                'start_time': '14:00',
                'end_time': '17:00',
                'session_name': '午後練習',
                'description': '楽曲練習',
                'assigned_user': '佐藤先生',
                'part_id': options.part_id or 2
            }
        ]
        
        return {
            'schedules': mock_schedules,
            'part_name': '全パート' if not options.part_id else f'パート{options.part_id}',
            'include_details': options.include_details
        }
    
    def _prepare_pdf_data(self, schedule_data: Dict, options: PDFExportOptions) -> Dict:
        """
        PDF生成用データ準備
        
        Args:
            schedule_data: スケジュールデータ
            options: PDF出力オプション
            
        Returns:
            PDF生成用に整形されたデータ
        """
        return {
            **schedule_data,
            'title': f"練習スケジュール ({options.start_date} - {options.end_date})",
            'start_date': options.start_date,
            'end_date': options.end_date,
            'generated_at': datetime.now(),
            'font_size': options.font_size,
            'include_details': options.include_details
        }
    
    def _cache_pdf(self, pdf_data: BytesIO, options: PDFExportOptions, user_id: int, cache_key: str) -> PDFExportResponse:
        """
        PDF保存とキャッシュ
        
        Args:
            pdf_data: PDFデータ
            options: PDF出力オプション
            user_id: ユーザーID
            cache_key: キャッシュキー
            
        Returns:
            PDF出力レスポンス
        """
        export_id = str(uuid.uuid4())
        created_at = datetime.now()
        expires_at = created_at + timedelta(hours=24)  # 24時間後に期限切れ
        
        # メタデータを準備
        metadata = {
            'export_id': export_id,
            'user_id': user_id,
            'created_at': created_at.isoformat(),
            'expires_at': expires_at.timestamp(),
            'options': options.dict(),
            'filename': f'schedule_{options.start_date}_{options.end_date}.pdf'
        }
        
        # キャッシュに保存
        self.cache_manager.cache_file(export_id, pdf_data, metadata)
        
        return PDFExportResponse(
            export_id=export_id,
            status="completed",
            created_at=created_at,
            expires_at=expires_at,
            download_url=f"/api/pdf-exports/{export_id}/download"
        )
    
    def _generate_cache_key(self, options: PDFExportOptions, user_id: int) -> str:
        """
        キャッシュキー生成
        
        Args:
            options: PDF出力オプション
            user_id: ユーザーID
            
        Returns:
            キャッシュキー
        """
        # オプションの内容からハッシュを生成
        key_data = f"{user_id}_{options.json()}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _check_existing_export(self, cache_key: str) -> Optional[PDFExportResponse]:
        """
        既存出力の確認
        
        Args:
            cache_key: キャッシュキー
            
        Returns:
            既存の出力がある場合はそのレスポンス、なければNone
        """
        try:
            cached_result = self.cache_manager.get_cached_file(cache_key)
            if not cached_result:
                return None
            
            pdf_data, metadata = cached_result
            
            return PDFExportResponse(
                export_id=metadata.get('export_id', cache_key),
                status="completed",
                created_at=datetime.fromisoformat(metadata.get('created_at', datetime.now().isoformat())),
                expires_at=datetime.fromtimestamp(metadata.get('expires_at', 0)),
                download_url=f"/api/pdf-exports/{metadata.get('export_id', cache_key)}/download"
            )
            
        except Exception:
            return None


# PDF関連の例外クラス
class PDFExportError(Exception):
    """PDF出力エラー"""
    pass


class PDFNotFoundError(Exception):
    """PDF未発見エラー"""
    pass