import unittest
import pytest
from uuid import UUID, uuid4
from datetime import datetime

from app.models.department import Department


class TestDepartmentModel(unittest.TestCase):
    """学部モデルのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.sample_department_data = {
            "id": uuid4(),
            "department_code": "LAW",
            "department_name": "法学部",
            "campus": "今出川",
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
    
    def test_create_department(self):
        """学部作成テスト"""
        department = Department(**self.sample_department_data)
        
        self.assertEqual(department.department_code, "LAW")
        self.assertEqual(department.department_name, "法学部")
        self.assertEqual(department.campus, "今出川")
        self.assertTrue(department.is_active)
        self.assertIsInstance(department.id, UUID)
    
    def test_full_display_name(self):
        """フル表示名テスト"""
        department = Department(**self.sample_department_data)
        
        expected_name = "法学部（今出川）"
        self.assertEqual(department.full_display_name(), expected_name)
        
        # 田辺キャンパスの場合
        tanabe_data = self.sample_department_data.copy()
        tanabe_data["department_name"] = "工学部"
        tanabe_data["campus"] = "田辺"
        tanabe_department = Department(**tanabe_data)
        
        expected_tanabe_name = "工学部（田辺）"
        self.assertEqual(tanabe_department.full_display_name(), expected_tanabe_name)
    
    def test_is_imadegawa(self):
        """今出川キャンパス判定テスト"""
        department = Department(**self.sample_department_data)
        
        self.assertTrue(department.is_imadegawa())
        
        # 田辺キャンパスの場合
        tanabe_data = self.sample_department_data.copy()
        tanabe_data["campus"] = "田辺"
        tanabe_department = Department(**tanabe_data)
        
        self.assertFalse(tanabe_department.is_imadegawa())
    
    def test_is_tanabe(self):
        """田辺キャンパス判定テスト"""
        department = Department(**self.sample_department_data)
        
        self.assertFalse(department.is_tanabe())
        
        # 田辺キャンパスの場合
        tanabe_data = self.sample_department_data.copy()
        tanabe_data["campus"] = "田辺"
        tanabe_department = Department(**tanabe_data)
        
        self.assertTrue(tanabe_department.is_tanabe())
    
    def test_to_dict(self):
        """辞書変換テスト"""
        department = Department(**self.sample_department_data)
        dept_dict = department.to_dict()
        
        self.assertIsInstance(dept_dict, dict)
        self.assertEqual(dept_dict["department_code"], "LAW")
        self.assertEqual(dept_dict["department_name"], "法学部")
        self.assertEqual(dept_dict["campus"], "今出川")
    
    def test_invalid_campus(self):
        """無効なキャンパス名のテスト"""
        invalid_data = self.sample_department_data.copy()
        invalid_data["campus"] = "無効キャンパス"
        
        with self.assertRaises(ValueError):
            Department(**invalid_data)
    
    def test_department_code_validation(self):
        """学部コード検証テスト"""
        # 有効な学部コード
        department = Department(**self.sample_department_data)
        self.assertEqual(department.department_code, "LAW")
        
        # 空の学部コード
        invalid_data = self.sample_department_data.copy()
        invalid_data["department_code"] = ""
        
        with self.assertRaises(ValueError):
            Department(**invalid_data)
        
        # 長すぎる学部コード
        invalid_data = self.sample_department_data.copy()
        invalid_data["department_code"] = "A" * 51  # 50文字超
        
        with self.assertRaises(ValueError):
            Department(**invalid_data)


if __name__ == "__main__":
    unittest.main()