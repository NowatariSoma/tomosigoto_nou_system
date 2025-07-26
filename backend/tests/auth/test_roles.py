import pytest
from unittest.mock import Mock, AsyncMock
from typing import List, Set
import json
import tempfile
import os

from app.auth.roles import RoleManager, Role


class TestRole:
    """Roleクラスのテスト"""
    
    def test_role_creation(self):
        """ロールの基本作成テスト"""
        permissions = {"users:read", "users:write"}
        role = Role(
            name="admin",
            description="管理者ロール",
            permissions=permissions
        )
        
        assert role.name == "admin"
        assert role.description == "管理者ロール"
        assert role.permissions == permissions
        assert role.inherits_from == []
    
    def test_role_with_inheritance(self):
        """継承関係を持つロールのテスト"""
        role = Role(
            name="super_admin",
            description="上級管理者",
            permissions={"admin:manage"},
            inherits_from=["admin"]
        )
        
        assert role.inherits_from == ["admin"]
    
    def test_has_permission(self):
        """権限チェックのテスト"""
        role = Role(
            name="user",
            description="一般ユーザー",
            permissions={"users:read", "schedule:read"}
        )
        
        assert role.has_permission("users:read") == True
        assert role.has_permission("users:write") == False
    
    def test_add_permission(self):
        """権限追加のテスト"""
        role = Role(
            name="user",
            description="一般ユーザー",
            permissions={"users:read"}
        )
        
        role.add_permission("schedule:read")
        assert "schedule:read" in role.permissions
    
    def test_remove_permission(self):
        """権限削除のテスト"""
        role = Role(
            name="user",
            description="一般ユーザー",
            permissions={"users:read", "schedule:read"}
        )
        
        role.remove_permission("schedule:read")
        assert "schedule:read" not in role.permissions
    
    def test_get_all_permissions_simple(self):
        """継承なしロールの全権限取得テスト"""
        role = Role(
            name="user",
            description="一般ユーザー",
            permissions={"users:read", "schedule:read"}
        )
        
        mock_role_manager = Mock()
        all_permissions = role.get_all_permissions(mock_role_manager)
        
        assert all_permissions == {"users:read", "schedule:read"}
    
    def test_get_all_permissions_with_inheritance(self):
        """継承ありロールの全権限取得テスト"""
        # 親ロール
        parent_role = Role(
            name="user", 
            description="一般ユーザー",
            permissions={"users:read", "schedule:read"}
        )
        
        # 子ロール
        child_role = Role(
            name="admin",
            description="管理者",
            permissions={"users:write", "roles:manage"},
            inherits_from=["user"]
        )
        
        # モックのRoleManagerを設定
        mock_role_manager = Mock()
        mock_role_manager.get_role.return_value = parent_role
        
        all_permissions = child_role.get_all_permissions(mock_role_manager)
        expected_permissions = {"users:read", "schedule:read", "users:write", "roles:manage"}
        
        assert all_permissions == expected_permissions
    
    def test_to_dict(self):
        """辞書変換のテスト"""
        role = Role(
            name="admin",
            description="管理者",
            permissions={"users:read", "users:write"},
            inherits_from=["user"]
        )
        
        expected_dict = {
            "name": "admin",
            "description": "管理者",
            "permissions": ["users:read", "users:write"],
            "inherits_from": ["user"]
        }
        
        result_dict = role.to_dict()
        assert result_dict["name"] == expected_dict["name"]
        assert result_dict["description"] == expected_dict["description"]
        assert set(result_dict["permissions"]) == set(expected_dict["permissions"])
        assert result_dict["inherits_from"] == expected_dict["inherits_from"]
    
    def test_from_dict(self):
        """辞書からのロール作成テスト"""
        role_data = {
            "name": "admin",
            "description": "管理者",
            "permissions": ["users:read", "users:write"],
            "inherits_from": ["user"]
        }
        
        role = Role.from_dict(role_data)
        
        assert role.name == "admin"
        assert role.description == "管理者"
        assert role.permissions == {"users:read", "users:write"}
        assert role.inherits_from == ["user"]


class TestRoleManager:
    """RoleManagerクラスのテスト"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """モックデータベース接続"""
        return AsyncMock()
    
    @pytest.fixture
    def sample_config_file(self):
        """サンプル設定ファイル"""
        config_data = {
            "roles": [
                {
                    "name": "admin",
                    "description": "管理者",
                    "permissions": ["users:read", "users:write", "roles:manage"],
                    "inherits_from": []
                },
                {
                    "name": "user",
                    "description": "一般ユーザー",
                    "permissions": ["users:read:self", "schedule:read"],
                    "inherits_from": []
                },
                {
                    "name": "viewer",
                    "description": "閲覧専用",
                    "permissions": ["schedule:read"],
                    "inherits_from": []
                }
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            config_path = f.name
        
        yield config_path
        
        # クリーンアップ
        os.unlink(config_path)
    
    def test_role_manager_initialization(self, mock_db_connection):
        """RoleManagerの初期化テスト"""
        manager = RoleManager(mock_db_connection)
        
        assert manager.roles == {}
        assert manager._db_connection == mock_db_connection
    
    def test_load_roles_from_config(self, mock_db_connection, sample_config_file):
        """設定ファイルからのロール読み込みテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        assert "admin" in manager.roles
        assert "user" in manager.roles
        assert "viewer" in manager.roles
        
        admin_role = manager.roles["admin"]
        assert admin_role.name == "admin"
        assert admin_role.description == "管理者"
        assert "users:write" in admin_role.permissions
    
    def test_get_role(self, mock_db_connection, sample_config_file):
        """ロール取得のテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        admin_role = manager.get_role("admin")
        assert admin_role.name == "admin"
        
        # 存在しないロール
        unknown_role = manager.get_role("unknown")
        assert unknown_role is None
    
    @pytest.mark.asyncio
    async def test_get_user_roles(self, mock_db_connection, sample_config_file):
        """ユーザーロール取得のテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        # モックデータベースの設定
        mock_db_connection.fetch.return_value = [
            {"role_type": "admin"},
            {"role_type": "user"}
        ]
        
        user_roles = await manager.get_user_roles("user123")
        
        assert len(user_roles) == 2
        role_names = [role.name for role in user_roles]
        assert "admin" in role_names
        assert "user" in role_names
    
    @pytest.mark.asyncio
    async def test_assign_role(self, mock_db_connection, sample_config_file):
        """ロール割り当てのテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        # 既存チェック（ロールなし）
        mock_db_connection.fetchval.return_value = None
        # 挿入操作
        mock_db_connection.execute.return_value = None
        
        result = await manager.assign_role("user123", "admin")
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_assign_nonexistent_role(self, mock_db_connection):
        """存在しないロールの割り当てテスト"""
        manager = RoleManager(mock_db_connection)
        
        result = await manager.assign_role("user123", "nonexistent")
        
        assert result == False
    
    @pytest.mark.asyncio
    async def test_remove_role(self, mock_db_connection, sample_config_file):
        """ロール削除のテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        # 削除操作
        mock_db_connection.execute.return_value = None
        
        result = await manager.remove_role("user123", "admin")
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_has_role(self, mock_db_connection, sample_config_file):
        """ロール所持チェックのテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        # ロールありのケース
        mock_db_connection.fetchval.return_value = 1
        result = await manager.has_role("user123", "admin")
        assert result == True
        
        # ロールなしのケース
        mock_db_connection.fetchval.return_value = 0
        result = await manager.has_role("user123", "admin")
        assert result == False
    
    def test_get_role_hierarchy(self, mock_db_connection, sample_config_file):
        """ロール階層取得のテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        hierarchy = manager.get_role_hierarchy()
        
        assert isinstance(hierarchy, dict)
        assert "admin" in hierarchy
        assert "user" in hierarchy
        assert "viewer" in hierarchy
    
    @pytest.mark.asyncio
    async def test_get_effective_permissions(self, mock_db_connection, sample_config_file):
        """実効権限取得のテスト"""
        manager = RoleManager(mock_db_connection)
        manager.load_roles_from_config(sample_config_file)
        
        # ユーザーがadminロールを持つ場合
        mock_db_connection.fetch.return_value = [{"role_type": "admin"}]
        
        permissions = await manager.get_effective_permissions("user123")
        
        assert isinstance(permissions, set)
        assert "users:read" in permissions
        assert "users:write" in permissions
        assert "roles:manage" in permissions