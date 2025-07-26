import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.user import User, UserProfile, UserRole

logger = logging.getLogger(__name__)


class UserRepository:
    """ユーザーデータにアクセスするリポジトリクラス"""
    
    def __init__(self, db_client):
        """コンストラクタ"""
        self._db_client = db_client
        self._logger = logger
    
    def _execute_query(self, query: str, table: str = 'users', params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """クエリを実行するヘルパーメソッド"""
        try:
            # Supabaseクライアントを使用してクエリを実行
            if hasattr(self._db_client, 'table'):
                # Supabaseの場合
                result = self._db_client.table(table).select('*')
                
                if params:
                    for key, value in params.items():
                        result = result.eq(key, value)
                
                response = result.execute()
                return response.data if response.data else []
            else:
                # 直接SQLを実行する場合（モック等）
                return []
        except Exception as e:
            self._logger.error(f"Database query error: {str(e)}")
            return []
    
    def _dict_to_user(self, data: Dict[str, Any]) -> User:
        """辞書データをUserモデルに変換"""
        return User(
            id=UUID(data['id']) if isinstance(data['id'], str) else data['id'],
            email=data['email'],
            auth_provider=data['auth_provider'],
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at'],
            last_login=datetime.fromisoformat(data['last_login']) if data.get('last_login') and isinstance(data['last_login'], str) else data.get('last_login'),
            is_active=data['is_active'],
            email_verified=data['email_verified']
        )
    
    def _dict_to_profile(self, data: Dict[str, Any]) -> UserProfile:
        """辞書データをUserProfileモデルに変換"""
        return UserProfile(
            id=UUID(data['id']) if isinstance(data['id'], str) else data['id'],
            user_id=UUID(data['user_id']) if isinstance(data['user_id'], str) else data['user_id'],
            student_id=data['student_id'],
            first_name_kanji=data['first_name_kanji'],
            first_name_katakana=data['first_name_katakana'],
            last_name_kanji=data['last_name_kanji'],
            last_name_katakana=data['last_name_katakana'],
            grade=data['grade'],
            department_id=UUID(data['department_id']) if isinstance(data['department_id'], str) else data['department_id'],
            avatar_url=data.get('avatar_url'),
            preferences=data.get('preferences', {}),
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at']
        )
    
    def _dict_to_role(self, data: Dict[str, Any]) -> UserRole:
        """辞書データをUserRoleモデルに変換"""
        return UserRole(
            id=UUID(data['id']) if isinstance(data['id'], str) else data['id'],
            user_id=UUID(data['user_id']) if isinstance(data['user_id'], str) else data['user_id'],
            role_type=data['role_type'],
            is_visible_to_general=data['is_visible_to_general'],
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at']
        )
    
    def get_by_id(self, user_id: UUID) -> Optional[User]:
        """IDでユーザーを取得"""
        try:
            data = self._execute_query("SELECT * FROM users WHERE id = %s", 'users', {'id': str(user_id)})
            if data:
                return self._dict_to_user(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting user by id {user_id}: {str(e)}")
            return None
    
    def get_by_email(self, email: str) -> Optional[User]:
        """メールでユーザーを取得"""
        try:
            data = self._execute_query("SELECT * FROM users WHERE email = %s", 'users', {'email': email})
            if data:
                return self._dict_to_user(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting user by email {email}: {str(e)}")
            return None
    
    def get_by_student_id(self, student_id: str) -> Optional[UserProfile]:
        """学籍番号でプロフィール取得"""
        try:
            data = self._execute_query("SELECT * FROM user_profiles WHERE student_id = %s", 'user_profiles', {'student_id': student_id})
            if data:
                return self._dict_to_profile(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting user by student_id {student_id}: {str(e)}")
            return None
    
    def create(self, user_data: Dict[str, Any]) -> User:
        """ユーザーを作成"""
        try:
            from uuid import uuid4
            new_id = uuid4()
            now = datetime.now()
            
            create_data = {
                'id': str(new_id),
                'email': user_data['email'],
                'auth_provider': user_data.get('auth_provider', 'email'),
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
                'last_login': None,
                'is_active': user_data.get('is_active', True),
                'email_verified': user_data.get('email_verified', False)
            }
            
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('users').insert(create_data).execute()
                if response.data:
                    return self._dict_to_user(response.data[0])
            
            return self._dict_to_user(create_data)
        except Exception as e:
            self._logger.error(f"Error creating user: {str(e)}")
            raise
    
    def update(self, user_id: UUID, update_data: Dict[str, Any]) -> User:
        """ユーザーを更新"""
        try:
            now = datetime.now()
            update_data['updated_at'] = now.isoformat()
            
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('users').update(update_data).eq('id', str(user_id)).execute()
                if response.data:
                    return self._dict_to_user(response.data[0])
            
            # フォールバック
            current = self.get_by_id(user_id)
            if current:
                updated_dict = current.to_dict()
                updated_dict.update(update_data)
                return self._dict_to_user(updated_dict)
            raise ValueError(f"User {user_id} not found")
        except Exception as e:
            self._logger.error(f"Error updating user {user_id}: {str(e)}")
            raise
    
    def delete(self, user_id: UUID) -> bool:
        """ユーザーを削除"""
        try:
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('users').delete().eq('id', str(user_id)).execute()
                return True
            
            return True
        except Exception as e:
            self._logger.error(f"Error deleting user {user_id}: {str(e)}")
            return False
    
    def get_profile(self, user_id: UUID) -> Optional[UserProfile]:
        """プロフィールを取得"""
        try:
            data = self._execute_query("SELECT * FROM user_profiles WHERE user_id = %s", 'user_profiles', {'user_id': str(user_id)})
            if data:
                return self._dict_to_profile(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting profile for user {user_id}: {str(e)}")
            return None
    
    def update_profile(self, user_id: UUID, profile_data: Dict[str, Any]) -> UserProfile:
        """プロフィール更新"""
        try:
            now = datetime.now()
            profile_data['updated_at'] = now.isoformat()
            
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('user_profiles').update(profile_data).eq('user_id', str(user_id)).execute()
                if response.data:
                    return self._dict_to_profile(response.data[0])
            
            # フォールバック
            current = self.get_profile(user_id)
            if current:
                updated_dict = current.to_dict()
                updated_dict.update(profile_data)
                return self._dict_to_profile(updated_dict)
            raise ValueError(f"Profile for user {user_id} not found")
        except Exception as e:
            self._logger.error(f"Error updating profile for user {user_id}: {str(e)}")
            raise
    
    def get_user_role(self, user_id: UUID) -> Optional[UserRole]:
        """ユーザーロール取得"""
        try:
            data = self._execute_query("SELECT * FROM user_roles WHERE user_id = %s", 'user_roles', {'user_id': str(user_id)})
            if data:
                return self._dict_to_role(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting role for user {user_id}: {str(e)}")
            return None
    
    def update_user_role(self, user_id: UUID, role_type: str) -> UserRole:
        """ロール更新"""
        try:
            now = datetime.now()
            role_data = {
                'role_type': role_type,
                'updated_at': now.isoformat()
            }
            
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('user_roles').update(role_data).eq('user_id', str(user_id)).execute()
                if response.data:
                    return self._dict_to_role(response.data[0])
            
            # フォールバック
            current = self.get_user_role(user_id)
            if current:
                updated_dict = current.to_dict()
                updated_dict.update(role_data)
                return self._dict_to_role(updated_dict)
            raise ValueError(f"Role for user {user_id} not found")
        except Exception as e:
            self._logger.error(f"Error updating role for user {user_id}: {str(e)}")
            raise
    
    def get_users_by_role(self, role_type: str, include_hidden: bool = False) -> List[User]:
        """ロール別ユーザー取得"""
        try:
            # JOINクエリをシミュレート
            # 実際の実装では適切なJOINクエリを使用
            role_data = self._execute_query("SELECT * FROM user_roles WHERE role_type = %s", 'user_roles', {'role_type': role_type})
            
            if not include_hidden:
                role_data = [r for r in role_data if r.get('is_visible_to_general', True)]
            
            users = []
            for role in role_data:
                user = self.get_by_id(UUID(role['user_id']))
                if user:
                    users.append(user)
            
            return users
        except Exception as e:
            self._logger.error(f"Error getting users by role {role_type}: {str(e)}")
            return []