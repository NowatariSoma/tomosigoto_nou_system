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
    
    # ユーザープロフィールデータ
    user_profiles = [
        {
            "id": "profile-001",
            "user_id": "user-grade4-001",
            "student_id": "CS2021001",
            "first_name_kanji": "太郎",
            "first_name_katakana": "タロウ",
            "last_name_kanji": "山田",
            "last_name_katakana": "ヤマダ",
            "grade": 4,
            "department_id": "dept-001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "profile-002",
            "user_id": "user-grade4-002",
            "student_id": "CS2021002", 
            "first_name_kanji": "花子",
            "first_name_katakana": "ハナコ",
            "last_name_kanji": "佐藤",
            "last_name_katakana": "サトウ",
            "grade": 4,
            "department_id": "dept-001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "profile-003",
            "user_id": "user-grade4-003",
            "student_id": "EE2021001",
            "first_name_kanji": "次郎", 
            "first_name_katakana": "ジロウ",
            "last_name_kanji": "田中",
            "last_name_katakana": "タナカ",
            "grade": 4,
            "department_id": "dept-002",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "profile-004",
            "user_id": "user-grade4-004",
            "student_id": "CS2021003",
            "first_name_kanji": "真理",
            "first_name_katakana": "マリ", 
            "last_name_kanji": "鈴木",
            "last_name_katakana": "スズキ",
            "grade": 4,
            "department_id": "dept-001",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        },
        {
            "id": "profile-005",
            "user_id": "user-grade4-005",
            "student_id": "EE2021002",
            "first_name_kanji": "健",
            "first_name_katakana": "ケン",
            "last_name_kanji": "渡辺", 
            "last_name_katakana": "ワタナベ",
            "grade": 4,
            "department_id": "dept-002",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    ]
    
    try:
        # ユーザーを作成
        supabase.table("users").upsert(users).execute()
        print("✅ ユーザーデータ作成完了")
        
        # ユーザープロフィールを作成
        supabase.table("user_profiles").upsert(user_profiles).execute()
        print("✅ ユーザープロフィールデータ作成完了")
        
        return True
    except Exception as e:
        print(f"❌ ユーザーデータ作成エラー: {e}")
        return False

def create_practice_schedules():
    """練習スケジュールを作成"""
    print("📅 練習スケジュールを作成中...")
    
    # 今日から1週間分の練習スケジュールを作成
    today = datetime.now().date()
    schedules = []
    
    for i in range(7):
        schedule_date = today + timedelta(days=i)
        schedules.append({
            "id": f"schedule-{i+1:03d}",
            "schedule_date": schedule_date.isoformat(),
            "description": f"練習{i+1}",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
    
    try:
        supabase.table("practice_schedules").upsert(schedules).execute()
        print("✅ 練習スケジュールデータ作成完了")
        return schedules
    except Exception as e:
        print(f"❌ 練習スケジュールデータ作成エラー: {e}")
        return []

def create_attendance_records(schedules):
    """出席記録を作成"""
    print("📝 出席記録を作成中...")
    
    user_ids = [
        "user-grade4-001", "user-grade4-002", "user-grade4-003", 
        "user-grade4-004", "user-grade4-005"
    ]
    
    attendance_records = []
    
    for schedule in schedules:
        for user_id in user_ids:
            # 80%の確率で出席、20%の確率で欠席
            import random
            if random.random() < 0.8:
                status = "present" if random.random() < 0.9 else "late"
            else:
                status = "absent"
            
            attendance_records.append({
                "id": f"attendance-{schedule['id']}-{user_id}",
                "practice_schedule_id": schedule["id"],
                "user_id": user_id,
                "status": status,
                "notes": f"出席記録 - {schedule['description']}",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "created_by": user_id,
                "updated_by": user_id
            })
    
    try:
        supabase.table("practice_user_attendance").upsert(attendance_records).execute()
        print("✅ 出席記録データ作成完了")
        return True
    except Exception as e:
        print(f"❌ 出席記録データ作成エラー: {e}")
        return False

def main():
    """メイン処理"""
    print("🌱 シードデータ作成開始")
    print("=" * 50)
    
    # 1. 学部データを作成
    if not create_departments():
        print("❌ 学部データ作成に失敗しました")
        sys.exit(1)
    
    # 2. 学年4のユーザーを作成
    if not create_grade4_users():
        print("❌ ユーザーデータ作成に失敗しました")
        sys.exit(1)
    
    # 3. 練習スケジュールを作成
    schedules = create_practice_schedules()
    if not schedules:
        print("❌ 練習スケジュールデータ作成に失敗しました")
        sys.exit(1)
    
    # 4. 出席記録を作成
    if not create_attendance_records(schedules):
        print("❌ 出席記録データ作成に失敗しました")
        sys.exit(1)
    
    print("\n✅ シードデータ作成完了！")
    print("=" * 50)
    print("📊 作成されたデータ:")
    print("- 学部: 2件")
    print("- 学年4ユーザー: 5件")
    print("- ユーザープロフィール: 5件")
    print("- 練習スケジュール: 7件")
    print("- 出席記録: 35件（5ユーザー × 7スケジュール）")
    print("\n🎯 インストラクター候補として表示される条件:")
    print("- 学年4のユーザー")
    print("- 出席記録があるユーザー（出席または遅刻）")

if __name__ == "__main__":
    main()
