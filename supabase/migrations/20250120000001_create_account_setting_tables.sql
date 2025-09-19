-- ====================================================================
-- Account Setting Tables Migration
-- ====================================================================
-- account-setting機能に必要なテーブル構造を整備
-- ====================================================================

-- 1. user_profilesテーブルに不足しているフィールドを追加
-- 既存のテーブル構造を確認し、必要に応じてカラムを追加

-- 学部情報を管理するテーブル（既存のdepartmentsテーブルを拡張）
-- フロントエンドの学部選択肢に対応
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_code VARCHAR(10) UNIQUE NOT NULL,
    faculty_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 学部データのシード
INSERT INTO faculties (faculty_code, faculty_name) VALUES
    ('神', '神学部'),
    ('文', '文学部'),
    ('社会', '社会学部'),
    ('法', '法学部'),
    ('経済', '経済学部'),
    ('商', '商学部'),
    ('理工', '理工学部'),
    ('医', '医学部')
ON CONFLICT (faculty_code) DO NOTHING;

-- user_profilesテーブルにfaculty_idを追加（既存のdepartment_idとは別）
-- 既存のテーブル構造を壊さないよう、条件付きでカラムを追加
DO $$ 
BEGIN
    -- faculty_idカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'faculty_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN faculty_id UUID REFERENCES faculties(id);
    END IF;
END $$;

-- アカウント設定の更新履歴を管理するテーブル
CREATE TABLE IF NOT EXISTS account_setting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_account_setting_history_user_id ON account_setting_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_setting_history_changed_at ON account_setting_history(changed_at);

-- updated_at自動更新トリガー
CREATE TRIGGER update_faculties_updated_at
    BEFORE UPDATE ON public.faculties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- アカウント設定用のビュー（フロントエンド用）
CREATE OR REPLACE VIEW account_setting_profile AS
SELECT 
    up.id,
    up.user_id,
    up.student_id,
    up.first_name_kanji,
    up.first_name_katakana,
    up.last_name_kanji,
    up.last_name_katakana,
    up.grade as year,
    f.faculty_code as faculty,
    f.faculty_name as faculty_name,
    u.email,
    up.avatar_url,
    up.preferences,
    up.created_at,
    up.updated_at
FROM user_profiles up
LEFT JOIN auth.users u ON up.user_id = u.id
LEFT JOIN faculties f ON up.faculty_id = f.id;

-- テーブルコメント
COMMENT ON TABLE faculties IS '学部情報を管理するテーブル';
COMMENT ON TABLE account_setting_history IS 'アカウント設定の変更履歴を管理するテーブル';
COMMENT ON VIEW account_setting_profile IS 'アカウント設定画面用のプロフィール情報ビュー';

-- カラムコメント
COMMENT ON COLUMN faculties.faculty_code IS '学部コード（フロントエンドの選択肢と対応）';
COMMENT ON COLUMN faculties.faculty_name IS '学部名';
COMMENT ON COLUMN user_profiles.faculty_id IS '所属学部ID（facultiesテーブル参照）';
COMMENT ON COLUMN account_setting_history.field_name IS '変更されたフィールド名';
COMMENT ON COLUMN account_setting_history.old_value IS '変更前の値';
COMMENT ON COLUMN account_setting_history.new_value IS '変更後の値';
COMMENT ON COLUMN account_setting_history.change_reason IS '変更理由';

-- RLS (Row Level Security) ポリシー
-- ユーザーは自分のアカウント設定のみアクセス可能
ALTER TABLE account_setting_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account setting history" ON account_setting_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own account setting history" ON account_setting_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- アカウント設定プロフィールビューのRLS
-- このビューは既存のuser_profilesテーブルのRLSに依存
