from __future__ import annotations

import logging
from typing import Any

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.protocols import (
    UserProfileRepositoryProtocol,
    DepartmentRepositoryProtocol,
    AccountSettingHistoryRepositoryProtocol,
)
from app.schemas.account_setting import (
    AccountSettingProfileCreate,
    AccountSettingProfileUpdate,
    AccountSettingUpdateRequest,
    AccountSettingValidationResponse,
    AccountSettingValidationError,
    DepartmentResponse,
    AccountSettingHistoryResponse,
    AccountSettingProfileResponse,
)

logger = logging.getLogger(__name__)


class AccountSettingService:
    """
    アカウント設定関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(
        self,
        user_profile_repository: UserProfileRepositoryProtocol,
        department_repository: DepartmentRepositoryProtocol,
        history_repository: AccountSettingHistoryRepositoryProtocol
    ):
        """
        Args:
            user_profile_repository: UserProfileRepositoryProtocolインスタンス
            department_repository: DepartmentRepositoryProtocolインスタンス
            history_repository: AccountSettingHistoryRepositoryProtocolインスタンス
        """
        self.user_profile_repo = user_profile_repository
        self.department_repo = department_repository
        self.history_repo = history_repository

    def get_profile_by_user_id(self, user_id: str) -> AccountSettingProfileResponse | None:
        """ユーザーIDでアカウント設定プロフィールを取得"""
        profile_data = self.user_profile_repo.get_profile_by_user_id(user_id)
        if not profile_data:
            return None

        # 学部情報を取得
        department_code = profile_data.get("department_code", "LIT")
        department_name = profile_data.get("department_name", "文学部")

        # 学部情報が取得できていない場合は、department_idから取得
        if not department_code or department_code == "LIT":
            department_id = profile_data.get("department_id")
            if department_id:
                department = self.department_repo.get_department_by_id(department_id)
                if department:
                    department_code = department.get("department_code", "LIT")
                    department_name = department.get("department_name", "文学部")

        # AccountSettingProfileResponseに変換
        return AccountSettingProfileResponse(
            id=profile_data["id"],
            user_id=profile_data["user_id"],
            student_id=profile_data["student_id"],
            first_name_kanji=profile_data["first_name_kanji"],
            first_name_katakana=profile_data["first_name_katakana"],
            last_name_kanji=profile_data["last_name_kanji"],
            last_name_katakana=profile_data["last_name_katakana"],
            year=profile_data["grade"],  # grade -> year
            department_code=department_code,
            department_name=department_name,
            email=profile_data.get("email", ""),
            avatar_url=profile_data["avatar_url"],
            preferences=profile_data["preferences"],
            created_at=profile_data["created_at"],
            updated_at=profile_data["updated_at"]
        )

    def get_profile_by_student_id(self, student_id: str) -> AccountSettingProfileResponse | None:
        """学籍番号でアカウント設定プロフィールを取得"""
        profile_data = self.user_profile_repo.get_profile_by_student_id(student_id)
        if not profile_data:
            return None

        # 学部情報を取得
        department_code = profile_data.get("department_code", "LIT")
        department_name = profile_data.get("department_name", "文学部")

        # 学部情報が取得できていない場合は、department_idから取得
        if not department_code or department_code == "LIT":
            department_id = profile_data.get("department_id")
            if department_id:
                department = self.department_repo.get_department_by_id(department_id)
                if department:
                    department_code = department.get("department_code", "LIT")
                    department_name = department.get("department_name", "文学部")

        # AccountSettingProfileResponseに変換
        return AccountSettingProfileResponse(
            id=profile_data["id"],
            user_id=profile_data["user_id"],
            student_id=profile_data["student_id"],
            first_name_kanji=profile_data["first_name_kanji"],
            first_name_katakana=profile_data["first_name_katakana"],
            last_name_kanji=profile_data["last_name_kanji"],
            last_name_katakana=profile_data["last_name_katakana"],
            year=profile_data["grade"],  # grade -> year
            department_code=department_code,
            department_name=department_name,
            email=profile_data.get("email", ""),
            avatar_url=profile_data["avatar_url"],
            preferences=profile_data["preferences"],
            created_at=profile_data["created_at"],
            updated_at=profile_data["updated_at"]
        )

    def create_profile(self, user_id: str, profile_data: AccountSettingProfileCreate) -> AccountSettingProfileResponse:
        """新しいアカウント設定プロフィールを作成"""
        logger.info(f"Creating account setting profile for user: {user_id}")

        # 学部の存在確認
        department = self.department_repo.get_department_by_code(profile_data.department_code)
        if not department:
            logger.warning(f"Invalid department code: {profile_data.department_code}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        # 学籍番号の重複チェック
        if self.user_profile_repo.check_student_id_exists(profile_data.student_id):
            logger.warning(f"Student ID already exists: {profile_data.student_id}")
            raise APIException(ErrorMessage.STUDENT_ID_ALREADY_EXISTS)

        # プロフィールデータを準備（フロントエンドフィールド名をDBフィールド名に変換）
        profile_dict = profile_data.dict()
        profile_dict["user_id"] = user_id
        profile_dict["department_id"] = department["id"]

        # フロントエンドフィールド名をDBフィールド名に変換
        if "year" in profile_dict:
            profile_dict["grade"] = profile_dict.pop("year")
        if "department_code" in profile_dict:
            profile_dict.pop("department_code")  # department_idに変換済みなので削除

        # データベースに存在しないフィールドを除外
        db_fields = ['id', 'user_id', 'student_id', 'first_name_kanji', 'first_name_katakana',
                    'last_name_kanji', 'last_name_katakana', 'grade', 'department_id', 'email',
                    'avatar_url', 'preferences', 'created_at', 'updated_at']
        profile_dict = {k: v for k, v in profile_dict.items() if k in db_fields}

        # リポジトリを通して作成
        created_profile_data = self.user_profile_repo.create_profile(profile_dict)
        logger.info(f"Account setting profile created successfully for user: {user_id}")

        # 学部情報を取得
        department_code = created_profile_data.get("department_code", "LIT")
        department_name = created_profile_data.get("department_name", "文学部")

        # 学部情報が取得できていない場合は、department_idから取得
        if not department_code or department_code == "LIT":
            department_id = created_profile_data.get("department_id")
            if department_id:
                department = self.department_repo.get_department_by_id(department_id)
                if department:
                    department_code = department.get("department_code", "LIT")
                    department_name = department.get("department_name", "文学部")

        # AccountSettingProfileResponseに変換
        return AccountSettingProfileResponse(
            id=created_profile_data["id"],
            user_id=created_profile_data["user_id"],
            student_id=created_profile_data["student_id"],
            first_name_kanji=created_profile_data["first_name_kanji"],
            first_name_katakana=created_profile_data["first_name_katakana"],
            last_name_kanji=created_profile_data["last_name_kanji"],
            last_name_katakana=created_profile_data["last_name_katakana"],
            year=created_profile_data["grade"],  # grade -> year
            department_code=department_code,
            department_name=department_name,
            email=created_profile_data.get("email", ""),
            avatar_url=created_profile_data["avatar_url"],
            preferences=created_profile_data["preferences"],
            created_at=created_profile_data["created_at"],
            updated_at=created_profile_data["updated_at"]
        )

    def update_profile(self, user_id: str, update_data: AccountSettingUpdateRequest) -> AccountSettingProfileResponse:
        """アカウント設定プロフィールを更新"""
        logger.info(f"Updating account setting profile for user: {user_id}")

        # 既存プロフィールの確認
        existing_profile = self.user_profile_repo.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Account setting profile not found for user: {user_id}")
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # 更新データの準備
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}

        if not update_dict:
            return existing_profile

        # 学部の更新がある場合、存在確認
        if "department_code" in update_dict:
            department = self.department_repo.get_department_by_code(update_dict["department_code"])
            if not department:
                logger.warning(f"Invalid department code: {update_dict['department_code']}")
                raise APIException(ErrorMessage.BAD_REQUEST)
            update_dict["department_id"] = department["id"]
            del update_dict["department_code"]  # department_idに変換済み

        # フロントエンドフィールド名をDBフィールド名に変換
        if "year" in update_dict:
            update_dict["grade"] = update_dict.pop("year")

        # メールアドレスの重複チェック（設定に従う）
        if "email" in update_dict:
            from app.core.config import settings
            if settings.ENABLE_EMAIL_DUPLICATE_CHECK:
                if self.user_profile_repo.check_email_exists(update_dict["email"], exclude_user_id=user_id):
                    logger.warning(f"Email already exists: {update_dict['email']}")
                    raise APIException(ErrorMessage.BAD_REQUEST)

        # リポジトリを通して更新
        updated_profile_data = self.user_profile_repo.update_profile(user_id, update_dict)
        if not updated_profile_data:
            logger.error(f"Failed to update profile for user: {user_id}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

        logger.info(f"Account setting profile updated successfully for user: {user_id}")

        # 学部情報を取得
        department_code = updated_profile_data.get("department_code", "LIT")
        department_name = updated_profile_data.get("department_name", "文学部")

        # 学部情報が取得できていない場合は、department_idから取得
        if not department_code or department_code == "LIT":
            department_id = updated_profile_data.get("department_id")
            if department_id:
                department = self.department_repo.get_department_by_id(department_id)
                if department:
                    department_code = department.get("department_code", "LIT")
                    department_name = department.get("department_name", "文学部")

        # AccountSettingProfileResponseに変換
        return AccountSettingProfileResponse(
            id=updated_profile_data["id"],
            user_id=updated_profile_data["user_id"],
            student_id=updated_profile_data["student_id"],
            first_name_kanji=updated_profile_data["first_name_kanji"],
            first_name_katakana=updated_profile_data["first_name_katakana"],
            last_name_kanji=updated_profile_data["last_name_kanji"],
            last_name_katakana=updated_profile_data["last_name_katakana"],
            year=updated_profile_data["grade"],  # grade -> year
            department_code=department_code,
            department_name=department_name,
            email=updated_profile_data.get("email", ""),
            avatar_url=updated_profile_data["avatar_url"],
            preferences=updated_profile_data["preferences"],
            created_at=updated_profile_data["created_at"],
            updated_at=updated_profile_data["updated_at"]
        )

    def delete_profile(self, user_id: str) -> bool:
        """アカウント設定プロフィールを削除"""
        logger.info(f"Deleting account setting profile for user: {user_id}")

        # 既存プロフィールの確認
        existing_profile = self.user_profile_repo.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Account setting profile not found for user: {user_id}")
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # リポジトリを通して削除
        result = self.user_profile_repo.delete_profile(user_id)
        logger.info(f"Account setting profile deleted successfully for user: {user_id}")
        return result

    def get_all_departments(self) -> list[DepartmentResponse]:
        """すべての学部を取得"""
        departments = self.department_repo.get_all_departments()
        return [DepartmentResponse(**department) for department in departments]

    def get_department_by_code(self, department_code: str) -> DepartmentResponse | None:
        """学部コードで学部を取得"""
        department = self.department_repo.get_department_by_code(department_code)
        return DepartmentResponse(**department) if department else None

    def get_profile_history(self, user_id: str, limit: int = 50) -> list[AccountSettingHistoryResponse]:
        """ユーザーのアカウント設定変更履歴を取得"""
        history = self.history_repo.get_history_by_user_id(user_id, limit)
        return [AccountSettingHistoryResponse(**record) for record in history]

    def get_field_history(self, user_id: str, field_name: str, limit: int = 20) -> list[AccountSettingHistoryResponse]:
        """特定フィールドの変更履歴を取得"""
        history = self.history_repo.get_history_by_field(user_id, field_name, limit)
        return [AccountSettingHistoryResponse(**record) for record in history]

    def validate_profile_data(self, profile_data: dict[str, Any], user_id: str | None = None) -> AccountSettingValidationResponse:
        """プロフィールデータのバリデーション"""
        errors = []
        warnings = []

        # 学籍番号のバリデーション
        if "student_id" in profile_data:
            student_id = profile_data["student_id"]
            if not student_id or len(student_id.strip()) == 0:
                errors.append(AccountSettingValidationError(
                    field="student_id",
                    message="学籍番号は必須です",
                    value=student_id
                ))
            elif len(student_id) < 5:
                errors.append(AccountSettingValidationError(
                    field="student_id",
                    message="学籍番号は5文字以上である必要があります",
                    value=student_id
                ))
            # 学籍番号の重複チェック
            elif self.user_profile_repo.check_student_id_exists(student_id, exclude_user_id=user_id):
                errors.append(AccountSettingValidationError(
                    field="student_id",
                    message="この学籍番号は既に使用されています",
                    value=student_id
                ))

        # メールアドレスのバリデーション（緩和版）
        if "email" in profile_data:
            email = profile_data["email"]
            if not email or len(email.strip()) == 0:
                errors.append(AccountSettingValidationError(
                    field="email",
                    message="メールアドレスは必須です",
                    value=email
                ))
            elif "@" not in email or "." not in email:
                errors.append(AccountSettingValidationError(
                    field="email",
                    message="有効なメールアドレスを入力してください",
                    value=email
                ))
            # メールアドレスの重複チェック（初回登録時は常にチェック、更新時は設定に従う）
            elif user_id is None:  # 初回登録時は常にチェック
                if self.user_profile_repo.check_email_exists(email):
                    errors.append(AccountSettingValidationError(
                        field="email",
                        message="このメールアドレスは既に使用されています",
                        value=email
                    ))

        # 学部のバリデーション
        if "department_code" in profile_data:
            department_code = profile_data["department_code"]
            if not department_code:
                errors.append(AccountSettingValidationError(
                    field="department_code",
                    message="学部は必須です",
                    value=department_code
                ))

        # 学年のバリデーション
        if "year" in profile_data:
            year = profile_data["year"]
            if year is not None and (year < 1 or year > 6):
                errors.append(AccountSettingValidationError(
                    field="year",
                    message="学年は1-6の範囲で入力してください",
                    value=str(year)
                ))

        # 名前のバリデーション
        name_fields = ["first_name_kanji", "last_name_kanji", "first_name_katakana", "last_name_katakana"]
        for field in name_fields:
            if field in profile_data:
                value = profile_data[field]
                if not value or len(value.strip()) == 0:
                    errors.append(AccountSettingValidationError(
                        field=field,
                        message=f"{field.replace('_', ' ').title()}は必須です",
                        value=value
                    ))

        return AccountSettingValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    def get_profile_statistics(self) -> dict[str, Any]:
        """プロフィール統計情報を取得"""
        total_count = self.user_profile_repo.get_profile_count()

        return {
            "total_profiles": total_count,
        }

    def _record_profile_changes(self, user_id: str, old_profile: dict[str, Any],
                                    new_data: dict[str, Any], change_reason: str | None = None) -> None:
        """プロフィール変更履歴を記録"""
        history_records = []

        for field, new_value in new_data.items():
            old_value = old_profile.get(field)
            if old_value != new_value:
                history_records.append({
                    "user_id": user_id,
                    "field_name": field,
                    "old_value": str(old_value) if old_value is not None else None,
                    "new_value": str(new_value) if new_value is not None else None,
                    "change_reason": change_reason
                })

        # 履歴レコードを一括作成
        for record in history_records:
            self.history_repo.create_history_record(record)
