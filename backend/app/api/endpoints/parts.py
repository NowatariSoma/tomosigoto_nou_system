from typing import Any, Dict, List
from uuid import UUID

from app.api.deps import get_current_user, get_part_service
from app.schemas.part import PartBase, PartCreate, PartResponse, PartUpdate
from app.services.part_service import PartService
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.get("/", response_model=List[PartResponse])
async def get_parts(
    part_service: PartService = Depends(get_part_service),
    current_user: dict = Depends(get_current_user),
):
    """
    パートの全情報を取得

    Args:
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）

    Returns:
        listですべてのパート情報
    """
    all_part_data = await part_service.get_all_parts()
    return all_part_data


@router.get("/{part_id}", response_model=PartResponse)
async def get_part(
    part_id: UUID,
    part_service: PartService = Depends(get_part_service),
    current_user: dict = Depends(get_current_user),
):
    """
    指定したパート情報を取得

    Args:
        part_id: パートを指定するuuid
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）

    Returns
        スキーマを通して辞書型としたパート情報
    """

    part_data = await part_service.get_part(part_id)
    return PartResponse(**part_data)


@router.post("/", response_model=PartResponse)
async def create_part(
    part_data: PartCreate,
    part_service: PartService = Depends(get_part_service),
    current_user: dict = Depends(get_current_user),
):
    """
    新しくパート情報を作成
    
    Args:
        part_data: パート作成データ
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）
    
    Returns:
        作成されたパート情報
    """
    # UUIDを文字列に変換してからサービスに渡す
    part_dict = part_data.dict()
    for key, value in part_dict.items():
        if isinstance(value, UUID):
            part_dict[key] = str(value)
    
    created_part = await part_service.create_part(part_dict)
    return PartResponse(**created_part)


@router.put("/{part_id}", response_model=PartResponse)
async def update_part(
    part_id: UUID,
    part_data: PartUpdate,
    part_service: PartService = Depends(get_part_service),
    current_user: dict = Depends(get_current_user),
):
    """
    指定したパート情報を更新

    Args:
        part_id: パートを指定するuuid
        part_data: 更新後のパート情報
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）

    Returns
        スキーマを通して辞書型としたパート情報
    """
    # UUIDを文字列に変換してからサービスに渡す
    part_dict = part_data.dict()
    for key, value in part_dict.items():
        if isinstance(value, UUID):
            part_dict[key] = str(value)
    
    updated_part = await part_service.update_part(part_id, part_dict)
    return PartResponse(**updated_part)


@router.delete("/{part_id}")
async def delete_part(
    part_id: UUID,
    part_service: PartService = Depends(get_part_service),
    current_user: dict = Depends(get_current_user),
):
    """
    指定したパート情報を削除

    Args:
        part_id: パートを指定するuuid
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）

    Returns
        確認メッセージ
    """
    await part_service.remove_part(part_id)
