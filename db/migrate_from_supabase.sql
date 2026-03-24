-- ============================================================
-- Supabase (auth.users) → Docker PostgreSQL (public.users) 本番データ移行スクリプト
-- 使い方:
--   1. このスクリプトは Supabase の PostgreSQL に接続して実行する
--   2. 移行先の Docker PostgreSQL に INSERT する前に、スキーマを適用済みにすること
-- ============================================================

-- Step 1: auth.users のデータを確認
SELECT COUNT(*) FROM auth.users;

-- Step 2: 移行先 (新 DB) に接続して以下を実行
-- ※ Supabase の psql から実行する場合は \connect で接続先を変える

INSERT INTO public.users (
    id,
    email,
    encrypted_password,
    is_verified,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
)
SELECT
    id,
    email,
    encrypted_password,
    CASE WHEN email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END AS is_verified,
    COALESCE(raw_user_meta_data, '{}') AS raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 確認
SELECT COUNT(*) FROM public.users;
