"""
PDF Export API エンドポイントのテスト
"""
import pytest
import json
from unittest.mock import patch, Mock
from fastapi import status
from app.schemas.pdf_export import PDFExportOptions, PDFExportResponse


class TestPDFExportEndpoints:
    """PDF Export APIエンドポイントテストクラス"""

    def test_export_pdf_success(self, client, mock_current_user, sample_pdf_export_options):
        """PDF エクスポート成功テスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                # モックレスポンス設定
                mock_response = PDFExportResponse(
                    status="success",
                    export_id="test-export-123",
                    download_url="/pdf-exports/test-export-123/download",
                    message="PDFエクスポートが完了しました"
                )
                mock_service.create_pdf_export.return_value = mock_response
                
                response = client.post(
                    "/schedules/export-pdf",
                    json=sample_pdf_export_options
                )
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["status"] == "success"
                assert data["export_id"] == "test-export-123"
                assert "download_url" in data

    def test_export_pdf_invalid_date_range(self, client, mock_current_user):
        """無効な日付範囲でのエクスポートテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            invalid_options = {
                "start_date": "2024-01-31",
                "end_date": "2024-01-01",  # 開始日より前の終了日
                "part_id": "part-1"
            }
            
            response = client.post(
                "/schedules/export-pdf",
                json=invalid_options
            )
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_export_pdf_unauthorized(self, client, sample_pdf_export_options):
        """認証なしでのエクスポートテスト"""
        response = client.post(
            "/schedules/export-pdf",
            json=sample_pdf_export_options
        )
        
        # 認証エラーまたは401を期待
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_export_pdf_service_error(self, client, mock_current_user, sample_pdf_export_options):
        """PDFサービスエラー時のテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                # サービスエラーを模擬
                mock_response = PDFExportResponse(
                    status="failed",
                    error_message="PDF生成に失敗しました"
                )
                mock_service.create_pdf_export.return_value = mock_response
                
                response = client.post(
                    "/schedules/export-pdf",
                    json=sample_pdf_export_options
                )
                
                assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_download_pdf_success(self, client, mock_current_user):
        """PDFダウンロード成功テスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                # モックPDFデータ
                mock_pdf_data = b"fake pdf content"
                mock_filename = "schedule_export_2024-01-01_to_2024-01-31.pdf"
                mock_service.get_pdf_by_id.return_value = (mock_pdf_data, mock_filename)
                
                response = client.get("/pdf-exports/test-export-123/download")
                
                assert response.status_code == status.HTTP_200_OK
                assert response.headers["content-type"] == "application/pdf"
                assert mock_filename in response.headers.get("content-disposition", "")

    def test_download_pdf_not_found(self, client, mock_current_user):
        """PDFが見つからない場合のテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                # PDFが見つからない場合
                mock_service.get_pdf_by_id.return_value = (None, None)
                
                response = client.get("/pdf-exports/nonexistent-export/download")
                
                assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_export_status_success(self, client, mock_current_user):
        """エクスポートステータス取得成功テスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                mock_status = {
                    "export_id": "test-export-123",
                    "status": "completed",
                    "created_at": "2024-01-15T10:00:00Z",
                    "file_size": 1024000
                }
                mock_service.get_export_status.return_value = mock_status
                
                response = client.get("/pdf-exports/test-export-123")
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["export_id"] == "test-export-123"
                assert data["status"] == "completed"

    def test_get_export_status_not_found(self, client, mock_current_user):
        """存在しないエクスポートのステータス取得テスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                mock_service.get_export_status.return_value = None
                
                response = client.get("/pdf-exports/nonexistent-export")
                
                assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_templates_success(self, client, mock_current_user):
        """テンプレート一覧取得成功テスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                mock_templates = [
                    {"id": "default", "name": "標準テンプレート", "description": "基本的なレイアウト"},
                    {"id": "detailed", "name": "詳細テンプレート", "description": "詳細情報を含むレイアウト"}
                ]
                mock_service.get_available_templates.return_value = mock_templates
                
                response = client.get("/pdf-exports/templates")
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert len(data) == 2
                assert data[0]["id"] == "default"

    @pytest.mark.parametrize("invalid_export_id", [
        "",  # 空文字
        "a" * 256,  # 長すぎるID
        "invalid/chars",  # 無効な文字
        "null",  # null文字列
    ])
    def test_download_pdf_invalid_export_id(self, client, mock_current_user, invalid_export_id):
        """無効なエクスポートIDでのダウンロードテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            response = client.get(f"/pdf-exports/{invalid_export_id}/download")
            
            # パスバリデーションエラーまたは404を期待
            assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_422_UNPROCESSABLE_ENTITY]

    def test_export_pdf_malformed_json(self, client, mock_current_user):
        """不正なJSONでのエクスポートテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            response = client.post(
                "/schedules/export-pdf",
                data="invalid json",
                headers={"Content-Type": "application/json"}
            )
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.parametrize("invalid_options", [
        {"start_date": "invalid-date"},  # 無効な日付形式
        {"part_id": 123},  # 無効な型
        {"font_size": 0},  # 範囲外の値
        {"paper_size": "INVALID"},  # 無効な用紙サイズ
        {"orientation": "sideways"},  # 無効な向き
    ])
    def test_export_pdf_invalid_parameters(self, client, mock_current_user, invalid_options):
        """無効なパラメータでのエクスポートテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            response = client.post(
                "/schedules/export-pdf",
                json=invalid_options
            )
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_concurrent_pdf_exports(self, client, mock_current_user, sample_pdf_export_options):
        """同時PDF エクスポートテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                mock_response = PDFExportResponse(
                    status="success",
                    export_id="test-export-concurrent",
                    download_url="/pdf-exports/test-export-concurrent/download"
                )
                mock_service.create_pdf_export.return_value = mock_response
                
                # 複数の同時リクエスト
                responses = []
                for i in range(3):
                    response = client.post(
                        "/schedules/export-pdf",
                        json=sample_pdf_export_options
                    )
                    responses.append(response)
                
                # すべて成功することを確認
                for response in responses:
                    assert response.status_code == status.HTTP_200_OK

    def test_large_date_range_export(self, client, mock_current_user):
        """大きな日付範囲でのエクスポートテスト"""
        with patch('backend.app.api.endpoints.pdf_exports.get_current_user', return_value=mock_current_user):
            with patch('backend.app.api.endpoints.pdf_exports.pdf_service') as mock_service:
                large_range_options = {
                    "start_date": "2024-01-01",
                    "end_date": "2024-12-31",  # 1年間
                    "part_id": "all"
                }
                
                mock_response = PDFExportResponse(
                    status="success",
                    export_id="test-export-large",
                    download_url="/pdf-exports/test-export-large/download"
                )
                mock_service.create_pdf_export.return_value = mock_response
                
                response = client.post(
                    "/schedules/export-pdf",
                    json=large_range_options
                )
                
                assert response.status_code == status.HTTP_200_OK