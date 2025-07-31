from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from typing import List
from io import BytesIO

from app.schemas.pdf_export import PDFExportOptions, PDFExportResponse, PDFTemplateInfo
from app.services.pdf_service import PDFService, PDFExportError, PDFNotFoundError
from app.api.deps import get_current_user


# PDFサービスのインスタンス（実際にはDIコンテナから注入される）
def get_pdf_service() -> PDFService:
    """PDFサービスを取得する依存関数"""
    return PDFService()


router = APIRouter()


@router.post("/schedules/export-pdf", response_model=PDFExportResponse)
async def export_schedule_pdf(
    options: PDFExportOptions,
    current_user: dict = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """
    スケジュールPDF出力リクエスト
    
    Args:
        options: PDF出力オプション
        current_user: 認証済みユーザー
        pdf_service: PDFサービス
        
    Returns:
        PDF出力レスポンス
    """
    try:
        user_id = current_user.get("id") or current_user.get("user_id", 1)  # モック用
        result = pdf_service.generate_schedule_pdf(options, user_id)
        
        if result.status == "failed":
            raise HTTPException(status_code=500, detail=result.error_message)
        
        return result
        
    except PDFExportError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF生成エラー: {str(e)}")


@router.get("/pdf-exports/{export_id}/download")
async def download_pdf(
    export_id: str,
    current_user: dict = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """
    生成済みPDFダウンロード
    
    Args:
        export_id: エクスポートID
        current_user: 認証済みユーザー
        pdf_service: PDFサービス
        
    Returns:
        PDFファイルのストリーミングレスポンス
    """
    try:
        pdf_data, filename = pdf_service.get_pdf_by_id(export_id)
        
        # PDFをストリーミングレスポンスとして返す
        return StreamingResponse(
            BytesIO(pdf_data.getvalue()),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
        
    except PDFNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDFダウンロードエラー: {str(e)}")


@router.get("/pdf-exports/{export_id}", response_model=PDFExportResponse)
async def get_pdf_export_status(
    export_id: str,
    current_user: dict = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """
    PDF出力ステータス確認
    
    Args:
        export_id: エクスポートID
        current_user: 認証済みユーザー
        pdf_service: PDFサービス
        
    Returns:
        PDF出力ステータス
    """
    try:
        result = pdf_service.get_export_status(export_id)
        
        if result.status == "not_found":
            raise HTTPException(status_code=404, detail="指定されたエクスポートが見つかりません")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ステータス取得エラー: {str(e)}")


@router.get("/pdf-exports/templates", response_model=List[PDFTemplateInfo])
async def get_pdf_templates(
    current_user: dict = Depends(get_current_user),
    pdf_service: PDFService = Depends(get_pdf_service)
):
    """
    利用可能なPDFテンプレート一覧取得
    
    Args:
        current_user: 認証済みユーザー
        pdf_service: PDFサービス
        
    Returns:
        利用可能なテンプレートのリスト
    """
    try:
        templates = pdf_service.get_available_templates()
        return templates
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"テンプレート一覧取得エラー: {str(e)}")


# エラーハンドラー（APIRouterではなくアプリケーションレベルで設定が必要）
# @router.exception_handler(PDFExportError)
# async def pdf_export_error_handler(request, exc: PDFExportError):
#     """PDF出力エラー処理"""
#     raise HTTPException(status_code=500, detail=str(exc))


# @router.exception_handler(PDFNotFoundError)
# async def pdf_not_found_error_handler(request, exc: PDFNotFoundError):
#     """PDF未発見エラー処理"""
#     raise HTTPException(status_code=404, detail=str(exc))