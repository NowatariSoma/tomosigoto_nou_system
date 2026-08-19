#!/usr/bin/env python3
"""
統合テスト: 実際のSupabaseトークンを使ったユーザーCRUD操作テスト

このスクリプトは実際のSupabase環境に接続して、
ユーザー関連のCRUD操作をテストします。

使用方法:
    python3 integration_test_users_with_supabase.py

注意:
    - 実際のSupabaseデータベースに接続します
    - テスト用のユーザーを作成・削除する可能性があります
    - 本番環境では使用しないでください
"""

import os
import sys
import json
import requests
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class TestConfig:
    """テスト設定"""
    supabase_url: str
    supabase_anon_key: str
    backend_url: str = "http://localhost:8000"
    test_user_email: str = "integration-test@example.com"
    test_user_password: str = "testpassword123"


class SupabaseAuthClient:
    """Supabase認証クライアント"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.base_url = f"{config.supabase_url}/auth/v1"
        self.headers = {
            "apikey": config.supabase_anon_key,
            "Content-Type": "application/json"
        }
    
    def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        """ユーザー登録"""
        url = f"{self.base_url}/signup"
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """ユーザーログイン"""
        url = f"{self.base_url}/token?grant_type=password"
        data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def get_user(self, access_token: str) -> Dict[str, Any]:
        """ユーザー情報取得"""
        url = f"{self.base_url}/user"
        headers = {**self.headers, "Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        return response.json()


class BackendAPIClient:
    """バックエンドAPIクライアント"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.base_url = config.backend_url
    
    def get_users(self, access_token: str) -> Dict[str, Any]:
        """全ユーザー取得"""
        url = f"{self.base_url}/api/users/"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        return {"status_code": response.status_code, "data": response.json()}
    
    def get_user_by_id(self, user_id: str, access_token: str) -> Dict[str, Any]:
        """特定ユーザー取得"""
        url = f"{self.base_url}/api/users/{user_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        return {"status_code": response.status_code, "data": response.json()}
    
    def get_current_user(self, access_token: str) -> Dict[str, Any]:
        """現在ユーザー取得"""
        url = f"{self.base_url}/api/users/me/"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(url, headers=headers)
        return {"status_code": response.status_code, "data": response.json()}
    
    def create_user(self, user_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """ユーザー作成"""
        url = f"{self.base_url}/api/users/"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.post(url, headers=headers, json=user_data)
        return {"status_code": response.status_code, "data": response.json()}
    
    def update_user(self, user_id: str, update_data: Dict[str, Any], access_token: str) -> Dict[str, Any]:
        """ユーザー更新"""
        url = f"{self.base_url}/api/users/{user_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.put(url, headers=headers, json=update_data)
        return {"status_code": response.status_code, "data": response.json()}
    
    def delete_user(self, user_id: str, access_token: str) -> Dict[str, Any]:
        """ユーザー削除"""
        url = f"{self.base_url}/api/users/{user_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.delete(url, headers=headers)
        return {"status_code": response.status_code, "data": response.json()}
    
    def debug_users_crud(self) -> Dict[str, Any]:
        """デバッグエンドポイント（認証不要）"""
        url = f"{self.base_url}/debug/users-crud"
        
        response = requests.get(url)
        return {"status_code": response.status_code, "data": response.json()}


class IntegrationTestRunner:
    """統合テスト実行クラス"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.supabase_client = SupabaseAuthClient(config)
        self.backend_client = BackendAPIClient(config)
        self.test_results = []
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """テスト結果を記録"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   詳細: {details}")
        
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "details": details
        })
    
    def test_backend_connection(self) -> bool:
        """バックエンド接続テスト"""
        try:
            result = self.backend_client.debug_users_crud()
            if result["status_code"] == 200:
                self.log_test("バックエンド接続", True)
                return True
            else:
                self.log_test("バックエンド接続", False, f"ステータスコード: {result['status_code']}")
                return False
        except Exception as e:
            self.log_test("バックエンド接続", False, f"エラー: {str(e)}")
            return False
    
    def test_supabase_connection(self) -> bool:
        """Supabase接続テスト"""
        try:
            # 既存ユーザーでログインを試行（emailとpasswordをdictで渡す）
            result = self.supabase_client.sign_in("admin001@mail.doshisha.ac.jp", "password123")
            if "access_token" in result:
                self.log_test("Supabase接続", True)
                return True, result["access_token"]
            else:
                # デバッグのためレスポンスを出力
                print(f"Login response: {result}")
                self.log_test("Supabase接続", False, f"ログイン失敗: {result}")
                return False, None
        except Exception as e:
            self.log_test("Supabase接続", False, f"エラー: {str(e)}")
            return False, None
    
    def test_authentication_flow(self) -> Optional[str]:
        """認証フローテスト"""
        try:
            # テストユーザー作成
            signup_result = self.supabase_client.sign_up(
                self.config.test_user_email,
                self.config.test_user_password
            )
            
            if "access_token" in signup_result:
                self.log_test("認証フロー（ユーザー作成）", True)
                return signup_result["access_token"]
            else:
                # 既存ユーザーの場合はログイン
                signin_result = self.supabase_client.sign_in(
                    self.config.test_user_email,
                    self.config.test_user_password
                )
                
                if "access_token" in signin_result:
                    self.log_test("認証フロー（既存ユーザーログイン）", True)
                    return signin_result["access_token"]
                else:
                    self.log_test("認証フロー", False, "トークン取得失敗")
                    return None
        except Exception as e:
            self.log_test("認証フロー", False, f"エラー: {str(e)}")
            return None
    
    def test_crud_operations(self, access_token: str) -> bool:
        """CRUD操作テスト"""
        success = True
        
        # 1. 現在ユーザー取得テスト
        try:
            result = self.backend_client.get_current_user(access_token)
            if result["status_code"] == 200:
                self.log_test("現在ユーザー取得", True)
            else:
                self.log_test("現在ユーザー取得", False, f"ステータスコード: {result['status_code']}")
                success = False
        except Exception as e:
            self.log_test("現在ユーザー取得", False, f"エラー: {str(e)}")
            success = False
        
        # 2. 全ユーザー取得テスト
        try:
            result = self.backend_client.get_users(access_token)
            if result["status_code"] == 200:
                self.log_test("全ユーザー取得", True)
            else:
                self.log_test("全ユーザー取得", False, f"ステータスコード: {result['status_code']}")
                success = False
        except Exception as e:
            self.log_test("全ユーザー取得", False, f"エラー: {str(e)}")
            success = False
        
        # 3. 特定ユーザー取得テスト（自分のIDを使用）
        try:
            current_user_result = self.backend_client.get_current_user(access_token)
            if current_user_result["status_code"] == 200:
                user_id = current_user_result["data"]["id"]
                result = self.backend_client.get_user_by_id(user_id, access_token)
                if result["status_code"] == 200:
                    self.log_test("特定ユーザー取得", True)
                else:
                    self.log_test("特定ユーザー取得", False, f"ステータスコード: {result['status_code']}")
                    success = False
            else:
                self.log_test("特定ユーザー取得", False, "現在ユーザー取得に失敗")
                success = False
        except Exception as e:
            self.log_test("特定ユーザー取得", False, f"エラー: {str(e)}")
            success = False
        
        return success
    
    def test_error_handling(self) -> bool:
        """エラーハンドリングテスト"""
        success = True
        
        # 1. 無効なトークンでのアクセス
        try:
            result = self.backend_client.get_users("invalid-token")
            if result["status_code"] == 401:
                self.log_test("無効トークンエラー", True)
            else:
                self.log_test("無効トークンエラー", False, f"期待: 401, 実際: {result['status_code']}")
                success = False
        except Exception as e:
            self.log_test("無効トークンエラー", False, f"エラー: {str(e)}")
            success = False
        
        # 2. 認証なしでのアクセス
        try:
            result = self.backend_client.get_users("")
            if result["status_code"] in [401, 403]:
                self.log_test("認証なしエラー", True)
            else:
                self.log_test("認証なしエラー", False, f"期待: 401/403, 実際: {result['status_code']}")
                success = False
        except Exception as e:
            self.log_test("認証なしエラー", False, f"エラー: {str(e)}")
            success = False
        
        return success
    
    def run_all_tests(self) -> bool:
        """全テスト実行"""
        print("🚀 ユーザーCRUD操作統合テスト開始")
        print("=" * 50)
        
        # 1. バックエンド接続テスト
        if not self.test_backend_connection():
            print("❌ バックエンド接続に失敗しました")
            return False
        
        # 2. Supabase接続テスト
        supabase_success, admin_token = self.test_supabase_connection()
        if not supabase_success:
            print("❌ Supabase接続に失敗しました")
            return False
        
        # 3. 認証フローテスト
        test_token = self.test_authentication_flow()
        if not test_token:
            print("❌ 認証フローに失敗しました")
            return False
        
        # 4. CRUD操作テスト
        if not self.test_crud_operations(test_token):
            print("❌ CRUD操作テストに失敗しました")
            return False
        
        # 5. エラーハンドリングテスト
        if not self.test_error_handling():
            print("❌ エラーハンドリングテストに失敗しました")
            return False
        
        print("=" * 50)
        print("✅ 全テスト完了")
        
        # 結果サマリー
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"📊 テスト結果: {passed}/{total} 成功")
        
        return passed == total


def load_config() -> TestConfig:
    """設定読み込み"""
    # 環境変数から設定を読み込み
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_anon_key = os.environ["SUPABASE_ANON_KEY"]
    
    return TestConfig(
        supabase_url=supabase_url,
        supabase_anon_key=supabase_anon_key
    )


def main():
    """メイン関数"""
    print("🔧 ユーザーCRUD操作統合テスト")
    print("=" * 50)
    
    # 設定読み込み
    config = load_config()
    print(f"Supabase URL: {config.supabase_url}")
    print(f"バックエンド URL: {config.backend_url}")
    print(f"テストユーザー: {config.test_user_email}")
    print("=" * 50)
    
    # テスト実行
    runner = IntegrationTestRunner(config)
    success = runner.run_all_tests()
    
    if success:
        print("\n🎉 全テストが成功しました！")
        sys.exit(0)
    else:
        print("\n💥 一部のテストが失敗しました")
        sys.exit(1)


if __name__ == "__main__":
    main() 