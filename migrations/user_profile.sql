-- ユーザープロフィールテーブル作成
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name_kanji VARCHAR(50) NOT NULL,
    first_name_katakana VARCHAR(50) NOT NULL,
    last_name_kanji VARCHAR(50) NOT NULL,
    last_name_katakana VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 4),
    department_id UUID NOT NULL REFERENCES departments(id),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON user_profiles(grade);
CREATE INDEX IF NOT EXISTS idx_user_profiles_name_kanji ON user_profiles(last_name_kanji, first_name_kanji);
CREATE INDEX IF NOT EXISTS idx_user_profiles_name_katakana ON user_profiles(last_name_katakana, first_name_katakana);

-- updated_at を自動更新するトリガー
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ参照可能
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 管理者は全プロフィール参照可能（実際の権限管理は後で実装）
CREATE POLICY "user_profiles_select_admin" ON user_profiles
    FOR SELECT
    USING (true); -- 一旦全ユーザーに許可、後で権限チェック機能を追加

-- プロフィール作成は本人のみ可能
CREATE POLICY "user_profiles_insert_own" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- プロフィール更新は本人のみ可能
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- カタカナフィールドの制約チェック関数
CREATE OR REPLACE FUNCTION validate_katakana(text_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- カタカナ、ハイフン、スペースのみ許可
    RETURN text_value ~ '^[ァ-ヶー\s]+$';
END;
$$ LANGUAGE plpgsql;

-- カタカナ検証のチェック制約
ALTER TABLE user_profiles 
ADD CONSTRAINT check_first_name_katakana 
CHECK (validate_katakana(first_name_katakana));

ALTER TABLE user_profiles 
ADD CONSTRAINT check_last_name_katakana 
CHECK (validate_katakana(last_name_katakana));

-- 学籍番号の形式チェック（8桁の数字）
ALTER TABLE user_profiles 
ADD CONSTRAINT check_student_id_format 
CHECK (student_id ~ '^[0-9]{8,}$');

-- テーブルコメント
COMMENT ON TABLE user_profiles IS 'ユーザープロフィールテーブル（学生情報）';
COMMENT ON COLUMN user_profiles.id IS 'プロフィールID';
COMMENT ON COLUMN user_profiles.user_id IS 'ユーザーID参照';
COMMENT ON COLUMN user_profiles.student_id IS '学籍番号（一意制約）';
COMMENT ON COLUMN user_profiles.first_name_kanji IS '名（漢字）';
COMMENT ON COLUMN user_profiles.first_name_katakana IS '名（カタカナ）';
COMMENT ON COLUMN user_profiles.last_name_kanji IS '姓（漢字）';
COMMENT ON COLUMN user_profiles.last_name_katakana IS '姓（カタカナ）';
COMMENT ON COLUMN user_profiles.grade IS '学年（1-4回生）';
COMMENT ON COLUMN user_profiles.department_id IS '学部ID参照';
COMMENT ON COLUMN user_profiles.avatar_url IS 'アバター画像URL';
COMMENT ON COLUMN user_profiles.preferences IS 'ユーザー設定（JSON）';
COMMENT ON COLUMN user_profiles.created_at IS '作成日時';
COMMENT ON COLUMN user_profiles.updated_at IS '更新日時';