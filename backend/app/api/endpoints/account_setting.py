"""
アカウント設定関連のAPIエンドポイント
"""
from typing import Any, Dict, List, Optional

from app.api.deps import get_current_user, get_account_setting_service
from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.schemas.account_setting import (
    AccountSettingProfileCreate,
    AccountSettingProfileResponse,
    AccountSettingProfileUpdate,
    AccountSettingUpdateRequest,
    AccountSettingValidationResponse,
    DepartmentResponse,
)
from app.services.account_setting_service import AccountSettingService
from fastapi import APIRouter, Depends, HTTPException, status, Query

router = APIRouter()


@router.get("/profile", response_model=AccountSettingProfileResponse)
async def get_current_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを取得"""
    user_id = current_user["id"]
    print(f"Getting profile for user_id: {user_id}")
    profile = await account_setting_service.get_profile_by_user_id(user_id)
    
    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return profile


@router.get("/profile-public", response_model=AccountSettingProfileResponse)
async def get_public_profile(
    user_id: str = Query(..., description="ユーザーID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    current_user: Dict[str, Any] = Depends(get_current_user),
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
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを作成"""
    user_id = current_user["id"]
    
    # 既存プロフィールの確認
    existing_profile = await account_setting_service.get_profile_by_user_id(user_id)
    if existing_profile:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    # バリデーション（Pydantic v2対応: model_dump()を使用）
    validation_result = await account_setting_service.validate_profile_data(profile_data.model_dump(exclude_unset=True), user_id)
    if not validation_result.is_valid:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    profile = await account_setting_service.create_profile(user_id, profile_data)
    return profile


@router.post("/profile-public", response_model=AccountSettingProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_public_profile(
    profile_data: AccountSettingProfileCreate,
    user_id: str = Query(..., description="ユーザーID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
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
        # エラーが発生した場合はログを出力してエラーを再発生
        print(f"Error creating profile: {e}")
        import traceback
        traceback.print_exc()
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)


@router.put("/profile", response_model=AccountSettingProfileResponse)
async def update_user_profile(
    update_data: AccountSettingUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを更新"""
    user_id = current_user["id"]
    
    # 更新データから None 値を除外（Pydantic v2対応: model_dump()を使用）
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    
    if not update_dict:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    # バリデーション
    validation_result = await account_setting_service.validate_profile_data(update_dict, user_id)
    if not validation_result.is_valid:
        raise APIException(ErrorMessage.BAD_REQUEST)
    
    profile = await account_setting_service.update_profile(user_id, update_data)
    return profile


@router.put("/profile-public", response_model=AccountSettingProfileResponse)
async def update_public_profile(
    update_data: AccountSettingUpdateRequest,
    user_id: str = Query(..., description="ユーザーID"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """認証不要でプロフィールを更新（テスト用）"""
    try:
        # 更新データから None 値を除外（Pydantic v2対応: model_dump()を使用）
        update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
        
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
        # エラーが発生した場合はログを出力してエラーを再発生
        print(f"Error updating profile: {e}")
        import traceback
        traceback.print_exc()
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)


@router.delete("/profile")
async def delete_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """現在認証されているユーザーのアカウント設定プロフィールを削除"""
    user_id = current_user["id"]
    
    result = await account_setting_service.delete_profile(user_id)
    if not result:
        raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)
    
    return {"message": "Profile deleted successfully"}


@router.get("/departments", response_model=List[DepartmentResponse])
async def get_all_departments(
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """すべての学部を取得"""
    departments = await account_setting_service.get_all_departments()
    return departments


@router.get("/departments/{department_code}", response_model=DepartmentResponse)
async def get_department_by_code(
    department_code: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """学部コードで学部を取得"""
    department = await account_setting_service.get_department_by_code(department_code)
    
    if not department:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return department


@router.post("/validate", response_model=AccountSettingValidationResponse)
async def validate_profile_data(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィールデータのバリデーション"""
    user_id = current_user["id"]
    validation_result = await account_setting_service.validate_profile_data(profile_data, user_id)
    return validation_result


@router.post("/validate-public", response_model=AccountSettingValidationResponse)
async def validate_profile_data_public(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィールデータのバリデーション（認証不要）"""
    validation_result = await account_setting_service.validate_profile_data(profile_data, None)
    return validation_result


@router.get("/statistics")
async def get_profile_statistics(
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """プロフィール統計情報を取得（管理者用）"""
    statistics = await account_setting_service.get_profile_statistics()
    return statistics


@router.get("/profile/student-id/{student_id}", response_model=AccountSettingProfileResponse)
async def get_profile_by_student_id(
    student_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    account_setting_service: AccountSettingService = Depends(get_account_setting_service),
):
    """学籍番号でアカウント設定プロフィールを取得"""
    profile = await account_setting_service.get_profile_by_student_id(student_id)
    
    if not profile:
        raise APIException(ErrorMessage.USER_NOT_FOUND)
    
    return profile

