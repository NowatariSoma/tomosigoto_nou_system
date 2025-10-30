# 指導者追加用curlコマンド

## 1. 出席データを作成（指導者候補用）
# ユーザー1を出席確定として追加
curl -X POST "http://localhost:8000/api/v1/attendance/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "practice_schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "status": "present",
    "notes": "指導者候補"
  }' | jq .

# ユーザー2を出席確定として追加
curl -X POST "http://localhost:8000/api/v1/attendance/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "practice_schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "user_id": "00000000-0000-0000-0000-000000000002",
    "status": "present",
    "notes": "指導者候補"
  }' | jq .

# ユーザー3を出席確定として追加
curl -X POST "http://localhost:8000/api/v1/attendance/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "practice_schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "user_id": "00000000-0000-0000-0000-000000000003",
    "status": "present",
    "notes": "指導者候補"
  }' | jq .

# ユーザー4を出席確定として追加
curl -X POST "http://localhost:8000/api/v1/attendance/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "practice_schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "user_id": "00000000-0000-0000-0000-000000000004",
    "status": "present",
    "notes": "指導者候補"
  }' | jq .

# ユーザー5を出席確定として追加
curl -X POST "http://localhost:8000/api/v1/attendance/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "practice_schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "user_id": "00000000-0000-0000-0000-000000000005",
    "status": "present",
    "notes": "指導者候補"
  }' | jq .

## 2. 出席データのIDを確認
curl -X GET "http://localhost:8000/api/v1/attendance/?practice_schedule_id=f33b2e49-742a-47e7-8fa7-24953c4322f1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" | jq .

## 3. 指導者を追加（上記の出席IDを使用）
# 注意: 上記の出席データ作成後に取得したattendance_idを使用してください
# 例: attendance_id_1, attendance_id_2, attendance_id_3, attendance_id_4, attendance_id_5

# 指導者1を追加
curl -X POST "http://localhost:8000/api/v1/session-instructors/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "attendance_id": "<attendance_id_1>",
    "schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "schedule_available_venue_id": null,
    "slot_order": 1
  }' | jq .

# 指導者2を追加
curl -X POST "http://localhost:8000/api/v1/session-instructors/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "attendance_id": "<attendance_id_2>",
    "schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "schedule_available_venue_id": null,
    "slot_order": 1
  }' | jq .

# 指導者3を追加
curl -X POST "http://localhost:8000/api/v1/session-instructors/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "attendance_id": "<attendance_id_3>",
    "schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "schedule_available_venue_id": null,
    "slot_order": 1
  }' | jq .

# 指導者4を追加
curl -X POST "http://localhost:8000/api/v1/session-instructors/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "attendance_id": "<attendance_id_4>",
    "schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "schedule_available_venue_id": null,
    "slot_order": 1
  }' | jq .

# 指導者5を追加
curl -X POST "http://localhost:8000/api/v1/session-instructors/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{
    "attendance_id": "<attendance_id_5>",
    "schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1",
    "schedule_available_venue_id": null,
    "slot_order": 1
  }' | jq .

## 4. 最適化を実行
curl -X POST "http://localhost:8000/api/v1/scheduling/optimize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" \
  -d '{"schedule_id": "f33b2e49-742a-47e7-8fa7-24953c4322f1"}' | jq .

