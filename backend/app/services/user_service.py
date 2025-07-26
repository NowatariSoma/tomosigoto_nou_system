import logging
from typing import List, Optional
from uuid import UUID

from app.repositories.user_repository import UserRepository
from app.repositories.department_repository import DepartmentRepository
from app.schemas.user_schemas import UserCreate, UserResponse, ProfileResponse, RoleResponse, DepartmentResponse
from app.models.user import User, UserProfile, UserRole
from app.models.department import Department

logger = logging.getLogger(__name__)


class UserService:
    """ユーザー関連のビジネスロジックを実装するサービス"""
    
    def __init__(self, user_repository: UserRepository, department_repository: DepartmentRepository, auth_service=None):
        """コンストラクタ"""
        self._user_repository = user_repository
        self._department_repository = department_repository
        self._auth_service = auth_service
        self._logger = logger
    
    def register_user(self, user_data: UserCreate) -> UserResponse:
        """ユーザー登録"""
        try:
            # メールアドレスの重複チェック
            existing_user = self._user_repository.get_by_email(user_data.email)
            if existing_user:
                raise ValueError(f"メールアドレス {user_data.email} は既に使用されています")
            
            # 学籍番号の重複チェック
            existing_profile = self._user_repository.get_by_student_id(user_data.student_id)
            if existing_profile:
                raise ValueError(f"学籍番号 {user_data.student_id} は既に使用されています")
            
            # 学部の存在確認
            department = self._department_repository.get_by_id(user_data.department_id)
            if not department:
                raise ValueError(f"学部ID {user_data.department_id} が見つかりません")
            
            # ユーザー作成
            user = self._user_repository.create({
                "email": str(user_data.email),
                "auth_provider": "email",
                "is_active": True,
                "email_verified": False
            })
            
            # プロフィール作成
            from uuid import uuid4
            from datetime import datetime
            now = datetime.now()
            
            profile_data = {
                "id": str(uuid4()),
                "user_id": str(user.id),
                "student_id": user_data.student_id,
                "first_name_kanji": user_data.first_name_kanji,
                "first_name_katakana": user_data.first_name_katakana,
                "last_name_kanji": user_data.last_name_kanji,
                "last_name_katakana": user_data.last_name_katakana,
                "grade": user_data.grade,
                "department_id": str(user_data.department_id),
                "avatar_url": None,
                "preferences": {},
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            # プロフィールを作成（実際の実装ではリポジトリメソッドを追加）
            profile = self._user_repository._dict_to_profile(profile_data)
            
            # ロール作成
            role_data = {
                "id": str(uuid4()),
                "user_id": str(user.id),
                "role_type": user_data.role_type,
                "is_visible_to_general": user_data.role_type != "system_admin",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
            
            role = self._user_repository._dict_to_role(role_data)
            
            # レスポンス作成
            return self._build_user_response(user, profile, role, department)
            
        except Exception as e:
            self._logger.error(f"Error registering user: {str(e)}")
            raise
    
    def get_user_by_id(self, user_id: UUID, requester_role: str = 'general') -> Optional[UserResponse]:
        """ユーザー取得（権限考慮）"""
        try:
            user = self._user_repository.get_by_id(user_id)
            if not user:
                return None
            
            profile = self._user_repository.get_profile(user_id)
            role = self._user_repository.get_user_role(user_id)
            
            # 権限チェック
            if role and role.role_type == "system_admin" and requester_role == "general":
                # 一般ユーザーからはシステム管理者は見えない
                if not role.is_visible_to_general:
                    return None
            
            department = None
            if profile:
                department = self._department_repository.get_by_id(profile.department_id)
            
            return self._build_user_response(user, profile, role, department)
            
        except Exception as e:
            self._logger.error(f"Error getting user by id {user_id}: {str(e)}")
            return None
    
    def get_user_by_student_id(self, student_id: str) -> Optional[UserResponse]:
        """学籍番号でユーザー取得"""
        try:
            profile = self._user_repository.get_by_student_id(student_id)
            if not profile:
                return None
            
            return self.get_user_by_id(profile.user_id)
            
        except Exception as e:
            self._logger.error(f"Error getting user by student_id {student_id}: {str(e)}")
            return None
    
    def update_user_profile(self, user_id: UUID, profile_data: dict) -> ProfileResponse:
        """プロフィール更新"""
        try:
            profile = self._user_repository.update_profile(user_id, profile_data)
            department = self._department_repository.get_by_id(profile.department_id)
            
            return self._build_profile_response(profile, department)
            
        except Exception as e:
            self._logger.error(f"Error updating profile for user {user_id}: {str(e)}")
            raise
    
    def get_users_by_grade(self, grade: int) -> List[UserResponse]:
        """学年別ユーザー取得"""
        try:
            # 実際の実装ではより効率的なクエリを使用
            # ここではシンプルな実装
            users = []
            # TODO: 学年でフィルタするクエリを実装
            return users
            
        except Exception as e:
            self._logger.error(f"Error getting users by grade {grade}: {str(e)}")
            return []
    
    def get_users_by_department(self, department_id: UUID) -> List[UserResponse]:
        """学部別ユーザー取得"""
        try:
            # 実際の実装ではより効率的なクエリを使用
            users = []
            # TODO: 学部でフィルタするクエリを実装
            return users
            
        except Exception as e:
            self._logger.error(f"Error getting users by department {department_id}: {str(e)}")
            return []
    
    def get_club_members(self, include_system_admin: bool = False) -> List[UserResponse]:
        """部員一覧取得"""
        try:
            all_users = []
            roles = ['club_admin', 'senior', 'general']
            
            if include_system_admin:
                roles.append('system_admin')
            
            for role_type in roles:
                users = self._user_repository.get_users_by_role(role_type, include_hidden=include_system_admin)
                for user in users:
                    user_response = self.get_user_by_id(user.id)
                    if user_response:
                        all_users.append(user_response)
            
            return all_users
            
        except Exception as e:
            self._logger.error(f"Error getting club members: {str(e)}")
            return []
    
    def update_user_role(self, user_id: UUID, new_role: str, requester_role: str) -> bool:
        """ロール更新"""
        try:
            # 権限チェック
            if requester_role not in ['system_admin', 'club_admin']:
                raise ValueError("ロール更新権限がありません")
            
            # system_adminロールの変更はsystem_adminのみ可能
            if new_role == 'system_admin' and requester_role != 'system_admin':
                raise ValueError("システム管理者ロールの設定権限がありません")
            
            self._user_repository.update_user_role(user_id, new_role)
            return True
            
        except Exception as e:
            self._logger.error(f"Error updating user role {user_id}: {str(e)}")
            raise
    
    def validate_student_id_uniqueness(self, student_id: str, exclude_user_id: Optional[UUID] = None) -> bool:
        """学籍番号重複チェック"""
        try:
            existing_profile = self._user_repository.get_by_student_id(student_id)
            if not existing_profile:
                return True
            
            if exclude_user_id and existing_profile.user_id == exclude_user_id:
                return True
            
            return False
            
        except Exception as e:
            self._logger.error(f"Error validating student_id uniqueness {student_id}: {str(e)}")
            return False
    
    def deactivate_user(self, user_id: UUID) -> bool:
        """ユーザー無効化"""
        try:
            self._user_repository.update(user_id, {"is_active": False})
            return True
            
        except Exception as e:
            self._logger.error(f"Error deactivating user {user_id}: {str(e)}")
            return False
    
    def reactivate_user(self, user_id: UUID) -> bool:
        """ユーザー再有効化"""
        try:
            self._user_repository.update(user_id, {"is_active": True})
            return True
            
        except Exception as e:
            self._logger.error(f"Error reactivating user {user_id}: {str(e)}")
            return False
    
    def _build_user_response(self, user: User, profile: Optional[UserProfile], role: Optional[UserRole], department: Optional[Department]) -> UserResponse:
        """UserResponseを構築"""
        profile_response = None
        if profile and department:
            profile_response = self._build_profile_response(profile, department)
        
        role_response = None
        if role:
            role_response = RoleResponse(
                role_type=role.role_type,
                role_display_name=role.role_display_name(),
                is_visible_to_general=role.is_visible_to_general
            )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            email_verified=user.email_verified,
            created_at=user.created_at,
            profile=profile_response,
            role=role_response
        )
    
    def _build_profile_response(self, profile: UserProfile, department: Department) -> ProfileResponse:
        """ProfileResponseを構築"""
        department_response = DepartmentResponse(
            id=department.id,
            department_name=department.department_name,
            campus=department.campus,
            full_display_name=department.full_display_name()
        )
        
        return ProfileResponse(
            student_id=profile.student_id,
            full_name_kanji=profile.full_name_kanji(),
            full_name_katakana=profile.full_name_katakana(),
            grade=profile.grade,
            grade_display=profile.grade_display(),
            avatar_url=profile.avatar_url,
            department=department_response
        )