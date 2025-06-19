"""
PowerPoint comparison endpoints
"""
import os
import uuid
import time
import tempfile
import aiofiles
from typing import List, Dict, Any
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse

# Import existing PowerPoint processing modules
from app.core.diff import PPTXDiffer
from app.core.pptx_extractor import PPTXExtractor

from app.schemas.diff import ComparisonResult, FileInfo, SlideInfo, DiffItem
from app.core.config import settings

router = APIRouter()


async def save_upload_file(upload_file: UploadFile) -> str:
    """Save uploaded file to temporary location"""
    file_id = str(uuid.uuid4())
    file_extension = Path(upload_file.filename).suffix
    temp_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{file_extension}")
    
    async with aiofiles.open(temp_path, 'wb') as f:
        content = await upload_file.read()
        await f.write(content)
    
    return temp_path


def create_file_info(upload_file: UploadFile, file_size: int) -> FileInfo:
    """Create FileInfo object from uploaded file"""
    return FileInfo(
        filename=upload_file.filename,
        size=file_size,
        content_type=upload_file.content_type or "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


def convert_diff_to_api_format(diffs: List[Dict], file1_path: str, file2_path: str) -> List[SlideInfo]:
    """Convert PPTXDiffer output to API format"""
    slides_dict = {}
    
    for diff in diffs:
        slide_num = diff.get('slide_number', 1)
        
        if slide_num not in slides_dict:
            slides_dict[slide_num] = SlideInfo(
                slide_number=slide_num,
                title=diff.get('slide_title', f"Slide {slide_num}"),
                has_changes=True,
                change_count=0,
                changes=[]
            )
        
        # Create DiffItem
        diff_item = DiffItem(
            type=diff.get('type', 'unknown'),
            slide_number=slide_num,
            element_id=diff.get('element_id'),
            change_type=diff.get('change_type', 'modified'),
            old_value=diff.get('old_value'),
            new_value=diff.get('new_value'),
            description=diff.get('description', 'Content changed'),
            metadata=diff.get('metadata', {})
        )
        
        slides_dict[slide_num].changes.append(diff_item)
        slides_dict[slide_num].change_count += 1
    
    return list(slides_dict.values())


@router.post("/compare", response_model=ComparisonResult)
async def compare_presentations(
    file1: UploadFile = File(..., description="First PowerPoint file (old version)"),
    file2: UploadFile = File(..., description="Second PowerPoint file (new version)"),
    comparison_name: str = Form(None, description="Optional name for this comparison")
):
    """
    Compare two PowerPoint presentations and return detailed differences
    """
    start_time = time.time()
    
    # Validate file types
    allowed_types = [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint"
    ]
    
    if file1.content_type not in allowed_types and not file1.filename.endswith(('.pptx', '.ppt')):
        raise HTTPException(status_code=400, detail="File1 must be a PowerPoint file (.pptx or .ppt)")
    
    if file2.content_type not in allowed_types and not file2.filename.endswith(('.pptx', '.ppt')):
        raise HTTPException(status_code=400, detail="File2 must be a PowerPoint file (.pptx or .ppt)")
    
    # Check file sizes
    file1_content = await file1.read()
    file2_content = await file2.read()
    
    if len(file1_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File1 is too large")
    
    if len(file2_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File2 is too large")
    
    # Reset file pointers
    await file1.seek(0)
    await file2.seek(0)
    
    try:
        # Save uploaded files
        file1_path = await save_upload_file(file1)
        file2_path = await save_upload_file(file2)
        
        # Create file info objects
        file1_info = create_file_info(file1, len(file1_content))
        file2_info = create_file_info(file2, len(file2_content))
        
        # Perform comparison using existing PPTXDiffer
        differ = PPTXDiffer(file1_path, file2_path, comparison_name or file1.filename)
        diffs = differ.generate_diff()
        
        # Convert to API format
        slides = convert_diff_to_api_format(diffs, file1_path, file2_path)
        
        # Calculate summary statistics
        total_changes = sum(slide.change_count for slide in slides)
        summary = {"added": 0, "removed": 0, "modified": 0}
        
        for slide in slides:
            for change in slide.changes:
                if change.change_type in summary:
                    summary[change.change_type] += 1
        
        # Create comparison result
        comparison_id = str(uuid.uuid4())
        processing_time = time.time() - start_time
        
        result = ComparisonResult(
            comparison_id=comparison_id,
            file1=file1_info,
            file2=file2_info,
            total_changes=total_changes,
            slides=slides,
            summary=summary,
            processing_time=processing_time
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")
    
    finally:
        # Clean up temporary files
        try:
            if 'file1_path' in locals() and os.path.exists(file1_path):
                os.remove(file1_path)
            if 'file2_path' in locals() and os.path.exists(file2_path):
                os.remove(file2_path)
        except Exception as e:
            print(f"Warning: Could not clean up temporary files: {e}")


@router.get("/formats")
async def get_supported_formats():
    """Get list of supported PowerPoint formats"""
    return {
        "supported_formats": [
            {
                "extension": ".pptx",
                "description": "PowerPoint 2007+ format",
                "mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            },
            {
                "extension": ".ppt", 
                "description": "PowerPoint 97-2003 format",
                "mime_type": "application/vnd.ms-powerpoint"
            }
        ],
        "max_file_size": settings.MAX_FILE_SIZE,
        "max_file_size_mb": settings.MAX_FILE_SIZE // (1024 * 1024)
    } 