#!/usr/bin/env python3
"""
Supabase RLS (Row Level Security) テストスクリプト
SECURITY_ANALYSIS.md に基づくセキュリティテスト
リモートプロジェクト uilydqaqephxtcnnqihy 用
"""

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

import requests

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class SecurityRLSTester:
    """RLSポリシーのテストを行うクラス"""

    def __init__(self):
        # リモートプロジェクトの設定
        self.supabase_url = "https://uilydqaqephxtcnnqihy.supabase.co"
        self.anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak"
        self.service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY0MDE3NSwiZXhwIjoyMDY2MjE2MTc1fQ.XOoBsrjpvJ36CbQcbk_rfqg-HcZNKKxYvkrAlaoPgRc"

        # テスト用ユーザーID
        self.test_user_ids = [
            "11111111-1111-1111-1111-111111111111",
            "22222222-2222-2222-2222-222222222222",
            "33333333-3333-3333-3333-333333333333",
        ]

    def make_request(
        self, endpoint: str, headers: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """Supabase APIにリクエストを送信"""
        url = f"{self.supabase_url}/rest/v1/{endpoint}"
        default_headers = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {self.anon_key}",
            "Content-Type": "application/json",
        }

        if headers:
            default_headers.update(headers)

        try:
            response = requests.get(url, headers=default_headers)
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else None,
                "headers": dict(response.headers),
            }
        except Exception as e:
            return {"status_code": 500, "error": str(e), "data": None}

    def test_users_table_access(self):
        """public.usersテーブルのアクセス制御をテスト"""
        print("🔒 Testing public.users table access control...")

        # 1. 匿名ユーザーでのアクセス（制限されるべき）
        print("  Testing anonymous access...")
        result = self.make_request("users")
        if result["status_code"] == 200:
            print(
                f"    ❌ Anonymous access should be restricted, but got {len(result['data'])} users"
            )
        else:
            print(
                f"    ✅ Anonymous access properly restricted (status: {result['status_code']})"
            )

        # 2. サービスロールでのアクセス（全データ取得可能）
        print("  Testing service role access...")
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }
        result = self.make_request("users", headers)
        if result["status_code"] == 200:
            print(
                f"    ✅ Service role can access all users ({len(result['data'])} users)"
            )
        else:
            print(
                f"    ❌ Service role access failed (status: {result['status_code']})"
            )

    def test_user_profiles_table_access(self):
        """public.user_profilesテーブルのアクセス制御をテスト"""
        print("🔒 Testing public.user_profiles table access control...")

        # 匿名ユーザーでのアクセス
        result = self.make_request("user_profiles")
        if result["status_code"] == 200:
            print(
                f"    ❌ Anonymous access should be restricted, but got {len(result['data'])} profiles"
            )
        else:
            print(
                f"    ✅ Anonymous access properly restricted (status: {result['status_code']})"
            )

    def test_venues_table_access(self):
        """public.venuesテーブルのアクセス制御をテスト"""
        print("🔒 Testing public.venues table access control...")

        # 匿名ユーザーでのアクセス（認証済みユーザーのみアクセス可能）
        result = self.make_request("venues")
        if result["status_code"] == 200:
            print(
                f"    ❌ Anonymous access should be restricted, but got {len(result['data'])} venues"
            )
        else:
            print(
                f"    ✅ Anonymous access properly restricted (status: {result['status_code']})"
            )

    def test_departments_table_access(self):
        """public.departmentsテーブルのアクセス制御をテスト"""
        print("🔒 Testing public.departments table access control...")

        # 匿名ユーザーでのアクセス（認証済みユーザーのみアクセス可能）
        result = self.make_request("departments")
        if result["status_code"] == 200:
            print(
                f"    ❌ Anonymous access should be restricted, but got {len(result['data'])} departments"
            )
        else:
            print(
                f"    ✅ Anonymous access properly restricted (status: {result['status_code']})"
            )

    def test_auth_users_protection(self):
        """auth.usersテーブルが適切に保護されているかをテスト"""
        print("🔒 Testing auth.users table protection...")

        # auth.usersテーブルへの直接アクセス（エラーになるべき）
        result = self.make_request("auth.users")
        if result["status_code"] == 404:
            print("    ✅ auth.users table is properly protected")
        else:
            print(
                f"    ❌ auth.users table should be protected, but got status: {result['status_code']}"
            )

    def test_service_role_full_access(self):
        """サービスロールが全テーブルにアクセスできるかをテスト"""
        print("🔒 Testing service role full access...")

        tables = [
            "users",
            "user_profiles",
            "user_roles",
            "venues",
            "departments",
            "availability_slots",
            "venue_attributes",
            "recurring_units",
        ]
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }

        for table in tables:
            result = self.make_request(table, headers)
            if result["status_code"] == 200:
                print(
                    f"    ✅ Service role can access {table} ({len(result['data'])} records)"
                )
            else:
                print(
                    f"    ❌ Service role cannot access {table} (status: {result['status_code']})"
                )

    def test_remote_connection(self):
        """リモートプロジェクトへの接続をテスト"""
        print("🔒 Testing remote project connection...")

        # 基本的な接続テスト
        result = self.make_request("")
        if result["status_code"] == 200:
            print("    ✅ Successfully connected to remote Supabase project")
        else:
            print(
                f"    ❌ Failed to connect to remote project (status: {result['status_code']})"
            )

    def run_all_tests(self):
        """全てのセキュリティテストを実行"""
        print("🚀 Starting Supabase RLS Security Tests")
        print("=" * 50)
        print(f"Target Project: uilydqaqephxtcnnqihy")
        print(f"API URL: {self.supabase_url}")
        print("=" * 50)

        self.test_remote_connection()
        print()

        self.test_users_table_access()
        print()

        self.test_user_profiles_table_access()
        print()

        self.test_venues_table_access()
        print()

        self.test_departments_table_access()
        print()

        self.test_auth_users_protection()
        print()

        self.test_service_role_full_access()
        print()

        print("✅ Security tests completed!")


def main():
    """メイン関数"""
    tester = SecurityRLSTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
