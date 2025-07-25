-- メンバー所属テーブル作成（複数所属対応）
-- BACK-DB-001.2: パート区分・メンバー所属テーブル設計

-- メンバー所属テーブル作成
CREATE TABLE IF NOT EXISTS member_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES part_definitions(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT FALSE,
    skill_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    assigned_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT check_skill_level_range CHECK (skill_level >= 1 AND skill_level <= 10),
    CONSTRAINT check_experience_points_positive CHECK (experience_points >= 0),
    CONSTRAINT check_date_order CHECK (end_date IS NULL OR end_date >= assigned_date),
    CONSTRAINT check_status_valid CHECK (status IN ('active', 'ended', 'suspended', 'transferred')),
    
    -- 複合一意制約（同じユーザーが同じパートに同時期に複数の有効な所属を持てない）
    CONSTRAINT unique_active_assignment EXCLUDE USING gist (
        user_id WITH =,
        part_id WITH =,
        daterange(assigned_date, COALESCE(end_date, 'infinity'::date), '[)') WITH &&
    ) WHERE (status = 'active')
);

-- テーブルコメント
COMMENT ON TABLE member_assignments IS 'メンバーのパート所属情報を管理するテーブル（複数所属対応）';
COMMENT ON COLUMN member_assignments.id IS '所属ID（主キー、UUID）';
COMMENT ON COLUMN member_assignments.user_id IS 'ユーザーID（usersテーブル参照）';
COMMENT ON COLUMN member_assignments.part_id IS 'パートID（part_definitionsテーブル参照）';
COMMENT ON COLUMN member_assignments.is_primary IS '主担当フラグ';
COMMENT ON COLUMN member_assignments.skill_level IS 'スキルレベル（1-10）';
COMMENT ON COLUMN member_assignments.experience_points IS '経験値';
COMMENT ON COLUMN member_assignments.assigned_date IS '所属開始日';
COMMENT ON COLUMN member_assignments.end_date IS '所属終了日（NULLの場合継続中）';
COMMENT ON COLUMN member_assignments.status IS 'ステータス（active/ended/suspended/transferred）';
COMMENT ON COLUMN member_assignments.attributes IS '所属属性情報（JSON形式）';
COMMENT ON COLUMN member_assignments.created_at IS '作成日時';
COMMENT ON COLUMN member_assignments.updated_at IS '更新日時';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_member_assignments_user_id ON member_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_member_assignments_part_id ON member_assignments(part_id);
CREATE INDEX IF NOT EXISTS idx_member_assignments_status ON member_assignments(status);
CREATE INDEX IF NOT EXISTS idx_member_assignments_assigned_date ON member_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_member_assignments_is_primary ON member_assignments(is_primary);

-- 複合インデックス（よく使われるクエリ用）
CREATE INDEX IF NOT EXISTS idx_member_assignments_user_status ON member_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_member_assignments_part_status ON member_assignments(part_id, status);
CREATE INDEX IF NOT EXISTS idx_member_assignments_active_range ON member_assignments(assigned_date, end_date) 
    WHERE status = 'active';

-- 更新日時自動更新トリガー
DROP TRIGGER IF EXISTS update_member_assignments_updated_at ON member_assignments;
CREATE TRIGGER update_member_assignments_updated_at
    BEFORE UPDATE ON member_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 主担当チェック関数（1つのパートに主担当は1人まで）
CREATE OR REPLACE FUNCTION check_primary_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- 主担当として設定しようとする場合
    IF NEW.is_primary = TRUE AND NEW.status = 'active' THEN
        -- 同じパートで他に主担当がいる場合はエラー
        IF EXISTS (
            SELECT 1 FROM member_assignments 
            WHERE part_id = NEW.part_id 
              AND is_primary = TRUE 
              AND status = 'active'
              AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
              AND (end_date IS NULL OR end_date > CURRENT_DATE)
        ) THEN
            RAISE EXCEPTION 'Only one primary assignment per part is allowed at a time';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 主担当チェックトリガー
DROP TRIGGER IF EXISTS check_primary_assignment_trigger ON member_assignments;
CREATE TRIGGER check_primary_assignment_trigger
    BEFORE INSERT OR UPDATE ON member_assignments
    FOR EACH ROW
    EXECUTE FUNCTION check_primary_assignment();

-- RLS設定
ALTER TABLE member_assignments ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定（ユーザーは自分の所属情報のみ参照可能、管理者は全て）
CREATE POLICY IF NOT EXISTS "Users can view own assignments" ON member_assignments
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can insert assignments" ON member_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can update assignments" ON member_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete assignments" ON member_assignments
    FOR DELETE USING (auth.role() = 'authenticated');