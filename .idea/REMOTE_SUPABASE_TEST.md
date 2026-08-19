# リモートSupabase直接テスト

リモートのSupabaseデータベースに直接アクセスしてAPIをテストします。

## 設定情報

```bash
SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
SUPABASE_ANON_KEY="<YOUR_ANON_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY>"
```

## 1. 認証テスト

### ユーザー登録

```bash
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/signup" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### ログイン

```bash
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "<TEST_USER_EMAIL>",
    "password": "<TEST_USER_PASSWORD>"
  }'
```

## 2. データベース直接アクセス

### ユーザーテーブル一覧取得

```bash
# Service Role Keyを使用してauth.usersテーブルから直接取得
curl -X GET "https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/auth.users" \
  -H "apikey: <YOUR_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>"
```

### カスタムテーブルアクセス（もしあれば）

```bash
# 例：usersテーブル（カスタムテーブル）
curl -X GET "https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/users" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 3. Edge Functions テスト（もしあれば）

```bash
# Edge Functionがデプロイされている場合
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/your-function-name" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 4. Storage API テスト

```bash
# ファイルアップロード
curl -X POST "https://<YOUR_PROJECT_REF>.supabase.co/storage/v1/object/your-bucket/test.txt" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: text/plain" \
  --data-binary "Hello World"
```

## 5. リアルタイム機能テスト

WebSocketでリアルタイム機能をテスト：

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<YOUR_PROJECT_REF>.supabase.co',
  '<YOUR_ANON_KEY>'
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