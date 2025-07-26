"""
ロール定義と管理機能

このモジュールは以下の機能を提供します：
- ロールの定義と管理
- ユーザーへのロール割り当て
- ロール階層の処理
- 監査ログの記録
"""

from typing import List, Set, Dict, Optional, Any
import json
import logging
from pathlib import Path
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class Role:
    """ロールを表すクラス"""
    
    def __init__(self, name: str, description: str, permissions: Set[str], inherits_from: List[str] = None):
        self.name = name
        self.description = description
        self.permissions = set(permissions) if isinstance(permissions, list) else permissions
        self.inherits_from = inherits_from or []
    
    def has_permission(self, permission: str) -> bool:
        """権限所持チェック"""
        return permission in self.permissions
    
    def add_permission(self, permission: str) -> None:
        """権限追加"""
        self.permissions.add(permission)
    
    def remove_permission(self, permission: str) -> None:
        """権限削除"""
        self.permissions.discard(permission)
    
    def get_all_permissions(self, role_manager: 'RoleManager') -> Set[str]:
        """継承を含む全権限取得"""
        all_permissions = self.permissions.copy()
        
        # 継承されたロールの権限を再帰的に取得
        for parent_role_name in self.inherits_from:
            parent_role = role_manager.get_role(parent_role_name)
            if parent_role:
                parent_permissions = parent_role.get_all_permissions(role_manager)
                all_permissions.update(parent_permissions)
        
        return all_permissions
    
    def to_dict(self) -> dict:
        """辞書変換"""
        return {
            "name": self.name,
            "description": self.description,
            "permissions": list(self.permissions),
            "inherits_from": self.inherits_from
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Role':
        """辞書からのロール作成"""
        return cls(
            name=data["name"],
            description=data["description"],
            permissions=set(data.get("permissions", [])),
            inherits_from=data.get("inherits_from", [])
        )


class RoleManager:
    """ロール管理クラス"""
    
    def __init__(self, db_connection, config_path: str = None):
        self._db_connection = db_connection
        self._logger = logger
        self.roles: Dict[str, Role] = {}
        
        if config_path:
            self.load_roles_from_config(config_path)
    
    def load_roles_from_config(self, config_path: str) -> None:
        """設定ファイルからロード"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            for role_data in config.get("roles", []):
                role = Role.from_dict(role_data)
                self.roles[role.name] = role
                
            self._logger.info(f"Loaded {len(self.roles)} roles from {config_path}")
            
        except Exception as e:
            self._logger.error(f"Failed to load roles from {config_path}: {e}")
            raise
    
    def get_role(self, role_name: str) -> Optional[Role]:
        """ロール取得"""
        return self.roles.get(role_name)
    
    async def get_user_roles(self, user_id: str) -> List[Role]:
        """ユーザーロール取得"""
        try:
            # データベースからユーザーのロールを取得
            query = "SELECT role_type FROM user_roles WHERE user_id = $1"
            rows = await self._db_connection.fetch(query, user_id)
            
            user_roles = []
            for row in rows:
                role = self.get_role(row["role_type"])
                if role:
                    user_roles.append(role)
            
            return user_roles
            
        except Exception as e:
            self._logger.error(f"Failed to get user roles for {user_id}: {e}")
            return []
    
    async def assign_role(self, user_id: str, role_name: str) -> bool:
        """ロール割り当て"""
        try:
            # ロールが存在するかチェック
            if role_name not in self.roles:
                self._logger.warning(f"Role {role_name} does not exist")
                return False
            
            # 既にロールが割り当てられているかチェック
            existing_query = "SELECT id FROM user_roles WHERE user_id = $1 AND role_type = $2"
            existing_role = await self._db_connection.fetchval(existing_query, user_id, role_name)
            
            if existing_role:
                self._logger.info(f"User {user_id} already has role {role_name}")
                return True
            
            # ロール割り当て
            insert_query = """
                INSERT INTO user_roles (user_id, role_type, created_at, updated_at)
                VALUES ($1, $2, $3, $4)
            """
            now = datetime.utcnow()
            await self._db_connection.execute(insert_query, user_id, role_name, now, now)
            
            # 監査ログ記録
            await self._log_role_change(user_id, "assign", role_name)
            
            self._logger.info(f"Assigned role {role_name} to user {user_id}")
            return True
            
        except Exception as e:
            self._logger.error(f"Failed to assign role {role_name} to user {user_id}: {e}")
            return False
    
    async def remove_role(self, user_id: str, role_name: str) -> bool:
        """ロール削除"""
        try:
            delete_query = "DELETE FROM user_roles WHERE user_id = $1 AND role_type = $2"
            await self._db_connection.execute(delete_query, user_id, role_name)
            
            # 監査ログ記録
            await self._log_role_change(user_id, "remove", role_name)
            
            self._logger.info(f"Removed role {role_name} from user {user_id}")
            return True
            
        except Exception as e:
            self._logger.error(f"Failed to remove role {role_name} from user {user_id}: {e}")
            return False
    
    async def has_role(self, user_id: str, role_name: str) -> bool:
        """ロール所持チェック"""
        try:
            query = "SELECT COUNT(*) FROM user_roles WHERE user_id = $1 AND role_type = $2"
            count = await self._db_connection.fetchval(query, user_id, role_name)
            return count > 0
            
        except Exception as e:
            self._logger.error(f"Failed to check role {role_name} for user {user_id}: {e}")
            return False
    
    def get_role_hierarchy(self) -> Dict:
        """ロール階層取得"""
        hierarchy = {}
        for role_name, role in self.roles.items():
            hierarchy[role_name] = {
                "description": role.description,
                "permissions": list(role.permissions),
                "inherits_from": role.inherits_from
            }
        return hierarchy
    
    async def get_effective_permissions(self, user_id: str) -> Set[str]:
        """実効権限取得"""
        try:
            user_roles = await self.get_user_roles(user_id)
            all_permissions = set()
            
            for role in user_roles:
                role_permissions = role.get_all_permissions(self)
                all_permissions.update(role_permissions)
            
            return all_permissions
            
        except Exception as e:
            self._logger.error(f"Failed to get effective permissions for user {user_id}: {e}")
            return set()
    
    async def _log_role_change(self, user_id: str, action: str, role: str) -> None:
        """ロール変更の監査ログ記録"""
        try:
            # 監査ログテーブルがある場合の記録（テーブルが存在しない場合はスキップ）
            log_query = """
                INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """
            log_id = str(uuid.uuid4())
            details = json.dumps({"role": role, "action": action})
            now = datetime.utcnow()
            
            await self._db_connection.execute(
                log_query, log_id, user_id, action, "role", role, details, now
            )
            
        except Exception as e:
            # 監査ログの失敗は致命的ではないので、ログ出力のみ
            self._logger.warning(f"Failed to log role change: {e}")