#!/usr/bin/env python3
"""
スケジュール時間スロットのモックデータを作成するスクリプト
"""
import os
import sys
from datetime import datetime, time, timedelta
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


def create_schedule_time_slots():
    """既存の練習スケジュールに対して時間スロットを作成"""
    print("⏰ スケジュール時間スロットを作成中...")
    
    try:
        # 既存の練習スケジュールを取得
        schedules_response = supabase.table("practice_schedules").select("id, start_time, end_time, schedule_date, title").eq("status", "active").execute()
        
        if not schedules_response.data:
            print("⚠️  アクティブな練習スケジュールが見つかりません")
            return False
        
        schedules = schedules_response.data
        print(f"📅 {len(schedules)}件の練習スケジュールを取得しました")
        
        # 既存の時間スロットを確認（重複作成を防ぐ）
        existing_slots_response = supabase.table("schedule_time_slots").select("schedule_id").execute()
        existing_schedule_ids = set(slot["schedule_id"] for slot in existing_slots_response.data)
        
        time_slots = []
        created_count = 0
        
        for schedule in schedules:
            schedule_id = schedule["id"]
            
            # 既に時間スロットが存在する場合はスキップ
            if schedule_id in existing_schedule_ids:
                print(f"⏭️  スケジュール {schedule.get('title', schedule_id)} は既に時間スロットが存在します")
                continue
            
            # 開始時刻と終了時刻を取得
            start_time_str = schedule.get("start_time")
            end_time_str = schedule.get("end_time")
            
            if not start_time_str or not end_time_str:
                print(f"⚠️  スケジュール {schedule.get('title', schedule_id)} に開始時刻または終了時刻がありません")
                continue
            
            # 文字列をtimeオブジェクトに変換
            try:
                if isinstance(start_time_str, str):
                    start_time = datetime.strptime(start_time_str, "%H:%M:%S").time()
                else:
                    start_time = start_time_str
                
                if isinstance(end_time_str, str):
                    end_time = datetime.strptime(end_time_str, "%H:%M:%S").time()
                else:
                    end_time = end_time_str
            except Exception as e:
                print(f"⚠️  スケジュール {schedule.get('title', schedule_id)} の時刻解析エラー: {e}")
                continue
            
            # 30分間隔で時間スロットを生成
            slot_order = 1
            current_start = start_time
            
            while current_start < end_time:
                # 終了時刻を計算（30分後、ただしスケジュールの終了時刻を超えない）
                current_start_dt = datetime.combine(datetime.today(), current_start)
                current_end_dt = current_start_dt + timedelta(minutes=30)
                current_end = current_end_dt.time()
                
                # スケジュールの終了時刻を超えないように調整
                if current_end > end_time:
                    current_end = end_time
                
                time_slots.append({
                    "schedule_id": schedule_id,
                    "slot_order": slot_order,
                    "start_time": current_start.strftime("%H:%M:%S"),
                    "end_time": current_end.strftime("%H:%M:%S")
                })
                
                slot_order += 1
                current_start = current_end
                
                # 終了時刻に達したらループを抜ける
                if current_start >= end_time:
                    break
            
            created_count += 1
            print(f"✅ スケジュール {schedule.get('title', schedule_id)} に {slot_order - 1} 個の時間スロットを作成")
        
        # 時間スロットを一括挿入
        if time_slots:
            # バッチサイズで分割して挿入（Supabaseの制限を考慮）
            batch_size = 100
            for i in range(0, len(time_slots), batch_size):
                batch = time_slots[i:i + batch_size]
                supabase.table("schedule_time_slots").insert(batch).execute()
            
            print(f"✅ {len(time_slots)}個の時間スロットを作成しました")
            print(f"📊 {created_count}件のスケジュールに時間スロットを追加しました")
            return True
        else:
            print("⚠️  作成する時間スロットがありませんでした")
            return False
            
    except Exception as e:
        print(f"❌ 時間スロット作成エラー: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """メイン処理"""
    print("🌱 スケジュール時間スロットのモックデータ作成開始")
    print("=" * 50)
    
    if not create_schedule_time_slots():
        print("❌ 時間スロットデータ作成に失敗しました")
        sys.exit(1)
    
    print("\n✅ スケジュール時間スロットのモックデータ作成完了！")
    print("=" * 50)


if __name__ == "__main__":
    main()

