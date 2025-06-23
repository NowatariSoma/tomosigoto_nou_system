-- 事前準備: UUID関数を有効化 (一度だけ実行)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users テーブル
-- user_profiles.user_id が参照するテーブル
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- IDはUUID型
    email VARCHAR(255),
    auth_provider VARCHAR(255),
    password_hash VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE
);

-- 2. departments テーブル
-- user_profiles.department_id が参照するテーブル
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),      -- IDはUUID型
    department_code VARCHAR(50) UNIQUE,
    department_name VARCHAR(100),
    campus VARCHAR(50),
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. user_profiles テーブル (修正版)
-- user_id と department_id のデータ型を UUID に修正
-- カラム名のスペルミス (frist -> first) を修正
-- preferences の型を JSONB に修正 (任意)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT, -- TEXTからUUIDに修正
    student_id TEXT UNIQUE NOT NULL,
    first_name_kanji TEXT NOT NULL,
    first_name_katakana TEXT NOT NULL,
    last_name_kanji TEXT NOT NULL,
    last_name_katakana TEXT NOT NULL,
    grade INTEGER,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT, -- TEXTからUUIDに、参照先をdepartments(id)に修正
    avatar_url TEXT,
    preferences JSONB, -- JSONからJSONBに修正
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. user_roles テーブル
-- user_id の参照先 (public.users.id) はUUIDなので、user_idもUUIDでOK
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE, -- user_idはUUIDでOK, ON DELETE CASCADEを追加(任意)
    role_type TEXT NOT NULL,
    is_visible_to_general BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- updated_at を自動更新するための関数 (修正なし)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_profiles テーブルにトリガーを設定 (修正なし)
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- departments テーブルにトリガーを設定 (追加: departmentsテーブルもupdated_atを自動更新するなら)
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- user_roles テーブルにトリガーを設定 (追加: user_rolesテーブルもupdated_atを自動更新するなら)
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();