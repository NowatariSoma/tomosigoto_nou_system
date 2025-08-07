#!/usr/bin/env python3
"""
テストユーザーを作成するスクリプト（サービスロールキーを使用）
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envファイルを読み込む
load_dotenv()

# Supabaseクライアントを作成（サービスロールキーを使用）
url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("❌ エラー: SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが設定されていません")
    exit(1)

supabase: Client = create_client(url, service_key)

# テストユーザー情報
test_email = "test@example.com"
test_password = "Test123456!"

print(f"テストユーザー {test_email} を作成します...")

try:
    # ユーザーを作成
    response = supabase.auth.admin.create_user({
        "email": test_email,
        "password": test_password,
        "email_confirm": True  # メール確認を自動で有効にする
    })
    
    if response.user:
        print(f"✅ ユーザー作成成功！")
        print(f"ユーザーID: {response.user.id}")
        
        # usersテーブルにも追加
        try:
            supabase.table('users').insert({
                "id": response.user.id,
                "email": test_email,
                "created_at": response.user.created_at.isoformat() if response.user.created_at else None
            }).execute()
            print("✅ usersテーブルへの登録も完了")
        except Exception as e:
            print(f"⚠️  usersテーブルへの登録でエラー: {e}")
        
        print("\n次に get_test_token.py を実行してトークンを取得してください")
    else:
        print("❌ ユーザー作成に失敗しました")
        
except Exception as e:
    print(f"❌ エラー: {e}")
    if "User already registered" in str(e):
        print("このユーザーは既に存在します。get_test_token.py を実行してください。")