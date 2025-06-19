-- 拠点テーブル
create table if not exists public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    frist_name_kanji TEXT NOT NULL,
    frist_name_katakana TEXT NOT NULL,
    last_name_kanji TEXT NOT NULL,
    last_name_katakana TEXT NOT NULL,
    grade INTEGER,
    department_id TEXT NOT NULL,
    abatar_url TEXT,
    preferences JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

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