from uuid import UUID

from app.api.deps import (
    get_current_user,
    get_member_assignment_service,
    get_part_service,
    require_instructor_or_admin,
    require_member_or_above,
)
from app.schemas.current_user import CurrentUser
from app.schemas.member_assignment import MemberAssignmentWithDetails
from app.schemas.part import PartBase, PartCreate, PartResponse, PartUpdate
from app.services.member_assignment_service import MemberAssignmentService
from app.services.part_service import PartService
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter()


@router.get("/", response_model=list[PartResponse])
def get_parts(
    part_service: PartService = Depends(get_part_service),
    current_user: CurrentUser = Depends(require_member_or_above),
):
    """
    パートの全情報を取得

    Args:
        part_service: supabaseサービス
        current_user: 現在のユーザー（認証必須）

    Returns:
        listですべてのパート情報
    """
    all_part_data = part_service.get_all_parts()
    return all_part_data


@router.get("/{part_id}", response_model=PartResponse)
def get_part(
    part_id: UUID,
    part_service: PartService = Depends(get_part_service),
    current_user: CurrentUser = Depends(require_member_or_above),
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

    part_data = part_service.get_part(part_id)
    return PartResponse(**part_data)


@router.post("/", response_model=PartResponse)
def create_part(
    part_data: PartCreate,
    part_service: PartService = Depends(get_part_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
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
    
    created_part = part_service.create_part(part_dict)
    return PartResponse(**created_part)


@router.put("/{part_id}", response_model=PartResponse)
def update_part(
    part_id: UUID,
    part_data: PartUpdate,
    part_service: PartService = Depends(get_part_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
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
    
    updated_part = part_service.update_part(part_id, part_dict)
    return PartResponse(**updated_part)


@router.delete("/{part_id}")
def delete_part(
    part_id: UUID,
    part_service: PartService = Depends(get_part_service),
    current_user: CurrentUser = Depends(require_instructor_or_admin),
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
    part_service.remove_part(part_id)


@router.get("/{part_id}/members", response_model=list[MemberAssignmentWithDetails])
def get_part_members(
    part_id: UUID,
    category: str | None = Query(None, description="カテゴリでフィルタリング (utai/mai)"),
    part_service: PartService = Depends(get_part_service),
    member_assignment_service: MemberAssignmentService = Depends(get_member_assignment_service),
    current_user: CurrentUser = Depends(require_member_or_above),
):
    """
    指定したパートに所属するメンバー一覧を取得
    
    Args:
        part_id: パートを指定するUUID
        category: カテゴリでフィルタリング（utai/mai）
        part_service: PartServiceの依存性注入
        member_assignment_service: MemberAssignmentServiceの依存性注入
        current_user: 現在のユーザー（認証必須）
    
    Returns:
        指定されたパートに所属するメンバー情報のリスト
    
    Raises:
        HTTPException: パートが見つからない場合
    """
    # まずパートの存在確認
    part_service.get_part(part_id)
    
    # 指定されたパートに所属するメンバーを取得
    members = member_assignment_service.get_assignments_with_details(
        part_id=part_id, assignment_id=None, user_id=None
    )
    
    # カテゴリフィルタリング
    if category:
        if category not in ["utai", "mai"]:
            raise HTTPException(
                status_code=400, 
                detail="カテゴリは 'utai' または 'mai' である必要があります"
            )
        members = [member for member in members if member.get("category") == category]
    
    return members


