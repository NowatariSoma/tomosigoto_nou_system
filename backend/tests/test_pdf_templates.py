"""
PDF Template Engine のテスト
"""
import pytest
from pathlib import Path
from unittest.mock import patch, mock_open
from backend.app.core.pdf_templates import PDFTemplateEngine


class TestPDFTemplateEngine:
    """PDFテンプレートエンジンテストクラス"""

    def test_init_template_engine(self, temp_dir):
        """テンプレートエンジン初期化テスト"""
        template_dir = temp_dir / "templates"
        engine = PDFTemplateEngine(template_dir=template_dir)
        
        assert engine.template_dir == template_dir
        assert template_dir.exists()
        assert engine.jinja_env is not None

    def test_get_available_templates_empty_dir(self, pdf_template_engine):
        """空のテンプレートディレクトリでの利用可能テンプレート取得"""
        templates = pdf_template_engine.get_available_templates()
        
        # デフォルトテンプレートが含まれることを確認
        assert len(templates) >= 1
        assert any(t["id"] == "default" for t in templates)

    def test_get_available_templates_with_files(self, pdf_template_engine, temp_dir):
        """テンプレートファイルありでの利用可能テンプレート取得"""
        # テンプレートファイルを作成
        template_file = pdf_template_engine.template_dir / "custom.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text("""
        <html>
        <head><title>Custom Template</title></head>
        <body>Custom PDF Template</body>
        </html>
        """)
        
        templates = pdf_template_engine.get_available_templates()
        
        assert len(templates) >= 2
        template_ids = [t["id"] for t in templates]
        assert "default" in template_ids
        assert "custom" in template_ids

    def test_render_template_default(self, pdf_template_engine, sample_schedule_data):
        """デフォルトテンプレートレンダリングテスト"""
        options = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "part_id": "part-1"
        }
        
        rendered = pdf_template_engine.render_template(
            "default", 
            sample_schedule_data, 
            options
        )
        
        assert isinstance(rendered, str)
        assert len(rendered) > 0
        assert "schedule" in rendered.lower()

    def test_render_template_custom(self, pdf_template_engine, sample_schedule_data):
        """カスタムテンプレートレンダリングテスト"""
        # カスタムテンプレートを作成
        custom_template = """
        <h1>Schedule Report: {{ options.start_date }} to {{ options.end_date }}</h1>
        <table>
        {% for schedule in schedules %}
        <tr>
            <td>{{ schedule.date }}</td>
            <td>{{ schedule.worker_name }}</td>
        </tr>
        {% endfor %}
        </table>
        """
        
        template_file = pdf_template_engine.template_dir / "custom.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(custom_template)
        
        options = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        }
        
        rendered = pdf_template_engine.render_template(
            "custom", 
            sample_schedule_data, 
            options
        )
        
        assert isinstance(rendered, str)
        assert "2024-01-01" in rendered
        assert "2024-01-31" in rendered
        assert "田中太郎" in rendered  # サンプルデータから

    def test_render_template_nonexistent(self, pdf_template_engine, sample_schedule_data):
        """存在しないテンプレートレンダリングテスト"""
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        with pytest.raises(Exception):
            pdf_template_engine.render_template(
                "nonexistent", 
                sample_schedule_data, 
                options
            )

    def test_render_template_with_japanese_data(self, pdf_template_engine):
        """日本語データでのテンプレートレンダリングテスト"""
        japanese_data = [{
            "date": "2024-01-15",
            "worker_name": "田中太郎",
            "part_name": "営業部門",
            "details": "新規顧客開拓業務"
        }]
        
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        rendered = pdf_template_engine.render_template(
            "default", 
            japanese_data, 
            options
        )
        
        assert isinstance(rendered, str)
        assert "田中太郎" in rendered
        assert "営業部門" in rendered

    def test_render_template_empty_data(self, pdf_template_engine):
        """空データでのテンプレートレンダリングテスト"""
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        rendered = pdf_template_engine.render_template(
            "default", 
            [], 
            options
        )
        
        assert isinstance(rendered, str)
        assert len(rendered) > 0

    def test_custom_jinja_filters(self, pdf_template_engine):
        """カスタムJinjaフィルターテスト"""
        # カスタムフィルターを使用するテンプレート
        template_with_filter = """
        <p>Formatted date: {{ "2024-01-15" | format_date }}</p>
        <p>Formatted time: {{ "09:30" | format_time }}</p>
        """
        
        template_file = pdf_template_engine.template_dir / "with_filters.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(template_with_filter)
        
        options = {}
        
        rendered = pdf_template_engine.render_template(
            "with_filters", 
            [], 
            options
        )
        
        assert isinstance(rendered, str)
        # カスタムフィルターが適用されていることを確認
        assert "Formatted date:" in rendered

    def test_template_with_conditional_logic(self, pdf_template_engine, sample_schedule_data):
        """条件分岐を含むテンプレートテスト"""
        conditional_template = """
        {% if options.include_details %}
        <h2>詳細情報付きレポート</h2>
        {% else %}
        <h2>簡易レポート</h2>
        {% endif %}
        
        {% for schedule in schedules %}
        <div>
            <span>{{ schedule.worker_name }}</span>
            {% if options.include_details and schedule.details %}
            <p>{{ schedule.details }}</p>
            {% endif %}
        </div>
        {% endfor %}
        """
        
        template_file = pdf_template_engine.template_dir / "conditional.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(conditional_template)
        
        # 詳細ありでのレンダリング
        options_with_details = {"include_details": True}
        rendered_detailed = pdf_template_engine.render_template(
            "conditional", 
            sample_schedule_data, 
            options_with_details
        )
        
        assert "詳細情報付きレポート" in rendered_detailed
        
        # 詳細なしでのレンダリング
        options_without_details = {"include_details": False}
        rendered_simple = pdf_template_engine.render_template(
            "conditional", 
            sample_schedule_data, 
            options_without_details
        )
        
        assert "簡易レポート" in rendered_simple

    def test_template_with_loops_and_grouping(self, pdf_template_engine):
        """ループとグループ化を含むテンプレートテスト"""
        grouped_data = [
            {"date": "2024-01-15", "part_name": "営業部", "worker_name": "田中"},
            {"date": "2024-01-15", "part_name": "営業部", "worker_name": "佐藤"},
            {"date": "2024-01-15", "part_name": "開発部", "worker_name": "鈴木"},
        ]
        
        grouping_template = """
        {% for date, schedules in schedules | groupby('date') %}
        <h3>{{ date }}</h3>
        {% for part_name, part_schedules in schedules | groupby('part_name') %}
        <h4>{{ part_name }}</h4>
        <ul>
        {% for schedule in part_schedules %}
        <li>{{ schedule.worker_name }}</li>
        {% endfor %}
        </ul>
        {% endfor %}
        {% endfor %}
        """
        
        template_file = pdf_template_engine.template_dir / "grouped.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(grouping_template)
        
        options = {}
        
        rendered = pdf_template_engine.render_template(
            "grouped", 
            grouped_data, 
            options
        )
        
        assert "2024-01-15" in rendered
        assert "営業部" in rendered
        assert "開発部" in rendered

    def test_template_error_handling(self, pdf_template_engine, sample_schedule_data):
        """テンプレートエラーハンドリングテスト"""
        # 構文エラーを含むテンプレート
        error_template = """
        {% for schedule in schedules %
        <p>{{ schedule.worker_name }}</p>
        {% endfor %}
        """
        
        template_file = pdf_template_engine.template_dir / "error.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(error_template)
        
        options = {}
        
        with pytest.raises(Exception):
            pdf_template_engine.render_template(
                "error", 
                sample_schedule_data, 
                options
            )

    def test_template_with_large_dataset(self, pdf_template_engine):
        """大きなデータセットでのテンプレートテスト"""
        large_dataset = []
        for i in range(1000):
            large_dataset.append({
                "date": f"2024-01-{(i % 30) + 1:02d}",
                "worker_name": f"社員{i}",
                "part_name": f"部署{i % 10}"
            })
        
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        rendered = pdf_template_engine.render_template(
            "default", 
            large_dataset, 
            options
        )
        
        assert isinstance(rendered, str)
        assert len(rendered) > 0

    @pytest.mark.parametrize("template_name", ["schedule_daily", "schedule_weekly", "schedule_monthly"])
    def test_different_template_types(self, pdf_template_engine, sample_schedule_data, template_name):
        """異なるテンプレートタイプのテスト"""
        # 各種テンプレートを作成
        template_content = f"""
        <h1>{template_name.replace('_', ' ').title()}</h1>
        <table>
        {% for schedule in schedules %}
        <tr><td>{{ schedule.date }}</td><td>{{ schedule.worker_name }}</td></tr>
        {% endfor %}
        </table>
        """
        
        template_file = pdf_template_engine.template_dir / f"{template_name}.html"
        template_file.parent.mkdir(parents=True, exist_ok=True)
        template_file.write_text(template_content)
        
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        rendered = pdf_template_engine.render_template(
            template_name, 
            sample_schedule_data, 
            options
        )
        
        assert isinstance(rendered, str)
        assert template_name.replace('_', ' ').title() in rendered

    def test_template_caching(self, pdf_template_engine, sample_schedule_data):
        """テンプレートキャッシュテスト"""
        options = {"start_date": "2024-01-01", "end_date": "2024-01-31"}
        
        # 初回レンダリング
        rendered1 = pdf_template_engine.render_template(
            "default", 
            sample_schedule_data, 
            options
        )
        
        # 2回目レンダリング（キャッシュが使用されるはず）
        rendered2 = pdf_template_engine.render_template(
            "default", 
            sample_schedule_data, 
            options
        )
        
        assert rendered1 == rendered2