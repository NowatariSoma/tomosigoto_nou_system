#!/usr/bin/env python3
"""
出欠情報のテストデータを作成するスクリプト
"""
import os
import sys
import uuid
from datetime import datetime, time
from dotenv import load_dotenv
from supabase import create_client, Client

# .envファイルを読み込む
load_dotenv()

# Supabaseクライアントを作成（サービスロールキーを使用）
url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not service_key:
    print("❌ エラー: SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが設定されていません")
    sys.exit(1)

supabase: Client = create_client(url, service_key)

def get_existing_users():
    """既存のユーザーを取得"""
    try:
        response = supabase.table("users").select("id, email").limit(10).execute()
        return response.data if response.data else []
    except Exception as e:
        print(f"❌ ユーザー取得エラー: {e}")
        return []

def get_practice_schedule_for_date(date_str: str):
    """指定日付の練習スケジュールを取得"""
    try:
        response = supabase.table("practice_schedules").select("id").eq("schedule_date", date_str).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]["id"]
        return None
    except Exception as e:
        print(f"❌ 練習スケジュール取得エラー: {e}")
        return None

def create_attendance_test_data():
    """出欠情報のテストデータを作成"""
    print("📝 出欠情報のテストデータを作成中...")
    
    # 既存のユーザーを取得
    users = get_existing_users()
    if not users:
        print("❌ ユーザーが見つかりません。先にユーザーを作成してください。")
        return False
    
    # 2025-03-01の練習スケジュールを取得
    schedule_id = get_practice_schedule_for_date("2025-03-01")
    if not schedule_id:
        print("❌ 2025-03-01の練習スケジュールが見つかりません。")
        return False
    
    print(f"✅ 練習スケジュールID: {schedule_id}")
    print(f"✅ ユーザー数: {len(users)}")
    
    # 出欠記録を作成
    attendance_records = []
    statuses = ['present', 'present', 'present', 'absent', 'late', 'absent']
    
    for i, user in enumerate(users[:6]):  # 最大6人まで
        status = statuses[i % len(statuses)]
        attendance_id = str(uuid.uuid4())
        
        attendance_data = {
            "id": attendance_id,
            "practice_schedule_id": schedule_id,
            "user_id": user["id"],
            "status": status,
            "notes": f"テストデータ - {status}",
        }
        
        attendance_records.append(attendance_data)
    
    try:
        # 既存の出欠記録を削除（テスト用）
        supabase.table("practice_user_attendance").delete().eq("practice_schedule_id", schedule_id).execute()
        
        # 新しい出欠記録を作成
        result = supabase.table("practice_user_attendance").insert(attendance_records).execute()
        print(f"✅ 出欠記録を作成しました: {len(attendance_records)}件")
        
        # 作成されたデータを表示
        for record in attendance_records:
            print(f"  - ユーザーID: {record['user_id'][:8]}... ステータス: {record['status']}")
        
        return True
    except Exception as e:
        print(f"❌ 出欠記録作成エラー: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("出欠情報テストデータ作成スクリプト")
    print("=" * 50)
    
    if create_attendance_test_data():
        print("\n✅ テストデータ作成完了！")
    else:
        print("\n❌ テストデータ作成に失敗しました")
        sys.exit(1)

