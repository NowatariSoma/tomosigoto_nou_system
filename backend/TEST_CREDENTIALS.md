# テスト用認証情報

## テストユーザー
- **Email**: test@example.com
- **Password**: Test123456!
- **User ID**: f9d005bc-b93c-4889-8df1-df8f5a58332e

## トークン取得方法

### 1. スクリプトを使う方法
```bash
python get_test_token.py
```

### 2. cURLでログインする方法
```bash
# Supabase Auth APIを直接呼ぶ
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

## APIテストコマンド例

### ユーザー一覧取得
```bash
# トークンを変数に保存
TOKEN=$(python get_test_token.py | grep -A1 "アクセストークン:" | tail -n1)

# APIを呼び出し
curl -X GET "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 現在のユーザー情報取得
```bash
curl -X GET "http://localhost:8000/api/v1/users/me/" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 特定のユーザー情報取得
```bash
curl -X GET "http://localhost:8000/api/v1/users/f9d005bc-b93c-4889-8df1-df8f5a58332e" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 新規ユーザー作成（管理者権限が必要）
```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewPassword123!"
  }' | jq .
```

## その他のテストユーザー（既存）
1. student001@mail.doshisha.ac.jp
2. student002@mail.doshisha.ac.jp
3. student003@mail.doshisha.ac.jp
4. teacher001@mail.doshisha.ac.jp
5. teacher002@mail.doshisha.ac.jp
6. admin001@mail.doshisha.ac.jp
7. nowatari.soma@tomosigoto.co.jp

※これらのユーザーのパスワードは不明。必要に応じてSupabaseダッシュボードでリセット可能。

## Swagger UI
http://localhost:8000/docs

Swagger UIで「Authorize」ボタンをクリックし、トークンを入力することで、UI上でAPIをテストできます。