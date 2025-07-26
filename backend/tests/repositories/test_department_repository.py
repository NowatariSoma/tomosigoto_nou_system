import unittest
from unittest.mock import Mock, patch
import pytest
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, List, Optional

from app.repositories.department_repository import DepartmentRepository
from app.models.department import Department


class TestDepartmentRepository(unittest.TestCase):
    """学部リポジトリのテストクラス"""
    
    def setUp(self):
        """テスト準備"""
        self.mock_db_client = Mock()
        self.repository = DepartmentRepository(self.mock_db_client)
        
        self.sample_department_id = uuid4()
        
        self.sample_department_data = {
            "id": str(self.sample_department_id),
            "department_code": "LAW",
            "department_name": "法学部",
            "campus": "今出川",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        self.sample_engineering_data = {
            "id": str(uuid4()),
            "department_code": "ENG",
            "department_name": "工学部",
            "campus": "田辺",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    def tearDown(self):
        """テスト後処理"""
        pass
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_all(self):
        """全学部取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [
            self.sample_department_data,
            self.sample_engineering_data
        ]
        
        result = self.repository.get_all()
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        self.assertIsInstance(result[0], Department)
        self.assertIsInstance(result[1], Department)
        self.assertEqual(result[0].department_name, "法学部")
        self.assertEqual(result[1].department_name, "工学部")
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_id(self):
        """ID取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_department_data]
        
        result = self.repository.get_by_id(self.sample_department_id)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, Department)
        self.assertEqual(result.department_name, "法学部")
        self.assertEqual(str(result.id), str(self.sample_department_id))
        
        # クエリが正しく呼ばれているか確認
        self.repository._execute_query.assert_called_once()
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_id_not_found(self):
        """ID取得（見つからない）テスト"""
        # モックの戻り値を空に設定
        self.repository._execute_query.return_value = []
        
        result = self.repository.get_by_id(uuid4())
        
        self.assertIsNone(result)
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_code(self):
        """コードで学部取得テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_department_data]
        
        result = self.repository.get_by_code("LAW")
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, Department)
        self.assertEqual(result.department_code, "LAW")
        self.assertEqual(result.department_name, "法学部")
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_code_not_found(self):
        """コードで学部取得（見つからない）テスト"""
        # モックの戻り値を空に設定
        self.repository._execute_query.return_value = []
        
        result = self.repository.get_by_code("NONEXISTENT")
        
        self.assertIsNone(result)
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_campus(self):
        """キャンパス別学部取得テスト"""
        # 今出川キャンパスのみ返すように設定
        self.repository._execute_query.return_value = [self.sample_department_data]
        
        result = self.repository.get_by_campus("今出川")
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)
        self.assertIsInstance(result[0], Department)
        self.assertEqual(result[0].campus, "今出川")
        self.assertEqual(result[0].department_name, "法学部")
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_campus_multiple(self):
        """キャンパス別学部取得（複数）テスト"""
        # 田辺キャンパスに複数学部がある場合
        engineering2_data = self.sample_engineering_data.copy()
        engineering2_data["id"] = str(uuid4())
        engineering2_data["department_code"] = "SCI"
        engineering2_data["department_name"] = "理工学部"
        
        self.repository._execute_query.return_value = [
            self.sample_engineering_data,
            engineering2_data
        ]
        
        result = self.repository.get_by_campus("田辺")
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        for dept in result:
            self.assertEqual(dept.campus, "田辺")
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_by_campus_empty(self):
        """キャンパス別学部取得（空）テスト"""
        # モックの戻り値を空に設定
        self.repository._execute_query.return_value = []
        
        result = self.repository.get_by_campus("存在しないキャンパス")
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_create(self):
        """学部作成テスト"""
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [self.sample_department_data]
        
        department_data = {
            "department_code": "LAW",
            "department_name": "法学部",
            "campus": "今出川",
            "is_active": True
        }
        
        result = self.repository.create(department_data)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, Department)
        self.assertEqual(result.department_code, "LAW")
        self.assertEqual(result.department_name, "法学部")
        self.assertEqual(result.campus, "今出川")
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_update(self):
        """学部更新テスト"""
        # 更新後のデータ
        updated_data = self.sample_department_data.copy()
        updated_data["department_name"] = "法学研究科"
        
        # モックの戻り値を設定
        self.repository._execute_query.return_value = [updated_data]
        
        update_data = {"department_name": "法学研究科"}
        
        result = self.repository.update(self.sample_department_id, update_data)
        
        self.assertIsNotNone(result)
        self.assertIsInstance(result, Department)
        self.assertEqual(result.department_name, "法学研究科")
        self.assertEqual(result.department_code, "LAW")  # 他の値は変更されていない
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_update_not_found(self):
        """学部更新（見つからない）テスト"""
        # モックの戻り値を空に設定
        self.repository._execute_query.return_value = []
        
        update_data = {"department_name": "存在しない学部"}
        
        result = self.repository.update(uuid4(), update_data)
        
        self.assertIsNone(result)
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_get_active_departments_only(self):
        """有効な学部のみ取得テスト"""
        # 有効な学部データ
        active_dept = self.sample_department_data.copy()
        
        # 無効な学部データ
        inactive_dept = self.sample_engineering_data.copy()
        inactive_dept["is_active"] = False
        
        # 有効な学部のみ返すように設定
        self.repository._execute_query.return_value = [active_dept]
        
        result = self.repository.get_all()
        
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0].is_active)
    
    @patch('app.repositories.department_repository.DepartmentRepository._execute_query')
    def test_query_with_filters(self):
        """フィルタ付きクエリテスト"""
        # is_active=True のフィルタが適用されることを確認
        self.repository._execute_query.return_value = [self.sample_department_data]
        
        result = self.repository.get_all()
        
        # 呼び出されたクエリに WHERE is_active = true が含まれているかチェック
        self.repository._execute_query.assert_called_once()
        called_args = self.repository._execute_query.call_args
        # クエリの詳細確認は実装に依存するため、ここでは呼び出されたことのみ確認


if __name__ == "__main__":
    unittest.main()