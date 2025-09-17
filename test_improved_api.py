#!/usr/bin/env python3
"""
改善されたMLエンジン連携APIのテストスクリプト
バックエンド（8000番ポート）のスケジュール最適化APIをテストする
"""

import requests
import json
import uuid
from typing import Dict, Any

# バックエンドのベースURL
BACKEND_URL = "http://localhost:8000/api"
# MLエンジンのベースURL（直接テスト用）
ML_ENGINE_URL = "http://localhost:8001/api/v1/ml"

def test_backend_schedule_optimization():
    """バックエンドのスケジュール最適化APIをテスト"""
    print("=== バックエンドスケジュール最適化テスト ===")
    
    # テスト用のスケジュールID（実際のUUIDを使用）
    test_schedule_id = str(uuid.uuid4())
    
    request_data = {
        "schedule_id": test_schedule_id
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/schedule/optimize",
            json=request_data,
            timeout=30
        )
        
        print(f"ステータスコード: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("レスポンス:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # レスポンス構造をチェック
            assert "schedule_id" in result
            assert "status" in result
            assert "optimized_sessions" in result
            print("✅ レスポンス構造が正しいです")
            
        else:
            print(f"❌ エラー: {response.text}")
            
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_ml_engine_direct():
    """MLエンジンを直接テスト（制約条件を含む）"""
    print("\n=== MLエンジン直接テスト（制約付き） ===")
    
    test_data = {
        "schedule_data": {
            "start_date": "2024-01-15",
            "end_date": "2024-01-15",
            "practice_days": ["monday"]
        },
        "members": [
            {
                "id": "member_1",
                "name": "田中太郎",
                "part": "シテ",
                "skill_level": "上級",
                "availability": ["monday"],
                "priority": 5
            },
            {
                "id": "member_2", 
                "name": "佐藤花子",
                "part": "地謡",
                "skill_level": "中級",
                "availability": ["monday"],
                "priority": 3
            },
            {
                "id": "member_3",
                "name": "鈴木次郎",
                "part": "笛",
                "skill_level": "上級", 
                "availability": ["monday"],
                "priority": 4
            }
        ],
        "venues": [
            {
                "id": "venue_1",
                "name": "練習場A",
                "capacity": 20,
                "available_times": [
                    "09:00-10:30",
                    "10:45-12:15", 
                    "13:15-14:45",
                    "15:00-16:30",
                    "16:45-18:15"
                ]
            },
            {
                "id": "venue_2",
                "name": "練習場B", 
                "capacity": 15,
                "available_times": [
                    "09:00-10:30",
                    "10:45-12:15",
                    "13:15-14:45"
                ]
            }
        ],
        "constraints": {
            "max_practice_hours_per_week": 10,
            "min_members_per_session": 2,
            "max_concurrent_sessions_per_time_slot": 1,
            "allow_part_overlap_in_same_venue": False,
            "enforce_venue_capacity": True
        }
    }
    
    try:
        response = requests.post(
            f"{ML_ENGINE_URL}/predict/schedule-optimization",
            json=test_data,
            timeout=30
        )
        
        print(f"ステータスコード: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("レスポンス:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 制約チェック
            sessions = result.get("optimized_schedule", {}).get("sessions", [])
            print(f"\n生成されたセッション数: {len(sessions)}")
            
            # 時間・会場の重複チェック
            time_venue_combinations = set()
            for session in sessions:
                time_venue = f"{session.get('time')}_{session.get('venue')}"
                if time_venue in time_venue_combinations:
                    print(f"⚠️  制約違反: 時間・会場の重複 - {time_venue}")
                else:
                    time_venue_combinations.add(time_venue)
                    print(f"✅ セッション: {session.get('part')} - {session.get('time')} - {session.get('venue')}")
            
        else:
            print(f"❌ エラー: {response.text}")
            
    except Exception as e:
        print(f"❌ テストエラー: {e}")

def test_ml_engine_health():
    """MLエンジンのヘルスチェック"""
    print("\n=== MLエンジンヘルスチェック ===")
    
    try:
        response = requests.get(f"{ML_ENGINE_URL}/health", timeout=10)
        print(f"ステータスコード: {response.status_code}")
        print(f"レスポンス: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")

def test_backend_ml_health():
    """バックエンド経由でMLエンジンのヘルスチェック"""
    print("\n=== バックエンド経由MLヘルスチェック ===")
    
    try:
        response = requests.get(f"{BACKEND_URL}/schedule/health/ml", timeout=10)
        print(f"ステータスコード: {response.status_code}")
        print(f"レスポンス: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ ヘルスチェックエラー: {e}")

if __name__ == "__main__":
    print("🚀 改善されたMLエンジン連携APIテストを開始します\n")
    
    # 1. MLエンジンのヘルスチェック
    test_ml_engine_health()
    
    # 2. バックエンド経由のヘルスチェック  
    test_backend_ml_health()
    
    # 3. MLエンジン直接テスト（制約付き）
    test_ml_engine_direct()
    
    # 4. バックエンドスケジュール最適化テスト
    # test_backend_schedule_optimization()  # 実際のDBが必要なのでコメントアウト
    
    print("\n🎉 テスト完了")
