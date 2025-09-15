from typing import List
from app.api.deps import get_supabase_client
from app.core.exceptions import create_error_response, create_success_response
from app.repositories.groups_repository import GroupsRepository
from app.schemas.groups import GroupCreate, GroupResponse, GroupUpdate
from app.services.groups_service import GroupsService
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

router = APIRouter()


@router.get("/", response_model=List[GroupResponse])
async def get_all_groups(
    client: Client = Depends(get_supabase_client),
):
    """すべてのグループを取得"""
    try:
        service = GroupsService(GroupsRepository(client))
        groups = await service.get_all_groups()
        return groups  # 直接リストを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group_by_id(
    group_id: str,
    client: Client = Depends(get_supabase_client),
):
    """IDでグループを取得"""
    try:
        service = GroupsService(GroupsRepository(client))
        group = await service.get_group_by_id(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        return group  # 直接オブジェクトを返す
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=GroupResponse)
async def create_group(
    group_data: GroupCreate,
    client: Client = Depends(get_supabase_client),
):
    """新しいグループを作成"""
    try:
        service = GroupsService(GroupsRepository(client))
        group = await service.create_group(group_data)
        return group  # 直接オブジェクトを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    group_data: GroupUpdate,
    client: Client = Depends(get_supabase_client),
):
    """グループを更新"""
    try:
        service = GroupsService(GroupsRepository(client))
        group = await service.update_group(group_id, group_data)
        return group  # 直接オブジェクトを返す
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    client: Client = Depends(get_supabase_client),
):
    """グループを削除"""
    try:
        service = GroupsService(GroupsRepository(client))
        await service.delete_group(group_id)
        return {"message": "Group deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
