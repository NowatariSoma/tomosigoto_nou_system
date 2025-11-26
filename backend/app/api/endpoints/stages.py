"""
Stages API endpoints - 舞台情報の管理
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import (
    get_current_user,
    get_member_assignment_service,
    get_part_service,
    get_stage_service,
    require_instructor_or_admin,
    require_member_or_above,
)
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.member_assignment import MemberAssignmentWithDetails
from app.schemas.part import PartResponse
from app.schemas.stage import StageCreate, StageResponse, StageUpdate
from app.services.member_assignment_service import MemberAssignmentService
from app.services.part_service import PartService
from app.services.stage_service import StageService
from fastapi import APIRouter, Depends, Query, status

router = APIRouter()


@router.get("/", response_model=List[StageResponse])
async def get_stages(
    status_filter: Optional[str] = Query(None, description="ステータスでフィルタリング (active/inactive)"),
    stage_service: StageService = Depends(get_stage_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """
    舞台一覧を取得
    """
    if status_filter:
        return await stage_service.get_stages_by_status(status_filter)
    else:
        return await stage_service.get_all_stages()


@router.get("/{stage_id}", response_model=StageResponse)
async def get_stage(
    stage_id: str,
    stage_service: StageService = Depends(get_stage_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """
    特定の舞台情報を取得
    """
    return await stage_service.get_stage_by_id(stage_id)


@router.post("/", response_model=StageResponse, status_code=status.HTTP_201_CREATED)
async def create_stage(
    stage_data: StageCreate,
    stage_service: StageService = Depends(get_stage_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """
    新しい舞台を作成
    """
    return await stage_service.create_stage(stage_data.dict())


@router.put("/{stage_id}", response_model=StageResponse)
async def update_stage(
    stage_id: str,
    stage_data: StageUpdate,
    stage_service: StageService = Depends(get_stage_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """
    舞台情報を更新
    """
    # 更新データから None 値を除外
    update_data = {k: v for k, v in stage_data.dict().items() if v is not None}

    if not update_data:
        raise APIException(ErrorMessage.BAD_REQUEST)

    return await stage_service.update_stage(stage_id, update_data)


@router.delete("/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: str,
    stage_service: StageService = Depends(get_stage_service),
    current_user: Dict[str, Any] = Depends(require_instructor_or_admin),
):
    """
    舞台を削除
    """
    await stage_service.delete_stage(stage_id)


@router.get("/{stage_id}/parts", response_model=List[PartResponse])
async def get_stage_parts(
    stage_id: str,
    stage_service: StageService = Depends(get_stage_service),
    part_service: PartService = Depends(get_part_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """
    指定された舞台に紐づくパート一覧を取得
    """
    # まず舞台の存在確認
    await stage_service.get_stage_by_id(stage_id)
    
    # 指定された舞台に紐づくパート一覧を取得
    parts = await part_service.get_parts_by_stage_id(stage_id)
    return parts


@router.get("/{stage_id}/members", response_model=List[MemberAssignmentWithDetails])
async def get_stage_members(
    stage_id: str,
    category: Optional[str] = Query(None, description="カテゴリでフィルタリング (utai/mai)"),
    stage_service: StageService = Depends(get_stage_service),
    part_service: PartService = Depends(get_part_service),
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
    current_user: Dict[str, Any] = Depends(require_member_or_above),
):
    """
    指定された舞台に所属するメンバー一覧を取得
    """
    # まず舞台の存在確認
    await stage_service.get_stage_by_id(stage_id)
    
    # 指定された舞台に紐づくパート一覧を取得
    parts = await part_service.get_parts_by_stage_id(stage_id)
    
    if not parts:
        return []
    
    # 各パートのメンバー所属を取得
    all_members = []
    for part in parts:
        try:
            part_id = UUID(part["id"])
            # パートに所属するメンバーを取得
            members = await member_assignment_service.get_assignments_with_details(
                part_id=part_id, assignment_id=None, user_id=None
            )
            
            # カテゴリフィルタリング
            if category:
                members = [member for member in members if member.get("category") == category]
            
            all_members.extend(members)
        except ValueError:
            # UUIDが不正な場合はスキップ
            continue
    
    return all_members
