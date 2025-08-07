-- Supabase セキュリティ設定: Row Level Security (RLS) ポリシー
-- SECURITY_ANALYSIS.md に基づくセキュリティ設定
-- リモートプロジェクト uilydqaqephxtcnnqihy 用

-- ========================================
-- Step 1: public.users テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能（SELECT）
CREATE POLICY "Users can only view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能（UPDATE）
CREATE POLICY "Users can only update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ユーザーは自分のデータのみ挿入可能（INSERT）
CREATE POLICY "Users can only insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 管理者（service role）は全データアクセス可能
CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 2: public.user_profiles テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみアクセス可能
CREATE POLICY "Users can only view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者は全プロフィールアクセス可能
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 3: public.user_roles テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の権限のみアクセス可能
CREATE POLICY "Users can only view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- 管理者は全権限アクセス可能
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 4: public.departments テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは学部情報を閲覧可能
CREATE POLICY "Authenticated users can view departments" ON public.departments
    FOR SELECT TO authenticated USING (true);

-- 管理者は全学部アクセス可能
CREATE POLICY "Admins can manage all departments" ON public.departments
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- セキュリティ設定完了
-- ========================================

-- コメント: このマイグレーションにより、以下のセキュリティ設定が適用されます：
-- 1. ユーザーは自分のデータのみアクセス可能
-- 2. 認証済みユーザーは公開データを閲覧可能
-- 3. 管理者（service role）は全データにアクセス可能
-- 4. auth.usersテーブルは適切に保護されている（Supabase標準）
-- 5. venue関連のテーブルは別のマイグレーションファイルで設定
