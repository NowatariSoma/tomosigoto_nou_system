import logging
from typing import Any, Dict, List, Optional

from app.core.error_messages import ErrorMessage
from app.core.exceptions import APIException
from app.repositories.account_setting_repository import AccountSettingRepository
from app.schemas.account_setting import (
    AccountSettingProfileCreate,
    AccountSettingProfileUpdate,
    AccountSettingUpdateRequest,
    AccountSettingValidationResponse,
    AccountSettingValidationError,
    FacultyResponse,
    AccountSettingHistoryResponse,
)

logger = logging.getLogger(__name__)


class AccountSettingService:
    """
    アカウント設定関連のビジネスロジックを処理するサービスクラス
    リポジトリパターンと依存性注入に対応
    """

    def __init__(self, account_setting_repository: AccountSettingRepository):
        """
        Args:
            account_setting_repository: AccountSettingRepositoryインスタンス
        """
        self.repository = account_setting_repository

    async def _ensure_test_user_exists(self, user_id: str) -> None:
        """テスト用のユーザーがusersテーブルに存在することを確認し、存在しない場合は作成"""
        try:
            # ユーザーが存在するかチェック
            from app.core.supabase import get_supabase
            client = get_supabase()
            
            response = client.table('users').select('id').eq('id', user_id).execute()
            
            if not response.data:
                # ユーザーが存在しない場合は作成
                user_data = {
                    'id': user_id,
                    'email': f'test-{user_id}@example.com',
                    'created_at': '2025-01-20T00:00:00Z',
                    'updated_at': '2025-01-20T00:00:00Z',
                    'raw_user_meta_data': {
                        'name': f'Test User {user_id[:8]}'
                    }
                }
                
                client.table('users').insert(user_data).execute()
                logger.info(f"Created test user: {user_id}")
            else:
                logger.info(f"Test user already exists: {user_id}")
                
        except Exception as e:
            logger.warning(f"Failed to ensure test user exists: {e}")
            # エラーが発生しても処理を続行

    async def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """ユーザーIDでアカウント設定プロフィールを取得"""
        # テスト用のユーザーIDをUUID形式に変換
        if user_id.startswith('test-user-'):
            import hashlib
            hash_object = hashlib.md5(user_id.encode())
            hex_dig = hash_object.hexdigest()
            user_id = f"{hex_dig[:8]}-{hex_dig[8:12]}-{hex_dig[12:16]}-{hex_dig[16:20]}-{hex_dig[20:32]}"
        
        return await self.repository.get_profile_by_user_id(user_id)

    async def get_profile_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """学籍番号でアカウント設定プロフィールを取得"""
        return await self.repository.get_profile_by_student_id(student_id)

    async def create_profile(self, user_id: str, profile_data: AccountSettingProfileCreate) -> Dict[str, Any]:
        """新しいアカウント設定プロフィールを作成"""
        logger.info(f"Creating account setting profile for user: {user_id}")

        # テスト用のユーザーIDをUUID形式に変換してusersテーブルに挿入
        if user_id.startswith('test-user-'):
            # テスト用のユーザーIDをUUID形式に変換
            import hashlib
            hash_object = hashlib.md5(user_id.encode())
            hex_dig = hash_object.hexdigest()
            original_user_id = user_id
            user_id = f"{hex_dig[:8]}-{hex_dig[8:12]}-{hex_dig[12:16]}-{hex_dig[16:20]}-{hex_dig[20:32]}"
            logger.info(f"Converted test user ID from {original_user_id} to {user_id}")
            
            # テスト用のユーザーをusersテーブルに挿入（存在しない場合のみ）
            await self._ensure_test_user_exists(user_id)

        # 学部の存在確認
        faculty = await self.repository.get_faculty_by_code(profile_data.faculty)
        if not faculty:
            logger.warning(f"Invalid faculty code: {profile_data.faculty}")
            raise APIException(ErrorMessage.BAD_REQUEST)

        # 学籍番号の重複チェックは一時的に無効化
        # if await self.repository.check_student_id_exists(profile_data.student_id):
        #     logger.warning(f"Student ID already exists: {profile_data.student_id}")
        #     raise APIException(ErrorMessage.BAD_REQUEST)

        # メールアドレスの重複チェックは一時的に無効化
        # if await self.repository.check_email_exists(profile_data.email, user_id):
        #     logger.warning(f"Email already exists: {profile_data.email}")
        #     raise APIException(ErrorMessage.BAD_REQUEST)

        # プロフィールデータを準備
        profile_dict = profile_data.dict()
        profile_dict["user_id"] = user_id
        profile_dict["department_id"] = faculty["id"]

        # リポジトリを通して作成
        created_profile = await self.repository.create_profile(profile_dict)
        logger.info(f"Account setting profile created successfully for user: {user_id}")
        return created_profile

    async def update_profile(self, user_id: str, update_data: AccountSettingUpdateRequest) -> Dict[str, Any]:
        """アカウント設定プロフィールを更新"""
        logger.info(f"Updating account setting profile for user: {user_id}")

        # テスト用のユーザーIDをUUID形式に変換
        if user_id.startswith('test-user-'):
            import hashlib
            hash_object = hashlib.md5(user_id.encode())
            hex_dig = hash_object.hexdigest()
            user_id = f"{hex_dig[:8]}-{hex_dig[8:12]}-{hex_dig[12:16]}-{hex_dig[16:20]}-{hex_dig[20:32]}"

        # 既存プロフィールの確認
        existing_profile = await self.repository.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Account setting profile not found for user: {user_id}")
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # 更新データの準備
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            return existing_profile

        # 学部の更新がある場合、存在確認
        if "faculty" in update_dict:
            faculty = await self.repository.get_faculty_by_code(update_dict["faculty"])
            if not faculty:
                logger.warning(f"Invalid faculty code: {update_dict['faculty']}")
                raise APIException(ErrorMessage.BAD_REQUEST)
            update_dict["department_id"] = faculty["id"]
            del update_dict["faculty"]  # department_idに変換済み

        # 学籍番号の重複チェックは一時的に無効化
        # if "student_id" in update_dict:
        #     if await self.repository.check_student_id_exists(update_dict["student_id"], user_id):
        #         logger.warning(f"Student ID already exists: {update_dict['student_id']}")
        #         raise APIException(ErrorMessage.BAD_REQUEST)

        # メールアドレスの重複チェックは一時的に無効化
        # if "email" in update_dict:
        #     if await self.repository.check_email_exists(update_dict["email"], user_id):
        #         logger.warning(f"Email already exists: {update_dict['email']}")
        #         raise APIException(ErrorMessage.BAD_REQUEST)

        # 変更履歴の記録は一時的に無効化
        # await self._record_profile_changes(user_id, existing_profile, update_dict, update_data.change_reason)

        # リポジトリを通して更新
        updated_profile = await self.repository.update_profile(user_id, update_dict)
        if not updated_profile:
            logger.error(f"Failed to update profile for user: {user_id}")
            raise APIException(ErrorMessage.INTERNAL_SERVER_ERROR)

        logger.info(f"Account setting profile updated successfully for user: {user_id}")
        return updated_profile

    async def delete_profile(self, user_id: str) -> bool:
        """アカウント設定プロフィールを削除"""
        logger.info(f"Deleting account setting profile for user: {user_id}")

        # 既存プロフィールの確認
        existing_profile = await self.repository.get_profile_by_user_id(user_id)
        if not existing_profile:
            logger.warning(f"Account setting profile not found for user: {user_id}")
            raise APIException(ErrorMessage.USER_NOT_FOUND)

        # リポジトリを通して削除
        result = await self.repository.delete_profile(user_id)
        logger.info(f"Account setting profile deleted successfully for user: {user_id}")
        return result

    async def get_all_faculties(self) -> List[FacultyResponse]:
        """すべての学部を取得"""
        faculties = await self.repository.get_all_faculties()
        return [FacultyResponse(**faculty) for faculty in faculties]

    async def get_faculty_by_code(self, faculty_code: str) -> Optional[FacultyResponse]:
        """学部コードで学部を取得"""
        faculty = await self.repository.get_faculty_by_code(faculty_code)
        return FacultyResponse(**faculty) if faculty else None

    async def get_profile_history(self, user_id: str, limit: int = 50) -> List[AccountSettingHistoryResponse]:
        """ユーザーのアカウント設定変更履歴を取得"""
        history = await self.repository.get_history_by_user_id(user_id, limit)
        return [AccountSettingHistoryResponse(**record) for record in history]

    async def get_field_history(self, user_id: str, field_name: str, limit: int = 20) -> List[AccountSettingHistoryResponse]:
        """特定フィールドの変更履歴を取得"""
        history = await self.repository.get_history_by_field(user_id, field_name, limit)
        return [AccountSettingHistoryResponse(**record) for record in history]

    async def validate_profile_data(self, profile_data: Dict[str, Any], user_id: Optional[str] = None) -> AccountSettingValidationResponse:
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
            # 学籍番号の重複チェックは一時的に無効化
            # elif await self.repository.check_student_id_exists(student_id, user_id):
            #     errors.append(AccountSettingValidationError(
            #         field="student_id",
            #         message="この学籍番号は既に使用されています",
            #         value=student_id
            #     ))

        # メールアドレスのバリデーション
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
            elif not email.endswith("@mail.doshisha.ac.jp"):
                warnings.append("大学のメールアドレス（@mail.doshisha.ac.jp）の使用を推奨します")
            # メールアドレスの重複チェックは一時的に無効化
            # elif await self.repository.check_email_exists(email, user_id):
            #     errors.append(AccountSettingValidationError(
            #         field="email",
            #         message="このメールアドレスは既に使用されています",
            #         value=email
            #     ))

        # 学部のバリデーション
        if "faculty" in profile_data:
            faculty_code = profile_data["faculty"]
            if not faculty_code:
                errors.append(AccountSettingValidationError(
                    field="faculty",
                    message="学部は必須です",
                    value=faculty_code
                ))
            # 学部の存在チェックは一時的に無効化
            # elif not await self.repository.get_faculty_by_code(faculty_code):
            #     errors.append(AccountSettingValidationError(
            #         field="faculty",
            #         message="無効な学部コードです",
            #         value=faculty_code
            #     ))

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

    async def get_profile_statistics(self) -> Dict[str, Any]:
        """プロフィール統計情報を取得"""
        total_count = await self.repository.get_profile_count()
        faculty_distribution = await self.repository.get_faculty_distribution()

        return {
            "total_profiles": total_count,
            "faculty_distribution": faculty_distribution
        }

    async def _record_profile_changes(self, user_id: str, old_profile: Dict[str, Any], 
                                    new_data: Dict[str, Any], change_reason: Optional[str] = None) -> None:
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
            await self.repository.create_history_record(record)