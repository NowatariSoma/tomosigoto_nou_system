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
-- Step 4: public.venues テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーはアクティブな会場を閲覧可能
CREATE POLICY "Authenticated users can view active venues" ON public.venues
    FOR SELECT TO authenticated USING (is_active = true);

-- 管理者は全会場アクセス可能
CREATE POLICY "Admins can manage all venues" ON public.venues
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 5: public.departments テーブルのRLS設定
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
-- Step 6: public.availability_slots テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは空き状況を閲覧可能
CREATE POLICY "Authenticated users can view availability" ON public.availability_slots
    FOR SELECT TO authenticated USING (true);

-- 管理者は全空き状況アクセス可能
CREATE POLICY "Admins can manage all availability" ON public.availability_slots
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 7: public.venue_attributes テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.venue_attributes ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは会場属性を閲覧可能
CREATE POLICY "Authenticated users can view venue attributes" ON public.venue_attributes
    FOR SELECT TO authenticated USING (true);

-- 管理者は全会場属性アクセス可能
CREATE POLICY "Admins can manage all venue attributes" ON public.venue_attributes
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- Step 8: public.recurring_units テーブルのRLS設定
-- ========================================

-- RLSを有効化
ALTER TABLE public.recurring_units ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは定期予約枠を閲覧可能
CREATE POLICY "Authenticated users can view recurring units" ON public.recurring_units
    FOR SELECT TO authenticated USING (true);

-- 管理者は全定期予約枠アクセス可能
CREATE POLICY "Admins can manage all recurring units" ON public.recurring_units
    FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- セキュリティ設定完了
-- ========================================

-- コメント: このマイグレーションにより、以下のセキュリティ設定が適用されます：
-- 1. ユーザーは自分のデータのみアクセス可能
-- 2. 認証済みユーザーは公開データを閲覧可能
-- 3. 管理者（service role）は全データにアクセス可能
-- 4. auth.usersテーブルは適切に保護されている（Supabase標準）
