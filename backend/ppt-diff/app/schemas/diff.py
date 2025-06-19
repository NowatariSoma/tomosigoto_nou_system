"""
Pydantic schemas for PowerPoint diff API
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class FileInfo(BaseModel):
    """File information schema"""
    filename: str
    size: int
    content_type: str


class DiffItem(BaseModel):
    """Individual diff item schema"""
    type: str
    slide_number: Optional[int] = None
    element_id: Optional[str] = None
    change_type: str  # 'added', 'removed', 'modified'
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: str
    metadata: Optional[Dict[str, Any]] = None


class SlideInfo(BaseModel):
    """Slide information schema"""
    slide_number: int
    title: Optional[str] = None
    has_changes: bool = False
    change_count: int = 0
    changes: List[DiffItem] = []


class ComparisonResult(BaseModel):
    """Main comparison result schema"""
    comparison_id: str
    file1: FileInfo
    file2: FileInfo
    total_changes: int
    slides: List[SlideInfo]
    summary: Dict[str, int]  # {'added': 5, 'removed': 2, 'modified': 10}
    processing_time: float


class ComparisonRequest(BaseModel):
    """Request schema for comparison"""
    comparison_name: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None 