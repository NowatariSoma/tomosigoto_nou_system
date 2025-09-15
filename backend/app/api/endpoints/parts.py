from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_current_user, get_part_service
from app.schemas.part import PartBase, PartCreate, PartResponse, PartUpdate
from app.services.part_service import PartService
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.get("/", response_model=List[PartResponse])
async def get_parts(
    current_user: Dict[str, Any] = Depends(get_current_user),
    part_service: PartService = Depends(get_part_service),
):
    """
    パートの全情報を取得

    Args:
        get_current_user:
        part_service: supabaseサービス

    Returns:
        listですべてのパート情報
    """
    all_part_data = await part_service.get_all_parts()
    return all_part_data


@router.get("/{part_id}", response_model=PartResponse)
async def get_part(
    part_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    part_service: PartService = Depends(get_part_service),
):
    """
    指定したパート情報を取得

    Args:
        part_id: パートを指定するuuid
        part_service: supabaseサービス

    Returns
        スキーマを通して辞書型としたパート情報
    """

    part_data = await part_service.get_part(part_id)
    return PartResponse(**part_data)


@router.post("/", response_model=PartResponse)
async def create_part(
    part_data: PartCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    part_service: PartService = Depends(get_part_service),
):
    """
    新しくパート情報を作成
    """
    created_part = await part_service.create_part(part_data.dict())
    return PartResponse(**created_part)


@router.put("/{part_id}", response_model=PartResponse)
async def update_part(
    part_id: UUID,
    part_data: PartUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    part_service: PartService = Depends(get_part_service),
):
    """
    指定したパート情報を更新

    Args:
        part_id: パートを指定するuuid
        part_data: 更新後のパート情報
        part_service: supabaseサービス

    Returns
        スキーマを通して辞書型としたパート情報
    """
    updated_part = await part_service.update_part(part_id, part_data.dict())
    return PartResponse(**updated_part)


@router.delete("/{part_id}")
async def delete_part(
    part_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
    part_service: PartService = Depends(get_part_service),
):
    """
    指定したパート情報を削除

    Args:
        part_id: パートを指定するuuid
        part_service: supabaseサービス

    Returns
        確認メッセージ
    """
    await part_service.remove_part(part_id)
