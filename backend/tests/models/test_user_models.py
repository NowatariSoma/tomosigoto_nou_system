import unittest
import pytest
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, Any

from app.models.user import User, UserProfile, UserRole
from app.models.department import Department


class TestUserModel(unittest.TestCase):
    """ユーザーモデルのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.sample_user_data = {
            "id": uuid4(),
            "email": "test@example.com",
            "auth_provider": "email",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "last_login": None,
            "is_active": True,
            "email_verified": True
        }
    
    def test_create_user(self):
        """ユーザー作成テスト"""
        user = User(**self.sample_user_data)
        
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.auth_provider, "email")
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertIsInstance(user.id, UUID)
    
    def test_email_validation(self):
        """メールアドレス検証テスト"""
        # 無効なメールアドレスでエラーが発生することを確認
        invalid_data = self.sample_user_data.copy()
        invalid_data["email"] = "invalid-email"
        
        with self.assertRaises(ValueError):
            User(**invalid_data)
    
    def test_to_dict(self):
        """辞書変換テスト"""
        user = User(**self.sample_user_data)
        user_dict = user.to_dict()
        
        self.assertIsInstance(user_dict, dict)
        self.assertEqual(user_dict["email"], "test@example.com")
        self.assertEqual(user_dict["auth_provider"], "email")


class TestUserProfileModel(unittest.TestCase):
    """ユーザープロフィールモデルのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.sample_profile_data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "student_id": "20251001",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "山田",
            "last_name_katakana": "ヤマダ",
            "grade": 3,
            "department_id": uuid4(),
            "avatar_url": None,
            "preferences": {"theme": "light"},
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_profile(self):
        """プロフィール作成テスト"""
        profile = UserProfile(**self.sample_profile_data)
        
        self.assertEqual(profile.student_id, "20251001")
        self.assertEqual(profile.first_name_kanji, "太郎")
        self.assertEqual(profile.grade, 3)
        self.assertIsInstance(profile.id, UUID)
        self.assertIsInstance(profile.user_id, UUID)
    
    def test_full_name_methods(self):
        """フルネーム取得テスト"""
        profile = UserProfile(**self.sample_profile_data)
        
        self.assertEqual(profile.full_name_kanji(), "山田 太郎")
        self.assertEqual(profile.full_name_katakana(), "ヤマダ タロウ")
    
    def test_grade_display(self):
        """学年表示テスト"""
        profile = UserProfile(**self.sample_profile_data)
        
        self.assertEqual(profile.grade_display(), "3回生")
        
        # 4回生の場合
        profile.grade = 4
        self.assertEqual(profile.grade_display(), "4回生")
        
        # 1回生の場合
        profile.grade = 1
        self.assertEqual(profile.grade_display(), "1回生")
    
    def test_student_id_validation(self):
        """学籍番号検証テスト"""
        # 8桁の学籍番号は有効
        profile = UserProfile(**self.sample_profile_data)
        self.assertEqual(profile.student_id, "20251001")
        
        # 無効な学籍番号の場合
        invalid_data = self.sample_profile_data.copy()
        invalid_data["student_id"] = "123"  # 短すぎる
        
        with self.assertRaises(ValueError):
            UserProfile(**invalid_data)
    
    def test_katakana_validation(self):
        """カタカナ検証テスト"""
        # 有効なカタカナ
        profile = UserProfile(**self.sample_profile_data)
        self.assertEqual(profile.first_name_katakana, "タロウ")
        
        # 無効なカタカナ（ひらがな混入）
        invalid_data = self.sample_profile_data.copy()
        invalid_data["first_name_katakana"] = "たろう"  # ひらがな
        
        with self.assertRaises(ValueError):
            UserProfile(**invalid_data)


class TestUserRoleModel(unittest.TestCase):
    """ユーザーロールモデルのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.sample_role_data = {
            "id": uuid4(),
            "user_id": uuid4(),
            "role_type": "general",
            "is_visible_to_general": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_role(self):
        """ロール作成テスト"""
        role = UserRole(**self.sample_role_data)
        
        self.assertEqual(role.role_type, "general")
        self.assertTrue(role.is_visible_to_general)
        self.assertIsInstance(role.id, UUID)
        self.assertIsInstance(role.user_id, UUID)
    
    def test_admin_permissions(self):
        """管理者権限テスト"""
        # システム管理者
        admin_data = self.sample_role_data.copy()
        admin_data["role_type"] = "system_admin"
        admin_role = UserRole(**admin_data)
        
        self.assertTrue(admin_role.is_admin())
        self.assertTrue(admin_role.can_manage_users())
        
        # 能楽部管理者
        club_admin_data = self.sample_role_data.copy()
        club_admin_data["role_type"] = "club_admin"
        club_admin_role = UserRole(**club_admin_data)
        
        self.assertTrue(club_admin_role.is_admin())
        self.assertTrue(club_admin_role.can_manage_users())
        
        # 一般部員
        general_role = UserRole(**self.sample_role_data)
        
        self.assertFalse(general_role.is_admin())
        self.assertFalse(general_role.can_manage_users())
    
    def test_visibility_settings(self):
        """表示設定テスト"""
        # システム管理者は非表示
        admin_data = self.sample_role_data.copy()
        admin_data["role_type"] = "system_admin"
        admin_data["is_visible_to_general"] = False
        admin_role = UserRole(**admin_data)
        
        self.assertFalse(admin_role.is_visible_to_general)
        
        # 一般部員は表示
        general_role = UserRole(**self.sample_role_data)
        
        self.assertTrue(general_role.is_visible_to_general)
    
    def test_role_display_name(self):
        """ロール表示名テスト"""
        # システム管理者
        admin_data = self.sample_role_data.copy()
        admin_data["role_type"] = "system_admin"
        admin_role = UserRole(**admin_data)
        
        self.assertEqual(admin_role.role_display_name(), "システム管理者")
        
        # 能楽部管理者
        club_admin_data = self.sample_role_data.copy()
        club_admin_data["role_type"] = "club_admin"
        club_admin_role = UserRole(**club_admin_data)
        
        self.assertEqual(club_admin_role.role_display_name(), "能楽部管理者")
        
        # 4回生枠
        senior_data = self.sample_role_data.copy()
        senior_data["role_type"] = "senior"
        senior_role = UserRole(**senior_data)
        
        self.assertEqual(senior_role.role_display_name(), "4回生")
        
        # 一般部員
        general_role = UserRole(**self.sample_role_data)
        
        self.assertEqual(general_role.role_display_name(), "一般部員")
    
    def test_invalid_role_type(self):
        """無効なロールタイプのテスト"""
        invalid_data = self.sample_role_data.copy()
        invalid_data["role_type"] = "invalid_role"
        
        with self.assertRaises(ValueError):
            UserRole(**invalid_data)


if __name__ == "__main__":
    unittest.main()