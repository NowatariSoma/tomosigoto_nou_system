#!/usr/bin/env python3
"""
ユーザーのメール確認をスキップして有効化するスクリプト
"""
import os
import sys
from datetime import datetime
from supabase import create_client

def activate_user(email: str):
    """指定されたメールアドレスのユーザーを有効化"""
    # Supabase接続
    url = os.getenv('SUPABASE_URL', 'https://uilydqaqephxtcnnqihy.supabase.co')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not service_key:
        print("Error: SUPABASE_SERVICE_ROLE_KEY is not set")
        return False
    
    supabase = create_client(url, service_key)
    
    try:
        # ユーザー一覧を取得
        result = supabase.auth.admin.list_users()
        
        # resultがlistかdictかを確認
        if isinstance(result, list):
            users = result
        else:
            users = getattr(result, 'users', result)
        
        print(f"Found {len(users)} users total")
        
        # 指定されたメールアドレスのユーザーを探す
        target_user = None
        for user in users:
            user_email = getattr(user, 'email', user.get('email') if isinstance(user, dict) else None)
            if user_email == email:
                target_user = user
                break
        
        if not target_user:
            print(f"User not found: {email}")
            return False
        
        user_email = getattr(target_user, 'email', target_user.get('email') if isinstance(target_user, dict) else None)
        user_id = getattr(target_user, 'id', target_user.get('id') if isinstance(target_user, dict) else None)
        confirmed_at = getattr(target_user, 'email_confirmed_at', target_user.get('email_confirmed_at') if isinstance(target_user, dict) else None)
        
        print(f"Found user: {user_email} (ID: {user_id})")
        print(f"Current email_confirmed_at: {confirmed_at}")
        
        # メール確認済みにする
        update_result = supabase.auth.admin.update_user_by_id(
            user_id,
            {
                'email_confirmed_at': datetime.utcnow().isoformat(),
                'email': email  # メールアドレスも確実に設定
            }
        )
        
        print(f"User activated successfully!")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python activate_user.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    success = activate_user(email)
    sys.exit(0 if success else 1)