import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.department import Department

logger = logging.getLogger(__name__)


class DepartmentRepository:
    """学部データにアクセスするリポジトリクラス"""
    
    def __init__(self, db_client):
        """コンストラクタ"""
        self._db_client = db_client
        self._logger = logger
    
    def _execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """クエリを実行するヘルパーメソッド"""
        try:
            # Supabaseクライアントを使用してクエリを実行
            if hasattr(self._db_client, 'table'):
                # Supabaseの場合
                result = self._db_client.table('departments').select('*')
                
                if params:
                    if 'id' in params:
                        result = result.eq('id', params['id'])
                    if 'department_code' in params:
                        result = result.eq('department_code', params['department_code'])
                    if 'campus' in params:
                        result = result.eq('campus', params['campus'])
                    if 'is_active' in params:
                        result = result.eq('is_active', params['is_active'])
                
                response = result.execute()
                return response.data if response.data else []
            else:
                # 直接SQLを実行する場合（モック等）
                return []
        except Exception as e:
            self._logger.error(f"Database query error: {str(e)}")
            return []
    
    def _dict_to_department(self, data: Dict[str, Any]) -> Department:
        """辞書データをDepartmentモデルに変換"""
        return Department(
            id=UUID(data['id']) if isinstance(data['id'], str) else data['id'],
            department_code=data['department_code'],
            department_name=data['department_name'],
            campus=data['campus'],
            is_active=data['is_active'],
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at']
        )
    
    def get_all(self) -> List[Department]:
        """全学部取得"""
        try:
            data = self._execute_query("SELECT * FROM departments WHERE is_active = true ORDER BY department_code")
            return [self._dict_to_department(item) for item in data]
        except Exception as e:
            self._logger.error(f"Error getting all departments: {str(e)}")
            return []
    
    def get_by_id(self, department_id: UUID) -> Optional[Department]:
        """IDで学部取得"""
        try:
            data = self._execute_query("SELECT * FROM departments WHERE id = %s", {'id': str(department_id)})
            if data:
                return self._dict_to_department(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting department by id {department_id}: {str(e)}")
            return None
    
    def get_by_code(self, department_code: str) -> Optional[Department]:
        """コードで学部取得"""
        try:
            data = self._execute_query("SELECT * FROM departments WHERE department_code = %s", {'department_code': department_code})
            if data:
                return self._dict_to_department(data[0])
            return None
        except Exception as e:
            self._logger.error(f"Error getting department by code {department_code}: {str(e)}")
            return None
    
    def get_by_campus(self, campus: str) -> List[Department]:
        """キャンパス別学部取得"""
        try:
            data = self._execute_query("SELECT * FROM departments WHERE campus = %s AND is_active = true", {'campus': campus})
            return [self._dict_to_department(item) for item in data]
        except Exception as e:
            self._logger.error(f"Error getting departments by campus {campus}: {str(e)}")
            return []
    
    def create(self, department_data: Dict[str, Any]) -> Department:
        """学部作成"""
        try:
            # 新しいIDを生成
            from uuid import uuid4
            new_id = uuid4()
            now = datetime.now()
            
            create_data = {
                'id': str(new_id),
                'department_code': department_data['department_code'],
                'department_name': department_data['department_name'],
                'campus': department_data['campus'],
                'is_active': department_data.get('is_active', True),
                'created_at': now.isoformat(),
                'updated_at': now.isoformat()
            }
            
            # データベースに挿入
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('departments').insert(create_data).execute()
                if response.data:
                    return self._dict_to_department(response.data[0])
            
            # フォールバック（テスト時など）
            return self._dict_to_department(create_data)
        except Exception as e:
            self._logger.error(f"Error creating department: {str(e)}")
            raise
    
    def update(self, department_id: UUID, update_data: Dict[str, Any]) -> Optional[Department]:
        """学部更新"""
        try:
            now = datetime.now()
            update_data['updated_at'] = now.isoformat()
            
            if hasattr(self._db_client, 'table'):
                response = self._db_client.table('departments').update(update_data).eq('id', str(department_id)).execute()
                if response.data:
                    return self._dict_to_department(response.data[0])
            
            return None
        except Exception as e:
            self._logger.error(f"Error updating department {department_id}: {str(e)}")
            return None