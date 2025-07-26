-- ユーザーアカウントテーブル作成
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_provider VARCHAR(255) NOT NULL DEFAULT 'email',
    password_hash VARCHAR(255), -- Supabase Authが管理するため、通常はNULL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false
);

-- インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- updated_at を自動更新するトリガー
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の情報のみ参照可能
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- 管理者は全ユーザー参照可能（実際の権限管理は後で実装）
CREATE POLICY "users_select_admin" ON users
    FOR SELECT
    USING (true); -- 一旦全ユーザーに許可、後で権限チェック機能を追加

-- 新規ユーザー作成は誰でも可能（サインアップ）
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (true);

-- ユーザーは自分の情報のみ更新可能
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- テーブルコメント
COMMENT ON TABLE users IS 'ユーザーアカウントテーブル';
COMMENT ON COLUMN users.id IS 'ユーザーID（UUID）';
COMMENT ON COLUMN users.email IS 'メールアドレス（一意制約）';
COMMENT ON COLUMN users.auth_provider IS '認証プロバイダ（email, google等）';
COMMENT ON COLUMN users.password_hash IS 'パスワードハッシュ（Supabase Auth管理）';
COMMENT ON COLUMN users.created_at IS '作成日時';
COMMENT ON COLUMN users.updated_at IS '更新日時';
COMMENT ON COLUMN users.last_login IS '最終ログイン日時';
COMMENT ON COLUMN users.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN users.email_verified IS 'メール検証済みフラグ';