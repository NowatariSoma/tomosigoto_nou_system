"""
ロール管理APIエンドポイント

このモジュールは以下のエンドポイントを提供します：
- ロール一覧取得
- ユーザーロール取得
- ロール割り当て・削除
- 権限チェック機能
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
import logging

from app.auth.roles import RoleManager
from app.auth.permissions import PermissionManager
from app.auth.decorators import require_role, require_permission, get_role_manager, get_permission_manager
from app.api.auth.role_schemas import (
    RoleResponse,
    RoleAssignment,
    RoleAssignmentResponse,
    UserRolesResponse,
    EffectivePermissionsResponse,
    PermissionCheckRequest,
    PermissionCheckResponse,
    ResourcePermissionCheckRequest,
    ResourcePermissionCheckResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/roles", tags=["roles"])


@router.get("/", response_model=List[RoleResponse])
async def get_roles(
    current_user_id: str = require_permission("roles:read")
):
    """
    全ロール取得
    
    要求権限: roles:read
    """
    try:
        role_manager = get_role_manager()
        
        # 利用可能な全ロールを取得
        roles_data = []
        for role_name, role in role_manager.roles.items():
            roles_data.append(RoleResponse(
                name=role.name,
                description=role.description,
                permissions=list(role.permissions),
                inherits_from=role.inherits_from
            ))
        
        logger.info(f"User {current_user_id} retrieved {len(roles_data)} roles")
        return roles_data
        
    except Exception as e:
        logger.error(f"Failed to get roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ロール取得中にエラーが発生しました"
        )


@router.get("/user/{user_id}", response_model=UserRolesResponse)
async def get_user_roles(
    user_id: str,
    current_user_id: str = require_permission("roles:read")
):
    """
    ユーザーロール取得
    
    要求権限: roles:read
    """
    try:
        role_manager = get_role_manager()
        
        # 自分以外のユーザーのロールを取得する場合は管理者権限が必要
        if user_id != current_user_id:
            is_admin = await role_manager.has_role(current_user_id, "admin")
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーのロール情報を取得する権限がありません"
                )
        
        # ユーザーのロールを取得
        user_roles = await role_manager.get_user_roles(user_id)
        
        # レスポンス形式に変換
        roles_data = []
        for role in user_roles:
            roles_data.append(RoleResponse(
                name=role.name,
                description=role.description,
                permissions=list(role.permissions),
                inherits_from=role.inherits_from
            ))
        
        logger.info(f"User {current_user_id} retrieved roles for user {user_id}")
        return UserRolesResponse(
            user_id=user_id,
            roles=roles_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user roles for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザーロール取得中にエラーが発生しました"
        )


@router.post("/assign", response_model=RoleAssignmentResponse)
async def assign_role(
    role_data: RoleAssignment,
    current_user_id: str = require_role("admin")
):
    """
    ロール割り当て
    
    要求ロール: admin（管理者のみ）
    """
    try:
        role_manager = get_role_manager()
        
        # ロール割り当て実行
        success = await role_manager.assign_role(role_data.user_id, role_data.role_name)
        
        if success:
            logger.info(f"Admin {current_user_id} assigned role {role_data.role_name} to user {role_data.user_id}")
            return RoleAssignmentResponse(
                user_id=role_data.user_id,
                role_name=role_data.role_name,
                success=True,
                message=f"ロール '{role_data.role_name}' が正常に割り当てられました"
            )
        else:
            logger.warning(f"Failed to assign role {role_data.role_name} to user {role_data.user_id}")
            return RoleAssignmentResponse(
                user_id=role_data.user_id,
                role_name=role_data.role_name,
                success=False,
                message="ロール割り当てに失敗しました"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ロール割り当て中にエラーが発生しました"
        )


@router.post("/remove", response_model=RoleAssignmentResponse)
async def remove_role(
    role_data: RoleAssignment,
    current_user_id: str = require_role("admin")
):
    """
    ロール削除
    
    要求ロール: admin（管理者のみ）
    """
    try:
        role_manager = get_role_manager()
        
        # ロール削除実行
        success = await role_manager.remove_role(role_data.user_id, role_data.role_name)
        
        if success:
            logger.info(f"Admin {current_user_id} removed role {role_data.role_name} from user {role_data.user_id}")
            return RoleAssignmentResponse(
                user_id=role_data.user_id,
                role_name=role_data.role_name,
                success=True,
                message=f"ロール '{role_data.role_name}' が正常に削除されました"
            )
        else:
            logger.warning(f"Failed to remove role {role_data.role_name} from user {role_data.user_id}")
            return RoleAssignmentResponse(
                user_id=role_data.user_id,
                role_name=role_data.role_name,
                success=False,
                message="ロール削除に失敗しました"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ロール削除中にエラーが発生しました"
        )


@router.get("/permissions/{user_id}", response_model=EffectivePermissionsResponse)
async def get_effective_permissions(
    user_id: str,
    current_user_id: str = require_permission("roles:read")
):
    """
    実効権限取得
    
    要求権限: roles:read
    """
    try:
        role_manager = get_role_manager()
        
        # 自分以外のユーザーの権限を取得する場合は管理者権限が必要
        if user_id != current_user_id:
            is_admin = await role_manager.has_role(current_user_id, "admin")
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーの権限情報を取得する権限がありません"
                )
        
        # ユーザーの実効権限を取得
        effective_permissions = await role_manager.get_effective_permissions(user_id)
        
        logger.info(f"User {current_user_id} retrieved effective permissions for user {user_id}")
        return EffectivePermissionsResponse(
            user_id=user_id,
            permissions=list(effective_permissions)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get effective permissions for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="実効権限取得中にエラーが発生しました"
        )


@router.post("/check-permission", response_model=PermissionCheckResponse)
async def check_permission(
    request: PermissionCheckRequest,
    current_user_id: str = require_permission("roles:read")
):
    """
    権限チェック
    
    要求権限: roles:read
    """
    try:
        role_manager = get_role_manager()
        permission_manager = get_permission_manager()
        
        # 自分以外のユーザーの権限をチェックする場合は管理者権限が必要
        if request.user_id != current_user_id:
            is_admin = await role_manager.has_role(current_user_id, "admin")
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーの権限をチェックする権限がありません"
                )
        
        # 権限チェック実行
        has_permission = await permission_manager.check_permission(
            request.user_id, request.permission, role_manager
        )
        
        logger.info(f"Permission check: user={request.user_id}, permission={request.permission}, result={has_permission}")
        return PermissionCheckResponse(
            user_id=request.user_id,
            permission=request.permission,
            has_permission=has_permission
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking permission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="権限チェック中にエラーが発生しました"
        )


@router.post("/check-resource-permission", response_model=ResourcePermissionCheckResponse)
async def check_resource_permission(
    request: ResourcePermissionCheckRequest,
    current_user_id: str = require_permission("roles:read")
):
    """
    リソース権限チェック
    
    要求権限: roles:read
    """
    try:
        role_manager = get_role_manager()
        permission_manager = get_permission_manager()
        
        # 自分以外のユーザーの権限をチェックする場合は管理者権限が必要
        if request.user_id != current_user_id:
            is_admin = await role_manager.has_role(current_user_id, "admin")
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="他のユーザーの権限をチェックする権限がありません"
                )
        
        # リソース権限チェック実行
        has_permission = await permission_manager.check_resource_permission(
            request.user_id, request.resource_type, request.action, role_manager
        )
        
        logger.info(f"Resource permission check: user={request.user_id}, resource={request.resource_type}:{request.action}, result={has_permission}")
        return ResourcePermissionCheckResponse(
            user_id=request.user_id,
            resource_type=request.resource_type,
            action=request.action,
            has_permission=has_permission
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking resource permission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="リソース権限チェック中にエラーが発生しました"
        )