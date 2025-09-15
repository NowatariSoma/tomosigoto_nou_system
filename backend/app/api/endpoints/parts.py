from typing import List
from app.api.deps import get_supabase_client
from app.core.exceptions import create_error_response, create_success_response
from app.repositories.parts_repository import PartsRepository
from app.schemas.parts import PartCreate, PartResponse, PartUpdate
from app.services.parts_service import PartsService
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

router = APIRouter()


@router.get("/", response_model=List[PartResponse])
async def get_all_parts(
    client: Client = Depends(get_supabase_client),
):
    """すべてのパートを取得"""
    try:
        service = PartsService(PartsRepository(client))
        parts = await service.get_all_parts()
        return parts  # 直接リストを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{part_id}", response_model=PartResponse)
async def get_part_by_id(
    part_id: str,
    client: Client = Depends(get_supabase_client),
):
    """IDでパートを取得"""
    try:
        service = PartsService(PartsRepository(client))
        part = await service.get_part_by_id(part_id)
        if not part:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Part not found"
            )
        return part  # 直接オブジェクトを返す
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PartResponse)
async def create_part(
    part_data: PartCreate,
    client: Client = Depends(get_supabase_client),
):
    """新しいパートを作成"""
    try:
        service = PartsService(PartsRepository(client))
        part = await service.create_part(part_data)
        return part  # 直接オブジェクトを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{part_id}", response_model=PartResponse)
async def update_part(
    part_id: str,
    part_data: PartUpdate,
    client: Client = Depends(get_supabase_client),
):
    """パートを更新"""
    try:
        service = PartsService(PartsRepository(client))
        part = await service.update_part(part_id, part_data)
        return part  # 直接オブジェクトを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{part_id}")
async def delete_part(
    part_id: str,
    client: Client = Depends(get_supabase_client),
):
    """パートを削除"""
    try:
        service = PartsService(PartsRepository(client))
        await service.delete_part(part_id)
        return {"message": "Part deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
