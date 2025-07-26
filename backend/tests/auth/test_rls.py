import pytest
from unittest.mock import Mock, AsyncMock, patch
import json
import tempfile
import os

from app.auth.rls import RLSPolicyManager


class TestRLSPolicyManager:
    """RLSPolicyManagerクラスのテスト"""
    
    @pytest.fixture
    def mock_supabase_client(self):
        """モックSupabaseクライアント"""
        return Mock()
    
    @pytest.fixture
    def mock_db_connection(self):
        """モックデータベース接続"""
        return AsyncMock()
    
    @pytest.fixture
    def sample_rls_config(self):
        """サンプルRLSポリシー設定ファイル"""
        config_data = {
            "policies": {
                "users": [
                    {
                        "name": "users_select_policy",
                        "type": "SELECT",
                        "definition": {
                            "using": "auth.uid() = id OR has_role(auth.uid(), 'admin')"
                        },
                        "description": "ユーザーは自分の情報または管理者のみ閲覧可能"
                    },
                    {
                        "name": "users_update_policy", 
                        "type": "UPDATE",
                        "definition": {
                            "using": "auth.uid() = id",
                            "with_check": "auth.uid() = id"
                        },
                        "description": "ユーザーは自分の情報のみ更新可能"
                    }
                ],
                "user_roles": [
                    {
                        "name": "user_roles_select_policy",
                        "type": "SELECT", 
                        "definition": {
                            "using": "user_id = auth.uid() OR has_role(auth.uid(), 'admin')"
                        },
                        "description": "ユーザーは自分のロールまたは管理者のみ閲覧可能"
                    },
                    {
                        "name": "user_roles_insert_policy",
                        "type": "INSERT",
                        "definition": {
                            "with_check": "has_role(auth.uid(), 'admin')"
                        },
                        "description": "管理者のみロール割り当て可能"
                    }
                ],
                "schedules": [
                    {
                        "name": "schedules_select_policy",
                        "type": "SELECT",
                        "definition": {
                            "using": "is_visible_to_general = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin')"
                        },
                        "description": "一般公開またはオーナーまたは管理者のみ閲覧可能"
                    },
                    {
                        "name": "schedules_insert_policy",
                        "type": "INSERT",
                        "definition": {
                            "with_check": "created_by = auth.uid() AND has_permission(auth.uid(), 'schedule:write')"
                        },
                        "description": "権限を持つユーザーのみスケジュール作成可能"
                    },
                    {
                        "name": "schedules_update_policy",
                        "type": "UPDATE",
                        "definition": {
                            "using": "created_by = auth.uid() OR has_role(auth.uid(), 'admin')",
                            "with_check": "created_by = auth.uid() OR has_role(auth.uid(), 'admin')"
                        },
                        "description": "オーナーまたは管理者のみスケジュール更新可能"
                    }
                ]
            },
            "functions": [
                {
                    "name": "has_role",
                    "definition": "CREATE OR REPLACE FUNCTION has_role(user_id UUID, role_name TEXT) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role_type = $2); END; $$ LANGUAGE plpgsql SECURITY DEFINER;",
                    "description": "ユーザーが指定ロールを持っているかチェック"
                },
                {
                    "name": "has_permission",
                    "definition": "CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT) RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS(SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = $2); END; $$ LANGUAGE plpgsql SECURITY DEFINER;",
                    "description": "ユーザーが指定権限を持っているかチェック"
                }
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            config_path = f.name
        
        yield config_path
        
        # クリーンアップ
        os.unlink(config_path)
    
    def test_rls_policy_manager_initialization(self, mock_supabase_client, mock_db_connection):
        """RLSPolicyManagerの初期化テスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        assert manager._supabase_client == mock_supabase_client
        assert manager._db_connection == mock_db_connection
    
    @pytest.mark.asyncio
    async def test_apply_rls_policies(self, mock_supabase_client, mock_db_connection, sample_rls_config):
        """RLSポリシー適用のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        # データベース操作のモック
        mock_db_connection.execute.return_value = None
        
        result = await manager.apply_rls_policies(sample_rls_config)
        
        assert result == True
        # 複数のexecuteが呼ばれることを確認
        assert mock_db_connection.execute.call_count > 0
    
    @pytest.mark.asyncio
    async def test_create_policy_select(self, mock_supabase_client, mock_db_connection):
        """SELECTポリシー作成のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "SELECT",
            "definition": {
                "using": "auth.uid() = user_id"
            }
        }
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.create_policy("test_table", "test_policy", policy_definition)
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
        
        # SQL文の内容を確認
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "CREATE POLICY" in call_args
        assert "test_policy" in call_args
        assert "test_table" in call_args
        assert "FOR SELECT" in call_args
        assert "auth.uid() = user_id" in call_args
    
    @pytest.mark.asyncio
    async def test_create_policy_insert(self, mock_supabase_client, mock_db_connection):
        """INSERTポリシー作成のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "INSERT",
            "definition": {
                "with_check": "auth.uid() = user_id"
            }
        }
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.create_policy("test_table", "test_insert_policy", policy_definition)
        
        assert result == True
        
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "CREATE POLICY" in call_args
        assert "FOR INSERT" in call_args
        assert "WITH CHECK" in call_args
    
    @pytest.mark.asyncio
    async def test_create_policy_update(self, mock_supabase_client, mock_db_connection):
        """UPDATEポリシー作成のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "UPDATE",
            "definition": {
                "using": "auth.uid() = user_id",
                "with_check": "auth.uid() = user_id"
            }
        }
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.create_policy("test_table", "test_update_policy", policy_definition)
        
        assert result == True
        
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "CREATE POLICY" in call_args
        assert "FOR UPDATE" in call_args
        assert "USING" in call_args
        assert "WITH CHECK" in call_args
    
    @pytest.mark.asyncio
    async def test_drop_policy(self, mock_supabase_client, mock_db_connection):
        """ポリシー削除のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.drop_policy("test_table", "test_policy")
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
        
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "DROP POLICY" in call_args
        assert "test_policy" in call_args
        assert "test_table" in call_args
    
    @pytest.mark.asyncio
    async def test_enable_rls(self, mock_supabase_client, mock_db_connection):
        """RLS有効化のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.enable_rls("test_table")
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
        
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "ALTER TABLE" in call_args
        assert "test_table" in call_args
        assert "ENABLE ROW LEVEL SECURITY" in call_args
    
    @pytest.mark.asyncio
    async def test_disable_rls(self, mock_supabase_client, mock_db_connection):
        """RLS無効化のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        mock_db_connection.execute.return_value = None
        
        result = await manager.disable_rls("test_table")
        
        assert result == True
        mock_db_connection.execute.assert_called_once()
        
        call_args = mock_db_connection.execute.call_args[0][0]
        assert "ALTER TABLE" in call_args
        assert "test_table" in call_args
        assert "DISABLE ROW LEVEL SECURITY" in call_args
    
    @pytest.mark.asyncio
    async def test_get_active_policies_all_tables(self, mock_supabase_client, mock_db_connection):
        """全テーブルのアクティブポリシー取得のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        # モック結果
        mock_policies = [
            {"tablename": "users", "policyname": "users_select_policy", "cmd": "SELECT"},
            {"tablename": "users", "policyname": "users_update_policy", "cmd": "UPDATE"},
            {"tablename": "schedules", "policyname": "schedules_select_policy", "cmd": "SELECT"}
        ]
        mock_db_connection.fetch.return_value = mock_policies
        
        result = await manager.get_active_policies()
        
        assert isinstance(result, dict)
        assert "users" in result
        assert "schedules" in result
        assert len(result["users"]) == 2
        assert len(result["schedules"]) == 1
    
    @pytest.mark.asyncio
    async def test_get_active_policies_specific_table(self, mock_supabase_client, mock_db_connection):
        """特定テーブルのアクティブポリシー取得のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        mock_policies = [
            {"tablename": "users", "policyname": "users_select_policy", "cmd": "SELECT"},
            {"tablename": "users", "policyname": "users_update_policy", "cmd": "UPDATE"}
        ]
        mock_db_connection.fetch.return_value = mock_policies
        
        result = await manager.get_active_policies("users")
        
        assert isinstance(result, dict)
        assert "users" in result
        assert len(result["users"]) == 2
    
    @pytest.mark.asyncio
    async def test_test_policy_success(self, mock_supabase_client, mock_db_connection):
        """ポリシーテスト（成功）のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        # テスト用のユーザーとデータを設定
        test_data = {"name": "Test User", "email": "test@example.com"}
        
        # ポリシーテストが成功することをシミュレート
        mock_db_connection.fetchval.return_value = True
        
        result = await manager.test_policy("users", "users_select_policy", "user123", "SELECT", test_data)
        
        assert result == True
        mock_db_connection.fetchval.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_test_policy_failure(self, mock_supabase_client, mock_db_connection):
        """ポリシーテスト（失敗）のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        # ポリシーテストが失敗することをシミュレート
        mock_db_connection.fetchval.return_value = False
        
        result = await manager.test_policy("users", "users_select_policy", "user123", "SELECT")
        
        assert result == False
    
    def test_build_policy_expression_select(self, mock_supabase_client, mock_db_connection):
        """SELECTポリシー式構築のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "SELECT",
            "definition": {
                "using": "auth.uid() = user_id"
            }
        }
        
        expression = manager._build_policy_expression(policy_definition)
        
        assert "FOR SELECT" in expression
        assert "USING (auth.uid() = user_id)" in expression
    
    def test_build_policy_expression_insert(self, mock_supabase_client, mock_db_connection):
        """INSERTポリシー式構築のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "INSERT",
            "definition": {
                "with_check": "auth.uid() = user_id"
            }
        }
        
        expression = manager._build_policy_expression(policy_definition)
        
        assert "FOR INSERT" in expression
        assert "WITH CHECK (auth.uid() = user_id)" in expression
    
    def test_build_policy_expression_update(self, mock_supabase_client, mock_db_connection):
        """UPDATEポリシー式構築のテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        policy_definition = {
            "type": "UPDATE",
            "definition": {
                "using": "auth.uid() = user_id",
                "with_check": "auth.uid() = user_id"
            }
        }
        
        expression = manager._build_policy_expression(policy_definition)
        
        assert "FOR UPDATE" in expression
        assert "USING (auth.uid() = user_id)" in expression
        assert "WITH CHECK (auth.uid() = user_id)" in expression
    
    def test_validate_policy_definition_valid(self, mock_supabase_client, mock_db_connection):
        """有効なポリシー定義の検証テスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        valid_policy = {
            "type": "SELECT",
            "definition": {
                "using": "auth.uid() = user_id"
            }
        }
        
        result = manager._validate_policy_definition(valid_policy)
        assert result == True
    
    def test_validate_policy_definition_invalid_type(self, mock_supabase_client, mock_db_connection):
        """無効なタイプのポリシー定義検証テスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        invalid_policy = {
            "type": "INVALID",
            "definition": {
                "using": "auth.uid() = user_id"
            }
        }
        
        result = manager._validate_policy_definition(invalid_policy)
        assert result == False
    
    def test_validate_policy_definition_missing_definition(self, mock_supabase_client, mock_db_connection):
        """定義が不足しているポリシーの検証テスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        invalid_policy = {
            "type": "SELECT"
        }
        
        result = manager._validate_policy_definition(invalid_policy)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_error_handling_database_error(self, mock_supabase_client, mock_db_connection):
        """データベースエラーハンドリングのテスト"""
        manager = RLSPolicyManager(mock_supabase_client, mock_db_connection)
        
        # データベースエラーをシミュレート
        mock_db_connection.execute.side_effect = Exception("Database connection error")
        
        result = await manager.enable_rls("test_table")
        
        assert result == False