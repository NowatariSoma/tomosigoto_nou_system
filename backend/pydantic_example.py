#!/usr/bin/env python3
"""
Pydanticのdict()とmodel_dump()の違いを説明するサンプルコード
"""
import json
from uuid import UUID, uuid4
from enum import Enum
from pydantic import BaseModel
from datetime import datetime

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"

class AttendanceData(BaseModel):
    practice_schedule_id: UUID
    user_id: UUID
    status: AttendanceStatus
    notes: str
    created_at: datetime

# サンプルデータを作成
attendance = AttendanceData(
    practice_schedule_id=uuid4(),
    user_id=uuid4(), 
    status=AttendanceStatus.PRESENT,
    notes="テストデータ",
    created_at=datetime.now()
)

print("=== 元のPydanticモデル ===")
print(f"attendance: {attendance}")
print(f"型: {type(attendance)}")

print("\n=== dict() メソッド（Pydantic v1の古い方法）===")
try:
    dict_result = attendance.dict()
    print(f"dict_result: {dict_result}")
    print(f"practice_schedule_id の型: {type(dict_result['practice_schedule_id'])}")
    print(f"status の型: {type(dict_result['status'])}")
    
    # JSON変換を試す
    json_string = json.dumps(dict_result)
    print(f"JSON変換成功: {json_string[:100]}...")
except Exception as e:
    print(f"❌ エラー: {e}")

print("\n=== model_dump() メソッド（Pydantic v2の新しい方法）===")
try:
    model_dump_result = attendance.model_dump()
    print(f"model_dump_result: {model_dump_result}")
    print(f"practice_schedule_id の型: {type(model_dump_result['practice_schedule_id'])}")
    print(f"status の型: {type(model_dump_result['status'])}")
    
    # JSON変換を試す
    json_string = json.dumps(model_dump_result, default=str)
    print(f"JSON変換成功: {json_string[:100]}...")
except Exception as e:
    print(f"❌ エラー: {e}")

print("\n=== model_dump(mode='json') メソッド（JSON互換形式）===")
try:
    json_compatible_result = attendance.model_dump(mode='json')
    print(f"json_compatible_result: {json_compatible_result}")
    print(f"practice_schedule_id の型: {type(json_compatible_result['practice_schedule_id'])}")
    print(f"status の型: {type(json_compatible_result['status'])}")
    
    # JSON変換を試す
    json_string = json.dumps(json_compatible_result)
    print(f"JSON変換成功: {json_string[:100]}...")
except Exception as e:
    print(f"❌ エラー: {e}")

print("\n=== 実際の問題のシミュレーション ===")
print("Supabaseに送信するようなシナリオ：")

def send_to_supabase_simulation(data_dict):
    """Supabaseへの送信をシミュレート（実際にはJSON変換が必要）"""
    try:
        # 内部でJSON変換が行われる（Supabaseクライアントライブラリ内で）
        json_data = json.dumps(data_dict)
        print(f"✅ Supabase送信成功（データ長: {len(json_data)}文字）")
        return True
    except Exception as e:
        print(f"❌ Supabase送信失敗: {e}")
        return False

print("\n1. dict()を使った場合:")
dict_data = attendance.dict()
send_to_supabase_simulation(dict_data)

print("\n2. model_dump()を使った場合:")
model_dump_data = attendance.model_dump()
send_to_supabase_simulation(model_dump_data)

print("\n3. model_dump(mode='json')を使った場合:")
json_mode_data = attendance.model_dump(mode='json')
send_to_supabase_simulation(json_mode_data)