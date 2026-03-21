from uuid import UUID

from app.api.deps import get_member_admin_service, require_admin
from app.schemas.current_user import CurrentUser
from app.schemas.member_admin import (
    MemberRoleUpdateRequest,
    MemberSummaryResponse,
    MemberInstructorUpdateRequest,
)
from app.services.member_admin_service import MemberAdminService
from fastapi import APIRouter, Depends, status

router = APIRouter()


@router.get("/", response_model=list[MemberSummaryResponse])
async def list_members(
    _: CurrentUser = Depends(require_admin),
    member_admin_service: MemberAdminService = Depends(get_member_admin_service),
) -> list[MemberSummaryResponse]:
    """メンバー一覧を取得"""
    return await member_admin_service.list_members()


@router.patch("/{user_id}/role", response_model=MemberSummaryResponse)
async def update_member_role(
    user_id: UUID,
    payload: MemberRoleUpdateRequest,
    _: CurrentUser = Depends(require_admin),
    member_admin_service: MemberAdminService = Depends(get_member_admin_service),
) -> MemberSummaryResponse:
    """メンバーの管理者権限を更新"""
    return await member_admin_service.update_member_role(str(user_id), payload.role)


@router.patch("/{user_id}/instructor", response_model=MemberSummaryResponse)
async def update_instructor_flag(
    user_id: UUID,
    payload: MemberInstructorUpdateRequest,
    _: CurrentUser = Depends(require_admin),
    member_admin_service: MemberAdminService = Depends(get_member_admin_service),
) -> MemberSummaryResponse:
    """メンバーの指導者フラグを更新"""
    return await member_admin_service.update_instructor_flag(str(user_id), payload.is_instructor)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    user_id: UUID,
    current_user: CurrentUser = Depends(require_admin),
    member_admin_service: MemberAdminService = Depends(get_member_admin_service),
) -> None:
    """メンバーを削除"""
    current_user_id = current_user.get("id")
    await member_admin_service.remove_member(str(user_id), current_user_id)

