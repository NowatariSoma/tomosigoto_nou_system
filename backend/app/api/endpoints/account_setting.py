"""
アカウント設定関連のAPIエンドポイント
"""
from typing import Any

from app.api.deps import (
    get_current_user,
    get_account_setting_service,
    require_admin,
)
from app.schemas.current_user import CurrentUser
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.account_setting import (
    AccountSettingProfileCreate,
    AccountSettingProfileResponse,
    AccountSettingProfileUpdate,
    AccountSettingUpdateRequest,
    AccountSettingValidationResponse,
    DepartmentResponse,
    AccountSettingHistoryResponse,
)
from app.services.account_setting_service import AccountSettingService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("/profile/exists")
async def check_profile_exists(
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのプロフィール存在確認"""
    user_id = current_user["id"]
    profile = await account_setting_service.get_profile_by_user_id(user_id)
    
    return {"exists": profile is not None}


@router.get("/profile", response_model=AccountSettingProfileResponse)
async def get_current_user_profile(
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを取得"""
    user_id = current_user["id"]
    profile = await account_setting_service.get_profile_by_user_id(user_id)
    
    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return profile


@router.get("/profile-public", response_model=AccountSettingProfileResponse)
async def get_public_profile(
    user_id: str = Query(..., description="ユーザーID"),
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """認証不要でプロフィールを取得（テスト用）"""
    profile = await account_setting_service.get_profile_by_user_id(user_id)

    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)

    return profile


@router.get("/profile/{user_id}", response_model=AccountSettingProfileResponse)
async def get_user_profile(
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """指定されたユーザーのアカウント設定プロフィールを取得"""
    profile = await account_setting_service.get_profile_by_user_id(user_id)
    
    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return profile


@router.post("/profile", response_model=AccountSettingProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    profile_data: AccountSettingProfileCreate,
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを作成"""
    user_id = current_user["id"]
    
    # 既存プロフィールの確認
    existing_profile = await account_setting_service.get_profile_by_user_id(user_id)
    if existing_profile:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    # バリデーション
    validation_result = await account_setting_service.validate_profile_data(profile_data.dict(), user_id)
    if not validation_result.is_valid:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    profile = await account_setting_service.create_profile(user_id, profile_data)
    return profile


@router.post("/profile-public", response_model=AccountSettingProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_public_profile(
    profile_data: AccountSettingProfileCreate,
    user_id: str = Query(..., description="ユーザーID"),
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """認証不要でプロフィールを作成（テスト用）"""
    try:
        # バリデーションは一時的に無効化
        # validation_result = await account_setting_service.validate_profile_data(profile_data.dict(), user_id)
        # if not validation_result.is_valid:
        #     raise APIException(ErrorMessage.BAD_REQUEST)
        
        # 実際にデータベースに保存を試行
        profile = await account_setting_service.create_profile(user_id, profile_data)
        
        return profile
    except Exception as e:
        # エラーが発生した場合はエラーを再発生
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)


@router.put("/profile", response_model=AccountSettingProfileResponse)
async def update_user_profile(
    update_data: AccountSettingUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを更新"""
    user_id = current_user["id"]

    # 更新データから None 値を除外
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}

    if not update_dict:
        raise APIException(ErrorMessage.BAD_REQUEST)

    # バリデーション
    validation_result = await account_setting_service.validate_profile_data(update_dict, user_id)
    if not validation_result.is_valid:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Validation failed for user {user_id}: {[e.dict() for e in validation_result.errors]}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "VALIDATION_ERROR",
                "error_msg": "バリデーションエラー",
                "errors": [e.dict() for e in validation_result.errors]
            }
        )

    profile = await account_setting_service.update_profile(user_id, update_data)
    return profile


@router.put("/profile-public", response_model=AccountSettingProfileResponse)
async def update_public_profile(
    update_data: AccountSettingUpdateRequest,
    user_id: str = Query(..., description="ユーザーID"),
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """認証不要でプロフィールを更新（テスト用）"""
    try:
        # 更新データから None 値を除外
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise APIException(ErrorMessage.BAD_REQUEST)
        
        # バリデーションは一時的に無効化
        # validation_result = await account_setting_service.validate_profile_data(update_dict, user_id)
        # if not validation_result.is_valid:
        #     raise APIException(ErrorMessage.BAD_REQUEST)
        
        # 実際にデータベースに更新を試行
        profile = await account_setting_service.update_profile(user_id, update_data)
        
        return profile
    except Exception as e:
        # エラーが発生した場合はエラーを再発生
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)


@router.delete("/profile")
async def delete_user_profile(
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを削除"""
    user_id = current_user["id"]
    
    result = await account_setting_service.delete_profile(user_id)
    if not result:
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
    
    return {"message": "Profile deleted successfully"}


@router.get("/departments", response_model=list[DepartmentResponse])
async def get_all_departments(
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """すべての学部を取得"""
    departments = await account_setting_service.get_all_departments()
    return departments


@router.get("/departments/{department_code}", response_model=DepartmentResponse)
async def get_department_by_code(
    department_code: str,
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """学部コードで学部を取得"""
    department = await account_setting_service.get_department_by_code(department_code)
    
    if not department:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return department


@router.get("/profile/history", response_model=list[AccountSettingHistoryResponse])
async def get_profile_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定変更履歴を取得"""
    user_id = current_user["id"]
    history = await account_setting_service.get_profile_history(user_id, limit)
    return history


@router.get("/profile/history/{field_name}", response_model=list[AccountSettingHistoryResponse])
async def get_field_history(
    field_name: str,
    limit: int = Query(20, ge=1, le=50),
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーの特定フィールドの変更履歴を取得"""
    user_id = current_user["id"]
    history = await account_setting_service.get_field_history(user_id, field_name, limit)
    return history


@router.post("/validate", response_model=AccountSettingValidationResponse)
async def validate_profile_data(
    profile_data: dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィールデータのバリデーション"""
    user_id = current_user["id"]
    validation_result = await account_setting_service.validate_profile_data(profile_data, user_id)
    return validation_result


@router.post("/validate-public", response_model=AccountSettingValidationResponse)
async def validate_profile_data_public(
    profile_data: dict[str, Any],
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィールデータのバリデーション（認証不要）"""
    validation_result = await account_setting_service.validate_profile_data(profile_data, None)
    return validation_result


@router.get("/statistics")
async def get_profile_statistics(
    current_user: CurrentUser = Depends(require_admin),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィール統計情報を取得（管理者用）"""
    statistics = await account_setting_service.get_profile_statistics()
    return statistics


@router.get("/profile/student-id/{student_id}", response_model=AccountSettingProfileResponse)
async def get_profile_by_student_id(
    student_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """学籍番号でアカウント設定プロフィールを取得"""
    profile = await account_setting_service.get_profile_by_student_id(student_id)
    
    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return profile

