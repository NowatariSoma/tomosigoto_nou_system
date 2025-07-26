"""
権限定義と検証機能

このモジュールは以下の機能を提供します：
- 権限の定義と管理
- 権限チェック機能
- リソース権限の検証
- オーナーシップの確認
"""

from typing import Set, Dict, Optional, List
import json
import logging
from pathlib import Path
from datetime import datetime

from app.auth.roles import RoleManager

logger = logging.getLogger(__name__)


class PermissionManager:
    """権限管理クラス"""
    
    def __init__(self, config_path: str = None, db_connection = None):
        self._logger = logger
        self._db_connection = db_connection
        self.available_permissions: Set[str] = set()
        self.permission_descriptions: Dict[str, str] = {}
        self.resource_permissions: Dict[str, List[str]] = {}
        
        if config_path:
            self.load_permissions_from_config(config_path)
    
    def load_permissions_from_config(self, config_path: str) -> None:
        """設定ファイルからの権限読み込み"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 権限の読み込み
            permissions = config.get("permissions", {})
            self.permission_descriptions = permissions
            self.available_permissions = set(permissions.keys())
            
            # リソース権限の読み込み
            self.resource_permissions = config.get("resource_permissions", {})
            
            self._logger.info(f"Loaded {len(self.available_permissions)} permissions from {config_path}")
            
        except Exception as e:
            self._logger.error(f"Failed to load permissions from {config_path}: {e}")
            raise
    
    def is_valid_permission(self, permission: str) -> bool:
        """権限の有効性チェック"""
        if not permission or not isinstance(permission, str):
            return False
        return permission in self.available_permissions
    
    async def check_permission(self, user_id: str, permission: str, role_manager: RoleManager) -> bool:
        """権限チェック"""
        try:
            # 権限が有効かチェック
            if not self.is_valid_permission(permission):
                return False
            
            # ユーザーの実効権限を取得
            effective_permissions = await role_manager.get_effective_permissions(user_id)
            
            # 権限チェックとログ記録
            has_permission = permission in effective_permissions
            await self._log_permission_check(user_id, permission, has_permission)
            
            return has_permission
            
        except Exception as e:
            self._logger.error(f"Failed to check permission {permission} for user {user_id}: {e}")
            return False
    
    async def check_resource_permission(self, user_id: str, resource_type: str, action: str, role_manager: RoleManager) -> bool:
        """リソース権限チェック"""
        try:
            # リソース権限をフォーマット
            permission = self._format_resource_permission(resource_type, action)
            
            # 権限チェック
            return await self.check_permission(user_id, permission, role_manager)
            
        except Exception as e:
            self._logger.error(f"Failed to check resource permission {resource_type}:{action} for user {user_id}: {e}")
            return False
    
    async def check_ownership(self, user_id: str, resource_type: str, resource_id: str) -> bool:
        """オーナーシップチェック"""
        try:
            if not self._db_connection:
                self._logger.warning("No database connection available for ownership check")
                return False
            
            # リソースタイプに応じた所有者チェック
            if resource_type == "schedule":
                query = "SELECT COUNT(*) FROM schedules WHERE id = $1 AND created_by = $2"
            elif resource_type == "users":
                query = "SELECT COUNT(*) FROM users WHERE id = $1 AND id = $2"
            elif resource_type == "practice_session":
                query = """
                    SELECT COUNT(*) FROM practice_sessions ps 
                    JOIN schedules s ON ps.schedule_id = s.id 
                    WHERE ps.id = $1 AND s.created_by = $2
                """
            else:
                # 未対応のリソースタイプ
                self._logger.warning(f"Unsupported resource type for ownership check: {resource_type}")
                return False
            
            count = await self._db_connection.fetchval(query, resource_id, user_id)
            return count > 0
            
        except Exception as e:
            self._logger.error(f"Failed to check ownership of {resource_type}:{resource_id} for user {user_id}: {e}")
            return False
    
    def register_permission(self, permission: str, description: str = None) -> bool:
        """権限登録"""
        try:
            self.available_permissions.add(permission)
            if description:
                self.permission_descriptions[permission] = description
            
            self._logger.info(f"Registered permission: {permission}")
            return True
            
        except Exception as e:
            self._logger.error(f"Failed to register permission {permission}: {e}")
            return False
    
    def get_permission_description(self, permission: str) -> str:
        """権限説明取得"""
        return self.permission_descriptions.get(permission, "説明なし")
    
    def get_all_permissions(self) -> Dict[str, str]:
        """全権限取得"""
        return self.permission_descriptions.copy()
    
    def _format_resource_permission(self, resource_type: str, action: str) -> str:
        """リソース権限フォーマット"""
        return f"{resource_type}:{action}"
    
    async def _log_permission_check(self, user_id: str, permission: str, result: bool) -> None:
        """権限チェックのログ記録"""
        try:
            # パフォーマンスを考慮して、詳細ログはデバッグレベルのみ
            self._logger.debug(f"Permission check: user={user_id}, permission={permission}, result={result}")
            
        except Exception as e:
            # ログ記録の失敗は無視
            pass