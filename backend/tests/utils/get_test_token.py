#!/usr/bin/env python3
"""
Supabaseからテスト用のJWTトークンを取得するスクリプト
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envファイルを読み込む
load_dotenv()

# Supabaseクライアントを作成
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ エラー: SUPABASE_URLとSUPABASE_ANON_KEYが設定されていません")
    exit(1)

supabase: Client = create_client(url, key)

# テストユーザーでサインイン（.env.testから読み込み）
test_email = os.getenv("TEST_USER_EMAIL", "testlogin@example.com")
test_password = os.getenv("TEST_USER_PASSWORD", "testpass123")

print(f"テストユーザー {test_email} でサインインを試みます...")

try:
    # サインイン
    response = supabase.auth.sign_in_with_password({
        "email": test_email,
        "password": test_password
    })
    
    if response.session:
        print(f"\n✅ サインイン成功！")
        print(f"\nアクセストークン:")
        print(response.session.access_token)
        print(f"\n以下のコマンドでAPIをテストできます:")
        print(f'curl -X GET "http://localhost:8000/api/v1/users/" -H "Authorization: Bearer {response.session.access_token}"')
    else:
        print("❌ サインインに失敗しました")
        
except Exception as e:
    print(f"❌ エラー: {e}")
    print("\nテストユーザーが存在しない可能性があります。")
    print("Supabaseダッシュボードでユーザーを作成するか、")
    print("以下のコマンドでユーザーを作成してください:")
    print(f'curl -X POST "http://localhost:8000/api/v1/users/" -H "Content-Type: application/json" -d \'{{"email": "{test_email}", "password": "{test_password}"}}\'')