# Supabase セキュリティ分析レポート

## 🚨 現在の問題点

### 1. **Critical**: public.usersテーブルのデータが全ユーザーに公開
```bash
# 一般ユーザーが他の全ユーザーのデータを見ることができる
GET https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/users
→ 全ユーザーのメールアドレス等が見える（危険）
```

### 2. **Good**: auth.usersテーブルは適切に保護されている
```bash
# 一般ユーザーはauth.usersにアクセスできない
GET https://uilydqaqephxtcnnqihy.supabase.co/rest/v1/auth.users
→ "relation does not exist" エラー（正常）
```

## ✅ 推奨セキュリティ設定

### 一般ユーザーが必要なアクセス権限

1. **ログイン・認証**
   - ✅ Supabase Auth API（signup, signin, logout）
   - ✅ 自分のユーザー情報取得（`/auth/v1/user`）

2. **自分のデータのみアクセス**
   - ✅ 自分のプロフィール情報（`public.users` where id = auth.uid()）
   - ✅ 自分のユーザープロフィール（`public.user_profiles`）
   - ✅ 自分の権限情報（`public.user_roles`）

3. **公開データの閲覧**
   - ✅ 会場情報（`public.venues`）
   - ✅ 学部情報（`public.departments`）
   - ✅ 空き状況（`public.availability_slots`）

4. **アクセス禁止**
   - ❌ 他のユーザーの個人情報
   - ❌ auth.usersテーブル
   - ❌ 管理者専用データ

## 🔧 設定手順

### Step 1: Row Level Security (RLS) の有効化

```sql
-- public.usersテーブルにRLSを適用
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can only update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);
```

### Step 2: 管理者権限の設定

```sql
-- 管理者（service role）は全データアクセス可能
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');
```

### Step 3: 公開データの設定

```sql
-- 会場情報は認証済みユーザーが閲覧可能
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view venues" ON public.venues
    FOR SELECT TO authenticated USING (is_active = true);
```

## 🧪 テスト方法

### 1. 一般ユーザーのテスト
```bash
# 自分のデータのみ取得できることを確認
curl -X GET "https://your-supabase-url/rest/v1/users?id=eq.{自分のID}" \
  -H "Authorization: Bearer {ユーザートークン}"
# → 自分のデータのみ取得される

# 他のユーザーデータは取得できないことを確認
curl -X GET "https://your-supabase-url/rest/v1/users?limit=10" \
  -H "Authorization: Bearer {ユーザートークン}"
# → 自分のデータのみ取得される（他のユーザーは見えない）
```

### 2. 管理者権限のテスト
```bash
# サービスロールキーで全データ取得できることを確認
curl -X GET "https://your-supabase-url/rest/v1/users" \
  -H "Authorization: Bearer {サービスロールキー}"
# → 全ユーザーデータが取得される
```

## 📋 実装チェックリスト

- [ ] **public.users テーブルにRLS適用**
- [ ] **自分のデータのみアクセス可能なポリシー作成**
- [ ] **管理者権限の設定**
- [ ] **user_profiles テーブルにRLS適用**
- [ ] **user_roles テーブルにRLS適用**
- [ ] **公開データテーブル（venues, departments）の設定**
- [ ] **セキュリティテストの実行**

## ⚠️ 重要な注意事項

1. **RLS適用前のテスト**: RLSを適用する前に、現在のアプリケーションが正常に動作することを確認

2. **段階的実装**: 一度に全テーブルにRLSを適用せず、重要度の高いテーブルから順番に実装

3. **バックアップ**: データベース変更前に必ずバックアップを取得

4. **フロントエンド影響**: RLS適用後、フロントエンドアプリケーションが正常に動作することを確認

## 🚀 次のアクション

1. **即座に実行すべき**: `public.users`テーブルのRLS適用（セキュリティリスク軽減のため）
2. **順次実行**: 他のテーブルのRLS適用
3. **テスト**: 全機能が正常に動作することを確認