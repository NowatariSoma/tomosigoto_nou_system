#!/usr/bin/env python3
"""
Supabaseでauth.usersテーブルとpublic.usersテーブルを連携するトリガーを設定するスクリプト
"""
import os
import sys

from supabase import create_client


def setup_user_sync_trigger():
    """auth.usersとpublic.usersを同期するトリガーを設定"""

    # Supabase接続（サービスロールキーが必要）
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not service_key:
        print("Error: SUPABASE_SERVICE_ROLE_KEY is not set")
        return False

    supabase = create_client(url, service_key)

    try:
        # 1. 既存のnowatari.somaユーザーを手動で追加
        print("=== 既存ユーザーをusersテーブルに追加 ===")

        # auth.usersから全ユーザーを取得
        auth_users = supabase.auth.admin.list_users()

        # auth_usersがlistかdictかを確認
        if isinstance(auth_users, list):
            users_list = auth_users
        else:
            users_list = getattr(auth_users, "users", auth_users)

        for auth_user in users_list:
            user_email = getattr(
                auth_user,
                "email",
                auth_user.get("email") if isinstance(auth_user, dict) else None,
            )
            user_id = getattr(
                auth_user,
                "id",
                auth_user.get("id") if isinstance(auth_user, dict) else None,
            )

            if user_email and user_id:
                # public.usersテーブルに存在するかチェック
                existing = (
                    supabase.table("users").select("id").eq("id", user_id).execute()
                )

                if not existing.data:
                    # 存在しない場合は追加
                    new_user_data = {
                        "id": user_id,
                        "email": user_email,
                        "auth_provider": "email",
                        "is_active": True,
                        "email_verified": True,
                    }

                    result = supabase.table("users").insert(new_user_data).execute()
                    print(f"Added user to users table: {user_email}")
                else:
                    print(f"User already exists in users table: {user_email}")

        print("=== ユーザー追加完了 ===")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False


def create_database_trigger():
    """データベーストリガーを作成するSQL文を生成"""

    trigger_sql = """
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, auth_provider, is_active, email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'email',
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
"""

    return trigger_sql


if __name__ == "__main__":
    print("🔧 Supabase User Sync Setup")
    print("=" * 50)

    # 既存ユーザーをusersテーブルに追加
    success = setup_user_sync_trigger()

    if success:
        print("\n✅ 既存ユーザーの同期が完了しました")

        print(
            "\n📝 データベーストリガーを設定するには、以下のSQLをSupabase SQL Editorで実行してください:"
        )
        print("=" * 50)
        print(create_database_trigger())
        print("=" * 50)

        sys.exit(0)
    else:
        print("\n❌ ユーザー同期に失敗しました")
        sys.exit(1)
