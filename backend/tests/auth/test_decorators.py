import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials
import json

from app.auth.decorators import (
    require_permission,
    require_role,
    resource_permission,
    resource_owner,
    get_user_id_from_request,
    get_role_manager,
    get_permission_manager
)
from app.auth.roles import RoleManager, Role
from app.auth.permissions import PermissionManager


class TestHelperFunctions:
    """ヘルパー関数のテスト"""
    
    @pytest.mark.asyncio
    async def test_get_user_id_from_request_with_token(self):
        """リクエストからユーザーID取得のテスト（トークンあり）"""
        # モックリクエスト
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer test_token"}
        
        # モックSupabaseサービス
        with patch("app.auth.decorators.supabase_service") as mock_supabase:
            mock_user = {"id": "user123", "email": "test@example.com"}
            mock_supabase.verify_jwt_token.return_value = mock_user
            
            user_id = await get_user_id_from_request(mock_request)
            assert user_id == "user123"
    
    @pytest.mark.asyncio
    async def test_get_user_id_from_request_invalid_token(self):
        """リクエストからユーザーID取得のテスト（無効トークン）"""
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer invalid_token"}
        
        with patch("app.auth.decorators.supabase_service") as mock_supabase:
            mock_supabase.verify_jwt_token.return_value = None
            
            with pytest.raises(HTTPException) as exc_info:
                await get_user_id_from_request(mock_request)
            
            assert exc_info.value.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_user_id_from_request_no_token(self):
        """リクエストからユーザーID取得のテスト（トークンなし）"""
        mock_request = Mock(spec=Request)
        mock_request.headers = {}
        
        with pytest.raises(HTTPException) as exc_info:
            await get_user_id_from_request(mock_request)
        
        assert exc_info.value.status_code == 401
    
    def test_get_role_manager(self):
        """RoleManager取得のテスト"""
        with patch("app.auth.decorators.role_manager_instance") as mock_instance:
            result = get_role_manager()
            assert result == mock_instance
    
    def test_get_permission_manager(self):
        """PermissionManager取得のテスト"""
        with patch("app.auth.decorators.permission_manager_instance") as mock_instance:
            result = get_permission_manager()
            assert result == mock_instance


class TestRequirePermissionDecorator:
    """require_permissionデコレータのテスト"""
    
    @pytest.mark.asyncio
    async def test_require_permission_success(self):
        """権限チェック成功のテスト"""
        # モック関数
        @require_permission("users:read")
        async def test_endpoint(request: Request):
            return {"message": "success"}
        
        # モックリクエスト
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        # モックサービス
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_permission.return_value = True
            mock_get_pm.return_value = mock_permission_manager
            mock_get_rm.return_value = Mock()
            
            result = await test_endpoint(mock_request)
            assert result == {"message": "success"}
            mock_permission_manager.check_permission.assert_called_once_with(
                "user123", "users:read", mock_get_rm.return_value
            )
    
    @pytest.mark.asyncio
    async def test_require_permission_failure(self):
        """権限チェック失敗のテスト"""
        @require_permission("users:write")
        async def test_endpoint(request: Request):
            return {"message": "success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_permission.return_value = False
            mock_get_pm.return_value = mock_permission_manager
            mock_get_rm.return_value = Mock()
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request)
            
            assert exc_info.value.status_code == 403
            assert "権限が不足しています" in str(exc_info.value.detail)


class TestRequireRoleDecorator:
    """require_roleデコレータのテスト"""
    
    @pytest.mark.asyncio
    async def test_require_role_success(self):
        """ロールチェック成功のテスト"""
        @require_role("admin")
        async def test_endpoint(request: Request):
            return {"message": "admin success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer admin_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "admin_user"
            mock_role_manager = Mock()
            mock_role_manager.has_role.return_value = True
            mock_get_rm.return_value = mock_role_manager
            
            result = await test_endpoint(mock_request)
            assert result == {"message": "admin success"}
            mock_role_manager.has_role.assert_called_once_with("admin_user", "admin")
    
    @pytest.mark.asyncio
    async def test_require_role_failure(self):
        """ロールチェック失敗のテスト"""
        @require_role("admin")
        async def test_endpoint(request: Request):
            return {"message": "admin success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer user_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "normal_user"
            mock_role_manager = Mock()
            mock_role_manager.has_role.return_value = False
            mock_get_rm.return_value = mock_role_manager
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request)
            
            assert exc_info.value.status_code == 403
            assert "必要なロールが不足しています" in str(exc_info.value.detail)


class TestResourcePermissionDecorator:
    """resource_permissionデコレータのテスト"""
    
    @pytest.mark.asyncio
    async def test_resource_permission_success(self):
        """リソース権限チェック成功のテスト"""
        @resource_permission("users", "read")
        async def test_endpoint(request: Request):
            return {"message": "resource access success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_resource_permission.return_value = True
            mock_get_pm.return_value = mock_permission_manager
            mock_get_rm.return_value = Mock()
            
            result = await test_endpoint(mock_request)
            assert result == {"message": "resource access success"}
            mock_permission_manager.check_resource_permission.assert_called_once_with(
                "user123", "users", "read", mock_get_rm.return_value
            )
    
    @pytest.mark.asyncio
    async def test_resource_permission_failure(self):
        """リソース権限チェック失敗のテスト"""
        @resource_permission("users", "delete")
        async def test_endpoint(request: Request):
            return {"message": "resource access success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_resource_permission.return_value = False
            mock_get_pm.return_value = mock_permission_manager
            mock_get_rm.return_value = Mock()
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request)
            
            assert exc_info.value.status_code == 403
            assert "リソースへのアクセス権限が不足しています" in str(exc_info.value.detail)


class TestResourceOwnerDecorator:
    """resource_ownerデコレータのテスト"""
    
    @pytest.mark.asyncio
    async def test_resource_owner_success(self):
        """リソース所有者チェック成功のテスト"""
        @resource_owner("schedule", "schedule_id")
        async def test_endpoint(request: Request, schedule_id: str):
            return {"message": f"access to schedule {schedule_id}"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_ownership.return_value = True
            mock_get_pm.return_value = mock_permission_manager
            
            result = await test_endpoint(mock_request, "schedule456")
            assert result == {"message": "access to schedule schedule456"}
            mock_permission_manager.check_ownership.assert_called_once_with(
                "user123", "schedule", "schedule456"
            )
    
    @pytest.mark.asyncio
    async def test_resource_owner_failure(self):
        """リソース所有者チェック失敗のテスト"""
        @resource_owner("schedule", "schedule_id")
        async def test_endpoint(request: Request, schedule_id: str):
            return {"message": f"access to schedule {schedule_id}"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm:
            
            mock_get_user_id.return_value = "user123"
            mock_permission_manager = Mock()
            mock_permission_manager.check_ownership.return_value = False
            mock_get_pm.return_value = mock_permission_manager
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request, "schedule456")
            
            assert exc_info.value.status_code == 403
            assert "リソースの所有者ではありません" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_resource_owner_missing_parameter(self):
        """リソース所有者チェック（パラメータ不足）のテスト"""
        @resource_owner("schedule", "schedule_id")
        async def test_endpoint(request: Request):
            return {"message": "no schedule id"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id:
            mock_get_user_id.return_value = "user123"
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request)
            
            assert exc_info.value.status_code == 400
            assert "パラメータが不足しています" in str(exc_info.value.detail)


class TestDecoratorCombination:
    """デコレータの組み合わせテスト"""
    
    @pytest.mark.asyncio
    async def test_multiple_decorators_success(self):
        """複数デコレータの成功テスト"""
        @require_role("admin")
        @require_permission("users:write")
        async def test_endpoint(request: Request):
            return {"message": "admin user write success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer admin_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm:
            
            mock_get_user_id.return_value = "admin_user"
            
            # ロールチェック成功
            mock_role_manager = Mock()
            mock_role_manager.has_role.return_value = True
            mock_get_rm.return_value = mock_role_manager
            
            # 権限チェック成功
            mock_permission_manager = Mock()
            mock_permission_manager.check_permission.return_value = True
            mock_get_pm.return_value = mock_permission_manager
            
            result = await test_endpoint(mock_request)
            assert result == {"message": "admin user write success"}
    
    @pytest.mark.asyncio
    async def test_multiple_decorators_role_failure(self):
        """複数デコレータのロール失敗テスト"""
        @require_role("admin")
        @require_permission("users:write")
        async def test_endpoint(request: Request):
            return {"message": "admin user write success"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer user_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "normal_user"
            
            # ロールチェック失敗
            mock_role_manager = Mock()
            mock_role_manager.has_role.return_value = False
            mock_get_rm.return_value = mock_role_manager
            
            with pytest.raises(HTTPException) as exc_info:
                await test_endpoint(mock_request)
            
            assert exc_info.value.status_code == 403
            assert "必要なロールが不足しています" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_resource_owner_and_permission_success(self):
        """リソース所有者と権限の組み合わせ成功テスト"""
        @resource_owner("schedule", "schedule_id")
        @require_permission("schedule:write")
        async def test_endpoint(request: Request, schedule_id: str):
            return {"message": f"modified schedule {schedule_id}"}
        
        mock_request = Mock(spec=Request)
        mock_request.headers = {"authorization": "Bearer valid_token"}
        
        with patch("app.auth.decorators.get_user_id_from_request") as mock_get_user_id, \
             patch("app.auth.decorators.get_permission_manager") as mock_get_pm, \
             patch("app.auth.decorators.get_role_manager") as mock_get_rm:
            
            mock_get_user_id.return_value = "user123"
            
            # 所有者チェック成功
            mock_permission_manager = Mock()
            mock_permission_manager.check_ownership.return_value = True
            mock_permission_manager.check_permission.return_value = True
            mock_get_pm.return_value = mock_permission_manager
            mock_get_rm.return_value = Mock()
            
            result = await test_endpoint(mock_request, "schedule456")
            assert result == {"message": "modified schedule schedule456"}