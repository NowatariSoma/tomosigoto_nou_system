-- ユーザーロールテーブル作成
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('system_admin', 'club_admin', 'senior', 'general')),
    is_visible_to_general BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_visibility ON user_roles(is_visible_to_general);

-- updated_at を自動更新するトリガー
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- システム管理者は自動的に非表示に設定するトリガー
CREATE OR REPLACE FUNCTION set_system_admin_visibility()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role_type = 'system_admin' THEN
        NEW.is_visible_to_general = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_system_admin_visibility ON user_roles;
CREATE TRIGGER trigger_set_system_admin_visibility
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION set_system_admin_visibility();

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のロール情報のみ参照可能
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 管理者は全ロール情報参照可能（実際の権限管理は後で実装）
CREATE POLICY "user_roles_select_admin" ON user_roles
    FOR SELECT
    USING (true); -- 一旦全ユーザーに許可、後で権限チェック機能を追加

-- ロール作成は管理者のみ可能（実際の権限管理は後で実装）
CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT
    WITH CHECK (true); -- 一旦全ユーザーに許可、後で権限チェック機能を追加

-- ロール更新は管理者のみ可能（実際の権限管理は後で実装）
CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE
    USING (true); -- 一旦全ユーザーに許可、後で権限チェック機能を追加

-- ロール階層の説明を含むビュー
CREATE OR REPLACE VIEW role_hierarchy AS
SELECT 
    role_type,
    CASE role_type
        WHEN 'system_admin' THEN 1
        WHEN 'club_admin' THEN 2
        WHEN 'senior' THEN 3
        WHEN 'general' THEN 4
    END as hierarchy_level,
    CASE role_type
        WHEN 'system_admin' THEN 'システム管理者'
        WHEN 'club_admin' THEN '能楽部管理者'
        WHEN 'senior' THEN '4回生'
        WHEN 'general' THEN '一般部員'
    END as role_display_name,
    CASE role_type
        WHEN 'system_admin' THEN 'システム全体の管理権限'
        WHEN 'club_admin' THEN '能楽部の管理権限'
        WHEN 'senior' THEN '4回生としての権限'
        WHEN 'general' THEN '一般部員としての権限'
    END as description
FROM (VALUES 
    ('system_admin'),
    ('club_admin'),
    ('senior'),
    ('general')
) AS roles(role_type);

-- 権限管理用のヘルパー関数
CREATE OR REPLACE FUNCTION can_manage_role(manager_role TEXT, target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- システム管理者は全ロールを管理可能
    IF manager_role = 'system_admin' THEN
        RETURN true;
    END IF;
    
    -- 能楽部管理者はsystem_admin以外を管理可能
    IF manager_role = 'club_admin' AND target_role != 'system_admin' THEN
        RETURN true;
    END IF;
    
    -- その他は管理権限なし
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 表示可能ユーザーを取得するビュー（一般ユーザー向け）
CREATE OR REPLACE VIEW visible_users AS
SELECT 
    u.id,
    u.email,
    u.is_active,
    ur.role_type,
    CASE ur.role_type
        WHEN 'system_admin' THEN 'システム管理者'
        WHEN 'club_admin' THEN '能楽部管理者'
        WHEN 'senior' THEN '4回生'
        WHEN 'general' THEN '一般部員'
    END as role_display_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.is_visible_to_general = true
  AND u.is_active = true;

-- テーブルコメント
COMMENT ON TABLE user_roles IS 'ユーザーロールテーブル（権限管理）';
COMMENT ON COLUMN user_roles.id IS 'ロールID';
COMMENT ON COLUMN user_roles.user_id IS 'ユーザーID参照';
COMMENT ON COLUMN user_roles.role_type IS 'ロールタイプ（system_admin, club_admin, senior, general）';
COMMENT ON COLUMN user_roles.is_visible_to_general IS '一般ユーザーに表示するか';
COMMENT ON COLUMN user_roles.created_at IS '作成日時';
COMMENT ON COLUMN user_roles.updated_at IS '更新日時';

COMMENT ON VIEW role_hierarchy IS 'ロール階層情報ビュー';
COMMENT ON VIEW visible_users IS '一般ユーザーに表示可能なユーザー一覧ビュー';