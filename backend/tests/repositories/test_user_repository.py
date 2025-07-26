import unittest
from unittest.mock import Mock, patch, AsyncMock
import pytest
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, List, Optional

from app.repositories.user_repository import UserRepository
from app.models.user import User, UserProfile, UserRole
from app.models.department import Department


class TestUserRepository(unittest.TestCase):
    """ユーザーリポジトリのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.mock_db_client = Mock()
        self.repository = UserRepository(self.mock_db_client)
        
        self.sample_user_id = uuid4()
        self.sample_department_id = uuid4()
        
        self.sample_user_data = {
            "id": str(self.sample_user_id),
            "email": "test@example.com",
            "auth_provider": "email",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "last_login": None,
            "is_active": True,
            "email_verified": True
        }
        
        self.sample_profile_data = {
            "id": str(uuid4()),
            "user_id": str(self.sample_user_id),
            "student_id": "20251001",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "山田",
            "last_name_katakana": "ヤマダ",
            "grade": 3,
            "department_id": str(self.sample_department_id),
            "avatar_url": None,
            "preferences": {"theme": "light"},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        self.sample_role_data = {
            "id": str(uuid4()),
            "user_id": str(self.sample_user_id),
            "role_type": "general",
            "is_visible_to_general": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    def tearDown(self):
        """テスト後処理"""
        pass
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_by_id(self):
        """ID取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_user_data]
        
        result = self.repository.get_by_id(self.sample_user_id)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, User)
        self.assertEqual(result.email, "test@example.com")
        self.assertEqual(str(result.id), str(self.sample_user_id))
        
        # クエリが正しく呼ばれているか確認
        self.repository._execute_query.assert_called_once()
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_by_id_not_found(self):
        """ID取得（見つからない）テスト"""
        # モックの戻り値を空に設定
        self.repository._execute_query.return_value = []
        
        result = self.repository.get_by_id(uuid4())
        
        self.assertIsNone(result)
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_by_email(self):
        """メール取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_user_data]
        
        result = self.repository.get_by_email("test@example.com")
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, User)
        self.assertEqual(result.email, "test@example.com")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_by_student_id(self):
        """学籍番号取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_profile_data]
        
        result = self.repository.get_by_student_id("20251001")
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserProfile)
        self.assertEqual(result.student_id, "20251001")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_create_user(self):
        """ユーザー作成テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_user_data]
        
        user_data = {
            "email": "test@example.com",
            "auth_provider": "email",
            "is_active": True,
            "email_verified": True
        }
        
        result = self.repository.create(user_data)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, User)
        self.assertEqual(result.email, "test@example.com")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_update_user(self):
        """ユーザー更新テスト"""
        # 更新後のデータ
        updated_data = self.sample_user_data.copy()
        updated_data["email"] = "updated@example.com"
        
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [updated_data]
        
        update_data = {"email": "updated@example.com"}
        
        result = self.repository.update(self.sample_user_id, update_data)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, User)
        self.assertEqual(result.email, "updated@example.com")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_delete_user(self):
        """ユーザー削除テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = []
        
        result = self.repository.delete(self.sample_user_id)
        
        self.assertTrue(result)
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_profile(self):
        """プロフィール取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_profile_data]
        
        result = self.repository.get_profile(self.sample_user_id)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserProfile)
        self.assertEqual(result.student_id, "20251001")
        self.assertEqual(str(result.user_id), str(self.sample_user_id))
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_update_profile(self):
        """プロフィール更新テスト"""
        # 更新後のデータ
        updated_profile = self.sample_profile_data.copy()
        updated_profile["first_name_kanji"] = "次郎"
        
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [updated_profile]
        
        profile_data = {"first_name_kanji": "次郎"}
        
        result = self.repository.update_profile(self.sample_user_id, profile_data)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserProfile)
        self.assertEqual(result.first_name_kanji, "次郎")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_user_role(self):
        """ユーザーロール取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_role_data]
        
        result = self.repository.get_user_role(self.sample_user_id)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserRole)
        self.assertEqual(result.role_type, "general")
        self.assertEqual(str(result.user_id), str(self.sample_user_id))
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_update_user_role(self):
        """ロール更新テスト"""
        # 更新後のデータ
        updated_role = self.sample_role_data.copy()
        updated_role["role_type"] = "senior"
        
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [updated_role]
        
        result = self.repository.update_user_role(self.sample_user_id, "senior")
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, UserRole)
        self.assertEqual(result.role_type, "senior")
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_get_users_by_role(self):
        """ロール別ユーザー取得テスト"""
        # モックの戻り値を設定（複数ユーザー）
        user_data_2 = self.sample_user_data.copy()
        user_data_2["id"] = str(uuid4())
        user_data_2["email"] = "test2@example.com"
        
        self.repository._execute_query.return_value = [
            self.sample_user_data,
            user_data_2
        ]
        
        result = self.repository.get_users_by_role("general", include_hidden=False)
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        self.assertIsInstance(result[0], User)
        self.assertIsInstance(result[1], User)
    
    @patch('app.repositories.user_repository.UserRepository._execute_query')
    def test_role_visibility(self):
        """ロール表示制御テスト"""
        # システム管理者（非表示）のデータ
        admin_data = self.sample_user_data.copy()
        admin_data["id"] = str(uuid4())
        admin_data["email"] = "admin@example.com"
        
        # include_hidden=False の場合、システム管理者は含まれない
        self.repository._execute_query.return_value = [self.sample_user_data]
        
        result = self.repository.get_users_by_role("general", include_hidden=False)
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].email, "test@example.com")
        
        # include_hidden=True の場合、システム管理者も含まれる
        self.repository._execute_query.return_value = [
            self.sample_user_data,
            admin_data
        ]
        
        result = self.repository.get_users_by_role("system_admin", include_hidden=True)
        
        self.assertEqual(len(result), 2)


if __name__ == "__main__":
    unittest.main()