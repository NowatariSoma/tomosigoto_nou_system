# ユーザー同期設定ガイド

## 概要

Supabaseの認証システム（`auth.users`）とカスタムのユーザーテーブル（`public.users`）を自動同期するための設定手順です。

## 現在の状況

✅ **既存ユーザーの同期完了**
- `nowatari.soma@tomosigoto.co.jp` がusersテーブルに追加済み
- すべての既存認証ユーザーがusersテーブルに同期済み

## 自動同期の仕組み

### 同期されるタイミング
1. **新規ユーザー登録時**: `auth.users`にユーザーが作成された瞬間に`public.users`にも追加
2. **ユーザー情報更新時**: メールアドレスや確認状態が変更されたときに同期
3. **ユーザー削除時**: 認証ユーザーが削除されたときにusersテーブルで無効化

### 同期されるデータ
- **id**: 認証ユーザーIDと同じUUID
- **email**: メールアドレス
- **auth_provider**: 認証プロバイダー（'email'）
- **is_active**: アクティブ状態（true）
- **email_verified**: メール確認状態
- **created_at/updated_at**: タイムスタンプ

## 手動設定手順

### Step 1: 既存ユーザーの同期（完了済み）

```bash
# Docker環境で実行
docker compose exec backend python scripts/setup_user_trigger.py
```

### Step 2: データベーストリガーの設定

1. Supabaseプロジェクトにアクセス
2. **SQL Editor**を開く
3. `backend/database/user_sync_triggers.sql`の内容をコピー＆ペースト
4. **RUN**ボタンをクリックして実行

### Step 3: 動作確認

新しいユーザーを作成してテスト：

```bash
# 新規ユーザー作成
curl -X POST "https://uilydqaqephxtcnnqihy.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# usersテーブルに自動追加されたか確認
curl -X GET "https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/users?email=eq.test@example.com" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## トリガー関数の詳細

### handle_new_user()
```sql
-- 新規ユーザー作成時に public.users テーブルに追加
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, auth_provider, is_active, email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'email',
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### handle_user_update()
```sql
-- ユーザー情報更新時に public.users テーブルも同期
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 確認用クエリ

### 認証ユーザー数とusersテーブルの件数比較
```sql
-- auth.users の件数
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- public.users の件数
SELECT COUNT(*) as public_users_count FROM public.users;
```

### 同期状況の確認
```sql
-- 認証ユーザーで public.users に存在しないユーザー
SELECT au.id, au.email 
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL;
```

### 最近作成されたユーザーの確認
```sql
-- 最近作成されたユーザー（同期確認用）
SELECT 
  pu.email,
  pu.created_at,
  pu.email_verified,
  pu.is_active
FROM public.users pu 
ORDER BY pu.created_at DESC 
LIMIT 5;
```

## トラブルシューティング

### 問題1: トリガーが動作しない
**原因**: SQL実行時にエラーが発生した
**解決策**: 
1. Supabase SQL Editorでエラーメッセージを確認
2. 権限エラーの場合は、SECURITY DEFINER が設定されているか確認

### 問題2: 既存ユーザーが同期されていない
**原因**: トリガー設定前に作成されたユーザー
**解決策**: 
```bash
# 再同期スクリプトを実行
docker compose exec backend python scripts/setup_user_trigger.py
```

### 問題3: usersテーブルに重複データが作成される
**原因**: 手動追加とトリガーが競合
**解決策**: 
```sql
-- 重複削除（最新のレコードを保持）
DELETE FROM public.users 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.users
  ) t WHERE rn > 1
);
```

## メンテナンス

### 定期的な同期確認
月1回程度、認証ユーザーとusersテーブルの同期状況を確認することを推奨

### ログの確認
```sql
-- PostgreSQLログでトリガーエラーを確認
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## API使用への影響

### 変更前
```bash
# ローカルAPIのみ使用可能
GET http://localhost:8000/api/users/
```

### 変更後
```bash
# リモートSupabaseからも直接取得可能
GET https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/users

# ローカルAPIも従来通り使用可能
GET http://localhost:8000/api/users/
```

## 完了ステータス

- ✅ 既存ユーザーの同期完了
- ✅ トリガー関数とSQL作成完了  
- ✅ 設定手順書作成完了
- ⏳ **次のステップ**: Supabase SQL Editorでトリガー実行

---

**重要**: 上記のStep 2（データベーストリガーの設定）を実行すると、以降は新規ユーザー登録時に自動的にusersテーブルに追加されるようになります。