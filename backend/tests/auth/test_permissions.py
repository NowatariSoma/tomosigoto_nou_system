import pytest
from unittest.mock import Mock, AsyncMock
import json
import tempfile
import os

from app.auth.permissions import PermissionManager
from app.auth.roles import RoleManager, Role


class TestPermissionManager:
    """PermissionManagerクラスのテスト"""
    
    @pytest.fixture
    def mock_db_connection(self):
        """モックデータベース接続"""
        return AsyncMock()
    
    @pytest.fixture
    def sample_permissions_config(self):
        """サンプル権限設定ファイル"""
        config_data = {
            "permissions": {
                "users:read": "ユーザー情報の閲覧",
                "users:read:self": "自身のユーザー情報の閲覧",
                "users:write": "ユーザー情報の編集",
                "users:delete": "ユーザー情報の削除",
                "roles:read": "ロール情報の閲覧",
                "roles:write": "ロール情報の編集",
                "schedule:read": "スケジュールの閲覧",
                "schedule:write": "スケジュールの編集",
                "schedule:write:self": "自身に関するスケジュールの編集",
                "schedule:delete": "スケジュールの削除",
                "admin:manage": "システム管理"
            },
            "resource_permissions": {
                "users": ["read", "write", "delete"],
                "roles": ["read", "write"],
                "schedule": ["read", "write", "delete"],
                "admin": ["manage"]
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            config_path = f.name
        
        yield config_path
        
        # クリーンアップ
        os.unlink(config_path)
    
    @pytest.fixture
    def mock_role_manager(self):
        """モックRoleManager"""
        role_manager = Mock(spec=RoleManager)
        
        # サンプルロール
        admin_role = Role(
            name="admin",
            description="管理者",
            permissions={"users:read", "users:write", "users:delete", "roles:read", "roles:write", "schedule:read", "schedule:write", "schedule:delete", "admin:manage"}
        )
        
        user_role = Role(
            name="user",
            description="一般ユーザー",
            permissions={"users:read:self", "schedule:read", "schedule:write:self"}
        )
        
        viewer_role = Role(
            name="viewer",
            description="閲覧専用",
            permissions={"schedule:read"}
        )
        
        # モック設定
        role_manager.get_user_roles = AsyncMock()
        role_manager.get_effective_permissions = AsyncMock()
        
        return role_manager, admin_role, user_role, viewer_role
    
    def test_permission_manager_initialization(self):
        """PermissionManagerの初期化テスト"""
        manager = PermissionManager()
        
        assert manager.available_permissions == set()
    
    def test_load_permissions_from_config(self, sample_permissions_config):
        """設定ファイルからの権限読み込みテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        assert "users:read" in manager.available_permissions
        assert "users:write" in manager.available_permissions
        assert "schedule:read" in manager.available_permissions
        assert len(manager.available_permissions) > 5
    
    def test_is_valid_permission(self, sample_permissions_config):
        """権限の有効性チェックテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        assert manager.is_valid_permission("users:read") == True
        assert manager.is_valid_permission("users:write") == True
        assert manager.is_valid_permission("invalid:permission") == False
        assert manager.is_valid_permission("") == False
    
    @pytest.mark.asyncio
    async def test_check_permission_admin(self, sample_permissions_config, mock_role_manager):
        """管理者の権限チェックテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        
        # 管理者ロールの効果的権限を設定
        role_manager.get_effective_permissions.return_value = admin_role.permissions
        
        # 管理者は全ての権限を持つ
        result = await manager.check_permission("admin_user", "users:write", role_manager)
        assert result == True
        
        result = await manager.check_permission("admin_user", "schedule:delete", role_manager)
        assert result == True
    
    @pytest.mark.asyncio
    async def test_check_permission_user(self, sample_permissions_config, mock_role_manager):
        """一般ユーザーの権限チェックテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        
        # 一般ユーザーロールの効果的権限を設定
        role_manager.get_effective_permissions.return_value = user_role.permissions
        
        # 一般ユーザーは限定的な権限を持つ
        result = await manager.check_permission("normal_user", "users:read:self", role_manager)
        assert result == True
        
        result = await manager.check_permission("normal_user", "schedule:read", role_manager)
        assert result == True
        
        # 一般ユーザーは管理者権限を持たない
        result = await manager.check_permission("normal_user", "users:write", role_manager)
        assert result == False
        
        result = await manager.check_permission("normal_user", "users:delete", role_manager)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_check_permission_viewer(self, sample_permissions_config, mock_role_manager):
        """閲覧専用ユーザーの権限チェックテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        
        # 閲覧専用ロールの効果的権限を設定
        role_manager.get_effective_permissions.return_value = viewer_role.permissions
        
        # 閲覧専用ユーザーは読み取り権限のみ
        result = await manager.check_permission("viewer_user", "schedule:read", role_manager)
        assert result == True
        
        # 閲覧専用ユーザーは書き込み権限を持たない
        result = await manager.check_permission("viewer_user", "schedule:write", role_manager)
        assert result == False
        
        result = await manager.check_permission("viewer_user", "users:read", role_manager)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_check_permission_invalid(self, sample_permissions_config, mock_role_manager):
        """無効な権限のチェックテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        role_manager.get_effective_permissions.return_value = admin_role.permissions
        
        # 無効な権限は常にFalse
        result = await manager.check_permission("admin_user", "invalid:permission", role_manager)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_check_resource_permission_admin(self, sample_permissions_config, mock_role_manager):
        """リソース権限チェック（管理者）のテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        role_manager.get_effective_permissions.return_value = admin_role.permissions
        
        # 管理者はユーザーリソースに対する全操作が可能
        result = await manager.check_resource_permission("admin_user", "users", "read", role_manager)
        assert result == True
        
        result = await manager.check_resource_permission("admin_user", "users", "write", role_manager)
        assert result == True
        
        result = await manager.check_resource_permission("admin_user", "users", "delete", role_manager)
        assert result == True
    
    @pytest.mark.asyncio
    async def test_check_resource_permission_user(self, sample_permissions_config, mock_role_manager):
        """リソース権限チェック（一般ユーザー）のテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        role_manager.get_effective_permissions.return_value = user_role.permissions
        
        # 一般ユーザーはスケジュールの読み取りは可能
        result = await manager.check_resource_permission("normal_user", "schedule", "read", role_manager)
        assert result == True
        
        # 一般ユーザーはユーザー情報の書き込みは不可能
        result = await manager.check_resource_permission("normal_user", "users", "write", role_manager)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_check_ownership_user_owns_resource(self, mock_db_connection):
        """リソース所有権チェック（所有者）のテスト"""
        manager = PermissionManager(db_connection=mock_db_connection)
        
        # ユーザーがリソースを所有している場合
        mock_db_connection.fetchval.return_value = 1
        
        result = await manager.check_ownership("user123", "schedule", "schedule456")
        assert result == True
        
        mock_db_connection.fetchval.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_ownership_user_not_owns_resource(self, mock_db_connection):
        """リソース所有権チェック（非所有者）のテスト"""
        manager = PermissionManager(db_connection=mock_db_connection)
        
        # ユーザーがリソースを所有していない場合
        mock_db_connection.fetchval.return_value = 0
        
        result = await manager.check_ownership("user123", "schedule", "schedule456")
        assert result == False
    
    @pytest.mark.asyncio
    async def test_check_ownership_resource_not_found(self, mock_db_connection):
        """リソース所有権チェック（リソース不存在）のテスト"""
        manager = PermissionManager(db_connection=mock_db_connection)
        
        # リソースが存在しない場合
        mock_db_connection.fetchval.return_value = None
        
        result = await manager.check_ownership("user123", "schedule", "nonexistent")
        assert result == False
    
    def test_register_permission(self, sample_permissions_config):
        """権限登録のテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        # 新しい権限を登録
        result = manager.register_permission("new:permission", "新しい権限")
        assert result == True
        assert "new:permission" in manager.available_permissions
        
        # 既存の権限を登録（上書き）
        result = manager.register_permission("users:read", "ユーザー読み取り権限（更新）")
        assert result == True
    
    def test_get_permission_description(self, sample_permissions_config):
        """権限説明取得のテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        description = manager.get_permission_description("users:read")
        assert description == "ユーザー情報の閲覧"
        
        # 存在しない権限
        description = manager.get_permission_description("nonexistent:permission")
        assert description == "説明なし"
    
    def test_get_all_permissions(self, sample_permissions_config):
        """全権限取得のテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        all_permissions = manager.get_all_permissions()
        
        assert isinstance(all_permissions, dict)
        assert "users:read" in all_permissions
        assert "users:write" in all_permissions
        assert all_permissions["users:read"] == "ユーザー情報の閲覧"
    
    def test_format_resource_permission(self):
        """リソース権限フォーマットのテスト"""
        manager = PermissionManager()
        
        formatted = manager._format_resource_permission("users", "read")
        assert formatted == "users:read"
        
        formatted = manager._format_resource_permission("schedule", "write")
        assert formatted == "schedule:write"
    
    @pytest.mark.asyncio
    async def test_complex_permission_scenario(self, sample_permissions_config, mock_role_manager):
        """複雑な権限シナリオのテスト"""
        manager = PermissionManager()
        manager.load_permissions_from_config(sample_permissions_config)
        
        role_manager, admin_role, user_role, viewer_role = mock_role_manager
        
        # ユーザーが複数ロールを持つ場合
        combined_permissions = user_role.permissions | {"schedule:write"}
        role_manager.get_effective_permissions.return_value = combined_permissions
        
        # 基本権限チェック
        result = await manager.check_permission("multi_role_user", "users:read:self", role_manager)
        assert result == True
        
        result = await manager.check_permission("multi_role_user", "schedule:write", role_manager)
        assert result == True
        
        # 持たない権限
        result = await manager.check_permission("multi_role_user", "users:delete", role_manager)
        assert result == False