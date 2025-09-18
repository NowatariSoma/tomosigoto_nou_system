from typing import Any, Dict, List, Optional
from uuid import UUID

from app.api.deps import get_current_user, get_member_assignment_service
from app.schemas.member_assignment import (
    MemberAssignmentCreate,
    MemberAssignmentResponse,
    MemberAssignmentUpdate,
    MemberAssignmentWithDetails,
)
from app.services.member_assignment_service import MemberAssignmentService
from fastapi import APIRouter, Depends, Query

router = APIRouter()


@router.get("/", response_model=List[MemberAssignmentResponse])
async def get_member_assignments(
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    すべてのメンバー所属を取得

    Args:
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        すべてのメンバー所属情報のリスト
    """
    all_assignments = await member_assignment_service.get_all_assignments()
    return all_assignments


@router.get("/detailed", response_model=List[MemberAssignmentWithDetails])
async def get_member_assignments_with_details(
    assignment_id: Optional[UUID] = Query(None, description="メンバー所属ID"),
    part_id: Optional[UUID] = Query(None, description="パートID"),
    user_id: Optional[str] = Query(None, description="ユーザーID"),
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    詳細情報付きでメンバー所属を取得

    Args:
        assignment_id: メンバー所属ID（オプション）
        part_id: パートID（オプション）
        user_id: ユーザーID（オプション）
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        詳細情報付きメンバー所属情報のリスト
    """
    assignments = await member_assignment_service.get_assignments_with_details(
        assignment_id, part_id, user_id
    )
    return assignments


@router.get("/by-part/{part_id}", response_model=List[MemberAssignmentResponse])
async def get_member_assignments_by_part(
    part_id: UUID,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    指定したパートのメンバー所属を取得

    Args:
        part_id: パートID
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        指定パートのメンバー所属情報のリスト
    """
    assignments = await member_assignment_service.get_assignments_by_part(part_id)
    return assignments


@router.get("/by-user/{user_id}", response_model=List[MemberAssignmentResponse])
async def get_member_assignments_by_user(
    user_id: str,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    指定したユーザーのメンバー所属を取得

    Args:
        user_id: ユーザーID
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        指定ユーザーのメンバー所属情報のリスト
    """
    assignments = await member_assignment_service.get_assignments_by_user(user_id)
    return assignments


@router.get("/{assignment_id}", response_model=MemberAssignmentResponse)
async def get_member_assignment(
    assignment_id: UUID,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    指定したメンバー所属を取得

    Args:
        assignment_id: メンバー所属ID
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        メンバー所属情報
    """
    assignment = await member_assignment_service.get_assignment_by_id(assignment_id)
    return MemberAssignmentResponse(**assignment)


@router.post("/", response_model=MemberAssignmentResponse)
async def create_member_assignment(
    assignment_data: MemberAssignmentCreate,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    新しいメンバー所属を作成

    Args:
        assignment_data: メンバー所属作成データ
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        作成されたメンバー所属情報
    """
    # UUIDを文字列に変換してからサービスに渡す
    assignment_dict = assignment_data.dict()
    for key, value in assignment_dict.items():
        if isinstance(value, UUID):
            assignment_dict[key] = str(value)
    
    created_assignment = await member_assignment_service.create_assignment(assignment_dict)
    return MemberAssignmentResponse(**created_assignment)


@router.post("/bulk/{part_id}", response_model=List[MemberAssignmentResponse])
async def bulk_assign_to_part(
    part_id: UUID,
    user_assignments: List[Dict[str, Any]],
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    パートに複数のユーザーを一括所属させる

    Args:
        part_id: パートID
        user_assignments: ユーザー所属データのリスト
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        作成されたメンバー所属情報のリスト
    """
    # UUIDを文字列に変換
    processed_assignments = []
    for assignment in user_assignments:
        processed_assignment = assignment.copy()
        for key, value in processed_assignment.items():
            if isinstance(value, UUID):
                processed_assignment[key] = str(value)
        processed_assignments.append(processed_assignment)
    
    created_assignments = await member_assignment_service.bulk_assign_to_part(
        part_id, processed_assignments
    )
    return [MemberAssignmentResponse(**assignment) for assignment in created_assignments]


@router.put("/{assignment_id}", response_model=MemberAssignmentResponse)
async def update_member_assignment(
    assignment_id: UUID,
    assignment_data: MemberAssignmentUpdate,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    指定したメンバー所属を更新

    Args:
        assignment_id: メンバー所属ID
        assignment_data: 更新データ
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        更新されたメンバー所属情報
    """
    # UUIDを文字列に変換してからサービスに渡す
    assignment_dict = assignment_data.dict()
    for key, value in assignment_dict.items():
        if isinstance(value, UUID):
            assignment_dict[key] = str(value)
    
    updated_assignment = await member_assignment_service.update_assignment(
        assignment_id, assignment_dict
    )
    return MemberAssignmentResponse(**updated_assignment)


@router.delete("/{assignment_id}")
async def delete_member_assignment(
    assignment_id: UUID,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    指定したメンバー所属を削除

    Args:
        assignment_id: メンバー所属ID
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        削除確認メッセージ
    """
    await member_assignment_service.remove_assignment(assignment_id)
    return {"message": "Member assignment deleted successfully"}


@router.delete("/by-user-and-part/{user_id}/{part_id}")
async def delete_member_assignment_by_user_and_part(
    user_id: str,
    part_id: UUID,
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
):
    """
    ユーザーIDとパートIDでメンバー所属を削除

    Args:
        user_id: ユーザーID
        part_id: パートID
        current_user: 現在のユーザー
        member_assignment_service: メンバー所属サービス

    Returns:
        削除確認メッセージ
    """
    await member_assignment_service.remove_assignment_by_user_and_part(user_id, part_id)
    return {"message": "Member assignment deleted successfully"}
