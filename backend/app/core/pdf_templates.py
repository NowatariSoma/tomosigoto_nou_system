from jinja2 import Environment, FileSystemLoader, Template
from typing import Dict, List
from pathlib import Path
from app.schemas.pdf_export import PDFTemplateInfo


class TemplateEngine:
    """PDF生成に使用するテンプレートエンジンとテンプレート管理"""
    
    def __init__(self, template_dir: str = None):
        """
        テンプレートエンジンの初期化
        
        Args:
            template_dir: テンプレートディレクトリのパス
        """
        self.template_dir = Path(template_dir or "app/static/templates/pdf")
        
        # テンプレートディレクトリを作成
        self.template_dir.mkdir(parents=True, exist_ok=True)
        
        # Jinja2環境を初期化
        self.env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=True
        )
        
        # カスタムフィルターを追加
        self._add_custom_filters()
        
        # デフォルトテンプレートを作成
        self._create_default_templates()
    
    def render_template(self, template_name: str, context: Dict) -> str:
        """
        テンプレートレンダリング
        
        Args:
            template_name: テンプレート名
            context: テンプレートに渡すコンテキスト
            
        Returns:
            レンダリングされたHTML文字列
        """
        try:
            template = self.get_template(template_name)
            return template.render(context)
        except Exception as e:
            raise Exception(f"テンプレートのレンダリングに失敗しました: {str(e)}")
    
    def get_template(self, template_name: str) -> Template:
        """
        テンプレート取得
        
        Args:
            template_name: テンプレート名
            
        Returns:
            Jinja2テンプレートオブジェクト
        """
        try:
            return self.env.get_template(template_name)
        except Exception as e:
            raise Exception(f"テンプレート '{template_name}' が見つかりません: {str(e)}")
    
    def list_templates(self) -> List[PDFTemplateInfo]:
        """
        利用可能テンプレート一覧
        
        Returns:
            利用可能なテンプレートのリスト
        """
        templates = []
        
        try:
            for template_file in self.template_dir.glob("*.html"):
                template_id = template_file.stem
                metadata = self._get_template_metadata(template_id)
                
                template_info = PDFTemplateInfo(
                    id=template_id,
                    name=metadata.get('name', template_id),
                    description=metadata.get('description', ''),
                    preview_url=metadata.get('preview_url'),
                    supported_options=metadata.get('supported_options', {})
                )
                templates.append(template_info)
        except Exception:
            # デフォルトテンプレートのみを返す
            templates = [
                PDFTemplateInfo(
                    id="default",
                    name="デフォルトテンプレート",
                    description="標準的なスケジュール表示テンプレート",
                    supported_options={
                        "paper_size": ["A4", "A3", "B4"],
                        "orientation": ["portrait", "landscape"],
                        "font_size": {"min": 8, "max": 14}
                    }
                )
            ]
        
        return templates
    
    def _load_template(self, template_path: str) -> Template:
        """テンプレート読み込み"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            return self.env.from_string(template_content)
        except Exception as e:
            raise Exception(f"テンプレートファイルの読み込みに失敗しました: {str(e)}")
    
    def _get_template_metadata(self, template_name: str) -> Dict:
        """テンプレートメタデータ取得"""
        metadata_file = self.template_dir / f"{template_name}.json"
        
        if metadata_file.exists():
            try:
                import json
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        
        # デフォルトメタデータを返す
        return {
            "name": template_name.capitalize(),
            "description": f"{template_name} テンプレート",
            "supported_options": {
                "paper_size": ["A4", "A3", "B4"],
                "orientation": ["portrait", "landscape"],
                "font_size": {"min": 8, "max": 14}
            }
        }
    
    def _add_custom_filters(self):
        """カスタムフィルターを追加"""
        
        def format_date(date_value):
            """日付フォーマットフィルター"""
            if hasattr(date_value, 'strftime'):
                return date_value.strftime('%Y年%m月%d日')
            return str(date_value)
        
        def format_time(time_value):
            """時刻フォーマットフィルター"""
            if hasattr(time_value, 'strftime'):
                return time_value.strftime('%H:%M')
            return str(time_value)
        
        self.env.filters['format_date'] = format_date
        self.env.filters['format_time'] = format_time
    
    def _create_default_templates(self):
        """デフォルトテンプレートを作成"""
        default_template_path = self.template_dir / "default.html"
        
        if not default_template_path.exists():
            default_template_content = """
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        body {
            font-family: "Noto Sans JP", Arial, sans-serif;
            font-size: {{ font_size }}px;
            margin: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .period {
            text-align: center;
            margin-bottom: 20px;
            font-size: {{ font_size + 2 }}px;
            font-weight: bold;
        }
        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .schedule-table th,
        .schedule-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
        }
        .schedule-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .part-{{ part_id }} {
            background-color: #e6f3ff;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: {{ font_size - 2 }}px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ title }}</h1>
    </div>
    
    <div class="period">
        {{ start_date|format_date }} ～ {{ end_date|format_date }}
        {% if part_name %}（{{ part_name }}）{% endif %}
    </div>
    
    <table class="schedule-table">
        <thead>
            <tr>
                <th>日付</th>
                <th>時間</th>
                <th>セッション</th>
                {% if include_details %}
                <th>詳細</th>
                <th>担当者</th>
                {% endif %}
            </tr>
        </thead>
        <tbody>
            {% for schedule in schedules %}
            <tr class="part-{{ schedule.part_id }}">
                <td>{{ schedule.date|format_date }}</td>
                <td>{{ schedule.start_time|format_time }} - {{ schedule.end_time|format_time }}</td>
                <td>{{ schedule.session_name }}</td>
                {% if include_details %}
                <td>{{ schedule.description or '' }}</td>
                <td>{{ schedule.assigned_user or '' }}</td>
                {% endif %}
            </tr>
            {% endfor %}
        </tbody>
    </table>
    
    <div class="footer">
        <p>生成日時: {{ generated_at|format_date }}</p>
    </div>
</body>
</html>
            """.strip()
            
            with open(default_template_path, 'w', encoding='utf-8') as f:
                f.write(default_template_content)
            
            # メタデータファイルも作成
            metadata = {
                "name": "デフォルトテンプレート",
                "description": "標準的なスケジュール表示テンプレート",
                "supported_options": {
                    "paper_size": ["A4", "A3", "B4"],
                    "orientation": ["portrait", "landscape"],
                    "font_size": {"min": 8, "max": 14}
                }
            }
            
            import json
            with open(self.template_dir / "default.json", 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)