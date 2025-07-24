from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, date


class PDFExportOptions(BaseModel):
    """PDFエクスポートオプションのPydanticモデル"""
    start_date: date
    end_date: date
    part_id: Optional[int] = None
    template_id: str = "default"
    paper_size: str = "A4"
    orientation: str = "portrait"
    include_details: bool = True
    font_size: int = 10
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        """終了日が開始日以降であることを確認"""
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('終了日は開始日以降である必要があります')
        return v
    
    @validator('paper_size')
    def validate_paper_size(cls, v):
        """サポートされている用紙サイズであることを確認"""
        allowed_sizes = ['A4', 'A3', 'B4', 'B5', 'Letter']
        if v not in allowed_sizes:
            raise ValueError(f'用紙サイズは {", ".join(allowed_sizes)} のいずれかである必要があります')
        return v
    
    @validator('orientation')
    def validate_orientation(cls, v):
        """"portrait"または"landscape"であることを確認"""
        if v not in ['portrait', 'landscape']:
            raise ValueError('向きは "portrait" または "landscape" である必要があります')
        return v
    
    @validator('font_size')
    def validate_font_size(cls, v):
        """8〜14の範囲内であることを確認"""
        if not 8 <= v <= 14:
            raise ValueError('フォントサイズは 8〜14 の範囲内である必要があります')
        return v


class PDFExportResponse(BaseModel):
    """PDFエクスポートレスポンスのPydanticモデル"""
    export_id: str
    status: str  # "processing", "completed", "failed"
    created_at: datetime
    expires_at: datetime
    download_url: Optional[str] = None
    error_message: Optional[str] = None


class PDFTemplateInfo(BaseModel):
    """PDFテンプレート情報のPydanticモデル"""
    id: str
    name: str
    description: str
    preview_url: Optional[str] = None
    supported_options: Dict[str, Any] = {}