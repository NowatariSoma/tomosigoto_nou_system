
-- 1. users ビュー (認証の真実は auth.users。GUI/JOIN 用に公開スキーマへビュー提供)
CREATE OR REPLACE VIEW public.users AS
SELECT
    u.id,
    u.email,
    u.created_at,
    u.updated_at,
    u.last_sign_in_at,
    u.raw_user_meta_data
FROM auth.users u;

-- 2. departments テーブル
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) UNIQUE,
    department_name VARCHAR(100),
    campus VARCHAR(50),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. user_profiles テーブル
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    student_id TEXT UNIQUE NOT NULL,
    first_name_kanji TEXT NOT NULL,
    first_name_katakana TEXT NOT NULL,
    last_name_kanji TEXT NOT NULL,
    last_name_katakana TEXT NOT NULL,
    grade INTEGER,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    avatar_url TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. user_roles テーブル
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), 
    role_type TEXT NOT NULL,
    is_visible_to_general BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- updated_at を自動更新するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_profiles テーブルにトリガーを設定
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
    