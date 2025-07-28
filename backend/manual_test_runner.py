#!/usr/bin/env python3
"""
Manual test runner for RBAC system tests
Due to pytest setup issues, we run tests manually to verify functionality
"""

import sys
import os
import asyncio
import tempfile
import json
from unittest.mock import Mock, AsyncMock

# Add the backend directory to Python path
sys.path.insert(0, '/home/runner/work/tomosigoto_nou_system/tomosigoto_nou_system/backend')

# Import test classes
from tests.auth.test_roles import TestRole, TestRoleManager
from tests.auth.test_permissions import TestPermissionManager

def create_sample_config_file():
    """Create a sample configuration file for testing"""
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
        return f.name

def create_permission_config_file():
    """Create a sample permission configuration file"""
    config_data = {
        "permissions": {
            "users:read": "ユーザー情報の読み取り",
            "users:write": "ユーザー情報の書き込み",
            "roles:manage": "ロール管理",
            "schedule:read": "スケジュール読み取り",
            "schedule:write": "スケジュール書き込み"
        },
        "resource_permissions": {
            "users": ["read", "write", "delete"],
            "schedule": ["read", "write", "delete"]
        }
    }
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config_data, f)
        return f.name

def run_role_tests():
    """Run all Role class tests"""
    print("=== ロール管理テストの実行 ===")
    
    test_role = TestRole()
    passed = 0
    failed = 0
    
    tests = [
        ("test_role_creation", test_role.test_role_creation),
        ("test_role_with_inheritance", test_role.test_role_with_inheritance),
        ("test_has_permission", test_role.test_has_permission),
        ("test_add_permission", test_role.test_add_permission),
        ("test_remove_permission", test_role.test_remove_permission),
        ("test_get_all_permissions_simple", test_role.test_get_all_permissions_simple),
        ("test_get_all_permissions_with_inheritance", test_role.test_get_all_permissions_with_inheritance),
        ("test_to_dict", test_role.test_to_dict),
        ("test_from_dict", test_role.test_from_dict),
    ]
    
    for test_name, test_method in tests:
        try:
            test_method()
            print(f"✅ {test_name} - PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test_name} - FAILED: {e}")
            failed += 1
    
    print(f"\n📊 ロール管理テスト結果: {passed} passed, {failed} failed")
    return passed, failed

async def run_role_manager_tests():
    """Run all RoleManager class tests"""
    print("\n=== ロールマネージャーテストの実行 ===")
    
    test_manager = TestRoleManager()
    mock_db_connection = AsyncMock()
    sample_config_file = create_sample_config_file()
    
    passed = 0
    failed = 0
    
    # Sync tests
    sync_tests = [
        ("test_role_manager_initialization", lambda: test_manager.test_role_manager_initialization(mock_db_connection)),
        ("test_load_roles_from_config", lambda: test_manager.test_load_roles_from_config(mock_db_connection, sample_config_file)),
        ("test_get_role", lambda: test_manager.test_get_role(mock_db_connection, sample_config_file)),
        ("test_get_role_hierarchy", lambda: test_manager.test_get_role_hierarchy(mock_db_connection, sample_config_file)),
    ]
    
    for test_name, test_method in sync_tests:
        try:
            test_method()
            print(f"✅ {test_name} - PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test_name} - FAILED: {e}")
            failed += 1
    
    # Async tests
    async_tests = [
        ("test_get_user_roles", test_manager.test_get_user_roles),
        ("test_assign_role", test_manager.test_assign_role),
        ("test_assign_nonexistent_role", test_manager.test_assign_nonexistent_role),
        ("test_remove_role", test_manager.test_remove_role),
        ("test_has_role", test_manager.test_has_role),
        ("test_get_effective_permissions", test_manager.test_get_effective_permissions),
    ]
    
    for test_name, test_method in async_tests:
        try:
            if test_name == "test_assign_nonexistent_role":
                await test_method(mock_db_connection)
            else:
                await test_method(mock_db_connection, sample_config_file)
            print(f"✅ {test_name} - PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test_name} - FAILED: {e}")
            failed += 1
    
    # Cleanup
    os.unlink(sample_config_file)
    
    print(f"\n📊 ロールマネージャーテスト結果: {passed} passed, {failed} failed")
    return passed, failed

async def run_permission_tests():
    """Run all PermissionManager class tests"""
    print("\n=== 権限管理テストの実行 ===")
    
    test_permission = TestPermissionManager()
    permission_config_file = create_permission_config_file()
    
    passed = 0
    failed = 0
    
    # Sync tests
    sync_tests = [
        ("test_permission_manager_initialization", lambda: test_permission.test_permission_manager_initialization()),
        ("test_load_permissions_from_config", lambda: test_permission.test_load_permissions_from_config(permission_config_file)),
        ("test_is_valid_permission", lambda: test_permission.test_is_valid_permission(permission_config_file)),
        ("test_register_permission", lambda: test_permission.test_register_permission()),
        ("test_get_permission_description", lambda: test_permission.test_get_permission_description(permission_config_file)),
        ("test_get_all_permissions", lambda: test_permission.test_get_all_permissions(permission_config_file)),
        ("test_format_resource_permission", lambda: test_permission.test_format_resource_permission()),
    ]
    
    for test_name, test_method in sync_tests:
        try:
            test_method()
            print(f"✅ {test_name} - PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test_name} - FAILED: {e}")
            failed += 1
    
    # Cleanup
    os.unlink(permission_config_file)
    
    print(f"\n📊 権限管理テスト結果: {passed} passed, {failed} failed")
    return passed, failed

def run_api_endpoint_tests():
    """Check API endpoint structure and imports"""
    print("\n=== APIエンドポイントテスト ===")
    
    passed = 0
    failed = 0
    
    try:
        # Test API schema imports
        from app.api.auth.role_schemas import (
            RoleResponse, RoleAssignment, RoleAssignmentResponse,
            UserRolesResponse, EffectivePermissionsResponse,
            PermissionCheckRequest, PermissionCheckResponse,
            ResourcePermissionCheckRequest, ResourcePermissionCheckResponse
        )
        print("✅ APIスキーマ定義 - PASSED")
        passed += 1
    except Exception as e:
        print(f"❌ APIスキーマ定義 - FAILED: {e}")
        failed += 1
    
    try:
        # Test API routes import
        from app.api.auth.role_routes import router
        print("✅ APIルート定義 - PASSED") 
        passed += 1
    except Exception as e:
        print(f"❌ APIルート定義 - FAILED: {e}")
        failed += 1
    
    try:
        # Test decorators import
        from app.auth.decorators import require_permission, require_role, resource_permission, resource_owner
        print("✅ 認証デコレータ - PASSED")
        passed += 1
    except Exception as e:
        print(f"❌ 認証デコレータ - FAILED: {e}")
        failed += 1
    
    print(f"\n📊 APIエンドポイントテスト結果: {passed} passed, {failed} failed")
    return passed, failed

async def main():
    """Main test execution function"""
    print("🚀 RBACシステム テスト実行開始\n")
    
    total_passed = 0
    total_failed = 0
    
    # Run all test categories
    role_passed, role_failed = run_role_tests()
    total_passed += role_passed
    total_failed += role_failed
    
    mgr_passed, mgr_failed = await run_role_manager_tests()
    total_passed += mgr_passed
    total_failed += mgr_failed
    
    perm_passed, perm_failed = await run_permission_tests()
    total_passed += perm_passed
    total_failed += perm_failed
    
    api_passed, api_failed = run_api_endpoint_tests()
    total_passed += api_passed
    total_failed += api_failed
    
    print(f"\n🎯 全体テスト結果:")
    print(f"✅ 成功: {total_passed}")
    print(f"❌ 失敗: {total_failed}")
    print(f"📈 成功率: {total_passed/(total_passed+total_failed)*100:.1f}%")
    
    if total_failed == 0:
        print("\n🎉 全てのテストが成功しました！")
    else:
        print(f"\n⚠️  {total_failed}個のテストが失敗しました")

if __name__ == "__main__":
    asyncio.run(main())