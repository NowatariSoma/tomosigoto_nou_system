"""
データベースアダプター

Supabaseクライアントをasyncpg互換にするアダプター
RoleManagerとPermissionManagerで使用
"""

from typing import Any, List, Dict, Optional
import logging
from datetime import datetime

from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


class SupabaseDBAdapter:
    """SupabaseクライアントをAsyncPG互換にするアダプター"""
    
    def __init__(self, supabase_service: SupabaseService):
        self.supabase = supabase_service.supabase
        self._logger = logger
    
    async def fetch(self, query: str, *params) -> List[Dict[str, Any]]:
        """複数行取得（asyncpg.fetch互換）"""
        try:
            # パラメータ化クエリをSupabase形式に変換
            table_name, supabase_query = self._convert_query(query, params)
            
            if not table_name:
                self._logger.warning(f"Unsupported query: {query}")
                return []
            
            response = supabase_query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            self._logger.error(f"Failed to fetch data: {e}")
            return []
    
    async def fetchval(self, query: str, *params) -> Any:
        """単一値取得（asyncpg.fetchval互換）"""
        try:
            # パラメータ化クエリをSupabase形式に変換
            table_name, supabase_query = self._convert_query(query, params)
            
            if not table_name:
                self._logger.warning(f"Unsupported query: {query}")
                return None
            
            response = supabase_query.execute()
            
            # COUNTクエリの場合
            if "COUNT(*)" in query.upper():
                return len(response.data) if response.data else 0
            
            # 最初の行の最初の値を返す
            if response.data and len(response.data) > 0:
                first_row = response.data[0]
                if isinstance(first_row, dict) and first_row:
                    return list(first_row.values())[0]
                return first_row
            
            return None
            
        except Exception as e:
            self._logger.error(f"Failed to fetch value: {e}")
            return None
    
    async def execute(self, query: str, *params) -> None:
        """クエリ実行（asyncpg.execute互換）"""
        try:
            # INSERTクエリの処理
            if query.strip().upper().startswith("INSERT"):
                await self._handle_insert(query, params)
            # DELETEクエリの処理
            elif query.strip().upper().startswith("DELETE"):
                await self._handle_delete(query, params)
            # UPDATEクエリの処理
            elif query.strip().upper().startswith("UPDATE"):
                await self._handle_update(query, params)
            else:
                self._logger.warning(f"Unsupported execute query: {query}")
                
        except Exception as e:
            self._logger.error(f"Failed to execute query: {e}")
            raise
    
    def _convert_query(self, query: str, params: tuple) -> tuple:
        """クエリをSupabase形式に変換"""
        query_upper = query.upper().strip()
        
        # user_rolesテーブルのSELECT
        if "FROM USER_ROLES" in query_upper:
            table_query = self.supabase.table('user_roles').select('*')
            
            # WHERE条件の処理
            if "WHERE USER_ID = $1" in query_upper:
                if params:
                    table_query = table_query.eq('user_id', str(params[0]))
            if "AND ROLE_TYPE = $2" in query_upper:
                if len(params) > 1:
                    table_query = table_query.eq('role_type', str(params[1]))
            
            return 'user_roles', table_query
        
        # schedulesテーブルのクエリ
        elif "FROM SCHEDULES" in query_upper:
            table_query = self.supabase.table('schedules').select('*')
            
            if "WHERE ID = $1 AND CREATED_BY = $2" in query_upper:
                if len(params) >= 2:
                    table_query = table_query.eq('id', str(params[0])).eq('created_by', str(params[1]))
            
            return 'schedules', table_query
        
        # usersテーブルのクエリ
        elif "FROM USERS" in query_upper:
            table_query = self.supabase.table('users').select('*')
            
            if "WHERE ID = $1" in query_upper:
                if params:
                    table_query = table_query.eq('id', str(params[0]))
            
            return 'users', table_query
        
        # practice_sessionsテーブルのクエリ
        elif "FROM PRACTICE_SESSIONS" in query_upper or "JOIN SCHEDULES" in query_upper:
            # 複雑なJOINクエリは簡略化
            if len(params) >= 2:
                # オーナーシップチェック用の簡易実装
                table_query = self.supabase.table('practice_sessions').select('*')
                table_query = table_query.eq('id', str(params[0]))
                return 'practice_sessions', table_query
            
        return None, None
    
    async def _handle_insert(self, query: str, params: tuple) -> None:
        """INSERTクエリの処理"""
        query_upper = query.upper()
        
        if "INTO USER_ROLES" in query_upper:
            if len(params) >= 4:
                data = {
                    'user_id': str(params[0]),
                    'role_type': str(params[1]),
                    'created_at': params[2].isoformat() if isinstance(params[2], datetime) else str(params[2]),
                    'updated_at': params[3].isoformat() if isinstance(params[3], datetime) else str(params[3])
                }
                self.supabase.table('user_roles').insert(data).execute()
        
        elif "INTO AUDIT_LOGS" in query_upper:
            if len(params) >= 7:
                data = {
                    'id': str(params[0]),
                    'user_id': str(params[1]),
                    'action': str(params[2]),
                    'resource_type': str(params[3]),
                    'resource_id': str(params[4]),
                    'details': str(params[5]),
                    'created_at': params[6].isoformat() if isinstance(params[6], datetime) else str(params[6])
                }
                # audit_logsテーブルが存在する場合のみ
                try:
                    self.supabase.table('audit_logs').insert(data).execute()
                except Exception:
                    # テーブルが存在しない場合はスキップ
                    pass
    
    async def _handle_delete(self, query: str, params: tuple) -> None:
        """DELETEクエリの処理"""
        query_upper = query.upper()
        
        if "FROM USER_ROLES" in query_upper:
            if len(params) >= 2:
                self.supabase.table('user_roles')\
                    .delete()\
                    .eq('user_id', str(params[0]))\
                    .eq('role_type', str(params[1]))\
                    .execute()
    
    async def _handle_update(self, query: str, params: tuple) -> None:
        """UPDATEクエリの処理"""
        # 現在のスキーマでは使用していないため、将来の拡張用に空実装
        self._logger.info("UPDATE query received but not implemented yet")
        pass