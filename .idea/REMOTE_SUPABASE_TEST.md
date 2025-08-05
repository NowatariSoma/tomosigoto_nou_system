# リモートSupabase直接テスト

リモートのSupabaseデータベースに直接アクセスしてAPIをテストします。

## 設定情報

```bash
SUPABASE_URL="https://uilydqaqephxtcnnqihy.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY0MDE3NSwiZXhwIjoyMDY2MjE2MTc1fQ.XOoBsrjpvJ36CbQcbk_rfqg-HcZNKKxYvkrAlaoPgRc"
```

## 1. 認証テスト

### ユーザー登録

```bash
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/auth/v1/signup" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### ログイン

```bash
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nowatari.soma@tomosigoto.co.jp",
    "password": "tomosigoto"
  }'
```

## 2. データベース直接アクセス

### ユーザーテーブル一覧取得

```bash
# Service Role Keyを使用してauth.usersテーブルから直接取得
curl -X GET "https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/auth.users" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY0MDE3NSwiZXhwIjoyMDY2MjE2MTc1fQ.XOoBsrjpvJ36CbQcbk_rfqg-HcZNKKxYvkrAlaoPgRc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY0MDE3NSwiZXhwIjoyMDY2MjE2MTc1fQ.XOoBsrjpvJ36CbQcbk_rfqg-HcZNKKxYvkrAlaoPgRc"
```

### カスタムテーブルアクセス（もしあれば）

```bash
# 例：usersテーブル（カスタムテーブル）
curl -X GET "https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/users" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 3. Edge Functions テスト（もしあれば）

```bash
# Edge Functionがデプロイされている場合
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/functions/v1/your-function-name" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 4. Storage API テスト

```bash
# ファイルアップロード
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/storage/v1/object/your-bucket/test.txt" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "Hello World"
```

## 5. リアルタイム機能テスト

WebSocketでリアルタイム機能をテスト：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uilydqaqephxtcnnqihy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHlkcWFxZXBoeHRjbm5xaWh5Iiwicm9sZUFub24iLCJpYXQiOjE3NTA2NDAxNzUsImV4cCI6MjA2NjIxNjE3NX0.DAkWIVyi8n8Zkt6TNKvwaVFU6jLCuRXiGP0JISNmJak'
)

// テーブルの変更を監視
supabase
  .channel('users-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'users' }, 
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## テスト実行手順

1. **認証テスト**：既存ユーザーでログインしてトークン取得
2. **データベーステスト**：REST APIで直接データ取得
3. **Edge Functionsテスト**：カスタム関数の動作確認
4. **Storageテスト**：ファイルアップロード/ダウンロード
5. **リアルタイムテスト**：WebSocket接続とイベント監視