#!/usr/bin/env python3
"""
学年4のユーザーと出席記録を含むシードデータを作成するスクリプト
"""
import os
import sys
import uuid
from datetime import datetime, timedelta
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

def create_departments():
    """学部データを作成"""
    print("📚 学部データを作成中...")
    
    departments = [
        {
            "id": str(uuid.uuid4()),
            "department_code": "CS",
            "department_name": "コンピュータサイエンス学部",
            "campus": "京田辺",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()), 
            "department_code": "EE",
            "department_name": "電気電子工学部",
            "campus": "京田辺",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    try:
        supabase.table("departments").upsert(departments).execute()
        print("✅ 学部データ作成完了")
        return True
    except Exception as e:
        print(f"❌ 学部データ作成エラー: {e}")
        return False

def create_grade4_users():
    """学年4のユーザーを作成"""
    print("👥 学年4のユーザーを作成中...")
    
    # 学年4のユーザーデータ
    user_ids = [str(uuid.uuid4()) for _ in range(5)]
    users = [
        {
            "id": user_ids[0],
            "email": "yamada.taro@mail.doshisha.ac.jp",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "raw_user_meta_data": {"name": "山田太郎"}
        },
        {
            "id": user_ids[1], 
            "email": "sato.hanako@mail.doshisha.ac.jp",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "raw_user_meta_data": {"name": "佐藤花子"}
        },
        {
            "id": user_ids[2],
            "email": "tanaka.jiro@mail.doshisha.ac.jp", 
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "raw_user_meta_data": {"name": "田中次郎"}
        },
        {
            "id": user_ids[3],
            "email": "suzuki.mari@mail.doshisha.ac.jp",
            "created_at": datetime.now().isoformat(), 
            "updated_at": datetime.now().isoformat(),
            "raw_user_meta_data": {"name": "鈴木真理"}
        },
        {
            "id": user_ids[4],
            "email": "watanabe.ken@mail.doshisha.ac.jp",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "raw_user_meta_data": {"name": "渡辺健"}
        }
    ]
    
    # まず学部IDを取得
    dept_response = supabase.table("departments").select("id").execute()
    dept_ids = [dept["id"] for dept in dept_response.data]
    
    # ユーザープロフィールデータ
    user_profiles = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[0],
            "student_id": "CS2021001",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "山田",
            "last_name_katakana": "ヤマダ",
            "grade": 4,
            "department_id": dept_ids[0],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[1],
            "student_id": "CS2021002", 
            "first_name_kanji": "花子",
            "first_name_katakana": "ハナコ",
            "last_name_kanji": "佐藤",
            "last_name_katakana": "サトウ",
            "grade": 4,
            "department_id": dept_ids[0],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[2],
            "student_id": "EE2021001",
            "first_name_kanji": "次郎", 
            "first_name_katakana": "ジロウ",
            "last_name_kanji": "田中",
            "last_name_katakana": "タナカ",
            "grade": 4,
            "department_id": dept_ids[1],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[3],
            "student_id": "CS2021003",
            "first_name_kanji": "真理",
            "first_name_katakana": "マリ", 
            "last_name_kanji": "鈴木",
            "last_name_katakana": "スズキ",
            "grade": 4,
            "department_id": dept_ids[0],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_ids[4],
            "student_id": "EE2021002",
            "first_name_kanji": "健",
            "first_name_katakana": "ケン",
            "last_name_kanji": "渡辺", 
            "last_name_katakana": "ワタナベ",
            "grade": 4,
            "department_id": dept_ids[1],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    try:
        # 既存のユーザーを確認
        existing_users = supabase.table("users").select("id, email").execute()
        existing_emails = [user["email"] for user in existing_users.data]
        
        # 既存のユーザーIDを取得
        final_user_ids = []
        for i, user in enumerate(users):
            if user["email"] in existing_emails:
                # 既存のユーザーIDを取得
                existing_user = next(u for u in existing_users.data if u["email"] == user["email"])
                final_user_ids.append(existing_user["id"])
            else:
                # 新しいユーザーを作成
                try:
                    new_user = supabase.auth.admin.create_user({
                        "email": user["email"],
                        "user_metadata": user["raw_user_meta_data"],
                        "email_confirm": True
                    })
                    final_user_ids.append(new_user.user.id)
                except Exception as e:
                    print(f"⚠️ ユーザー作成エラー ({user['email']}): {e}")
                    continue
        
        # ユーザープロフィールを作成（既存の場合はスキップ）
        existing_profiles = supabase.table("user_profiles").select("user_id").execute()
        existing_user_ids = [profile["user_id"] for profile in existing_profiles.data]
        
        # プロフィール用のユーザーIDを更新
        for i, profile in enumerate(user_profiles):
            if i < len(final_user_ids):
                profile["user_id"] = final_user_ids[i]
        
        new_profiles = [profile for profile in user_profiles if profile["user_id"] not in existing_user_ids]
        if new_profiles:
            supabase.table("user_profiles").upsert(new_profiles).execute()
        
        print("✅ 学年4ユーザー作成完了")
        return final_user_ids
    except Exception as e:
        print(f"❌ 学年4ユーザー作成エラー: {e}")
        return []

def create_practice_schedule():
    """練習スケジュールを作成"""
    print("📅 練習スケジュールを作成中...")
    
    schedule_id = str(uuid.uuid4())
    schedule = {
        "id": schedule_id,
        "schedule_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "start_time": "09:00",
        "end_time": "17:00",
        "title": "テスト練習スケジュール",
        "description": "インストラクター候補テスト用",
        "schedule_type": "practice",
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    try:
        supabase.table("practice_schedules").upsert(schedule).execute()
        print("✅ 練習スケジュール作成完了")
        return schedule_id
    except Exception as e:
        print(f"❌ 練習スケジュール作成エラー: {e}")
        return None

def create_attendance_records(user_ids, schedule_id):
    """出席記録を作成"""
    print("📝 出席記録を作成中...")
    
    attendance_records = []
    for i, user_id in enumerate(user_ids):
        attendance_id = str(uuid.uuid4())
        attendance_records.append({
            "id": attendance_id,
            "user_id": user_id,
            "practice_schedule_id": schedule_id,
            "status": "present" if i % 2 == 0 else "late",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
    
    try:
        supabase.table("practice_user_attendance").upsert(attendance_records).execute()
        print("✅ 出席記録作成完了")
        return True
    except Exception as e:
        print(f"❌ 出席記録作成エラー: {e}")
        return False

def main():
    """メイン処理"""
    print("🌱 シードデータ作成開始")
    print("=" * 50)
    
    # 学部データを作成（既存の場合はスキップ）
    print("📚 学部データを確認中...")
    try:
        dept_response = supabase.table("departments").select("id").execute()
        if not dept_response.data:
            if not create_departments():
                print("❌ 学部データ作成に失敗しました")
                return
        else:
            print("✅ 学部データは既に存在します")
    except Exception as e:
        print(f"❌ 学部データ確認エラー: {e}")
        return
    
    # 学年4のユーザーを作成
    user_ids = create_grade4_users()
    if not user_ids:
        print("❌ 学年4ユーザー作成に失敗しました")
        return
    
    # 練習スケジュールを作成
    schedule_id = create_practice_schedule()
    if not schedule_id:
        print("❌ 練習スケジュール作成に失敗しました")
        return
    
    # 出席記録を作成
    if not create_attendance_records(user_ids, schedule_id):
        print("❌ 出席記録作成に失敗しました")
        return
    
    print("=" * 50)
    print("🎉 シードデータ作成完了！")
    print(f"📊 作成されたデータ:")
    print(f"   - 学年4ユーザー: {len(user_ids)}名")
    print(f"   - 練習スケジュールID: {schedule_id}")
    print(f"   - 出席記録: {len(user_ids)}件")

if __name__ == "__main__":
    main()
