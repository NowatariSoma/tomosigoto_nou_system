-- 所属履歴テーブル作成
-- BACK-DB-001.2: パート区分・メンバー所属テーブル設計

-- 所属履歴テーブル作成
CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES member_assignments(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    previous_state JSONB DEFAULT '{}',
    new_state JSONB DEFAULT '{}',
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 制約
    CONSTRAINT check_action_type_valid CHECK (
        action_type IN (
            'create', 'update', 'end', 'suspend', 'reactivate', 
            'transfer', 'skill_update', 'experience_add', 'delete'
        )
    )
);

-- テーブルコメント
COMMENT ON TABLE assignment_history IS 'パート所属の変更履歴を記録するテーブル';
COMMENT ON COLUMN assignment_history.id IS '履歴ID（主キー、UUID）';
COMMENT ON COLUMN assignment_history.assignment_id IS '所属ID（member_assignmentsテーブル参照）';
COMMENT ON COLUMN assignment_history.action_type IS 'アクション種別';
COMMENT ON COLUMN assignment_history.previous_state IS '変更前状態（JSON形式）';
COMMENT ON COLUMN assignment_history.new_state IS '変更後状態（JSON形式）';
COMMENT ON COLUMN assignment_history.action_date IS 'アクション実行日時';
COMMENT ON COLUMN assignment_history.reason IS '変更理由';
COMMENT ON COLUMN assignment_history.modified_by IS '変更者ID（usersテーブル参照）';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON assignment_history(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_action_date ON assignment_history(action_date);
CREATE INDEX IF NOT EXISTS idx_assignment_history_action_type ON assignment_history(action_type);
CREATE INDEX IF NOT EXISTS idx_assignment_history_modified_by ON assignment_history(modified_by);

-- 複合インデックス（履歴検索用）
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_date ON assignment_history(assignment_id, action_date DESC);

-- 履歴自動記録トリガー関数
CREATE OR REPLACE FUNCTION record_assignment_history()
RETURNS TRIGGER AS $$
DECLARE
    action_type_val VARCHAR(50);
    previous_data JSONB;
    new_data JSONB;
BEGIN
    -- アクション種別を決定
    IF TG_OP = 'INSERT' THEN
        action_type_val := 'create';
        previous_data := '{}'::jsonb;
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        -- 具体的な更新内容に基づいてアクション種別を設定
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'ended' THEN
                action_type_val := 'end';
            ELSIF NEW.status = 'suspended' THEN
                action_type_val := 'suspend';
            ELSIF NEW.status = 'active' AND OLD.status != 'active' THEN
                action_type_val := 'reactivate';
            ELSE
                action_type_val := 'update';
            END IF;
        ELSIF OLD.skill_level != NEW.skill_level THEN
            action_type_val := 'skill_update';
        ELSIF OLD.experience_points != NEW.experience_points THEN
            action_type_val := 'experience_add';
        ELSE
            action_type_val := 'update';
        END IF;
        
        previous_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_type_val := 'delete';
        previous_data := to_jsonb(OLD);
        new_data := '{}'::jsonb;
    END IF;
    
    -- 履歴レコード挿入
    INSERT INTO assignment_history (
        assignment_id,
        action_type,
        previous_state,
        new_state,
        action_date,
        modified_by
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type_val,
        previous_data,
        new_data,
        NOW(),
        -- 現在のユーザーIDを取得（可能な場合）
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    );
    
    -- トリガーの動作を継続
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 履歴自動記録トリガー
DROP TRIGGER IF EXISTS record_assignment_history_trigger ON member_assignments;
CREATE TRIGGER record_assignment_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON member_assignments
    FOR EACH ROW
    EXECUTE FUNCTION record_assignment_history();

-- 統計情報取得のためのビュー作成
CREATE OR REPLACE VIEW assignment_statistics AS
SELECT 
    p.id as part_id,
    p.name as part_name,
    pc.name as category_name,
    COUNT(ma.id) as total_assignments,
    COUNT(CASE WHEN ma.status = 'active' THEN 1 END) as active_assignments,
    COUNT(CASE WHEN ma.is_primary = true AND ma.status = 'active' THEN 1 END) as primary_assignments,
    AVG(CASE WHEN ma.status = 'active' THEN ma.skill_level END) as avg_skill_level,
    SUM(CASE WHEN ma.status = 'active' THEN ma.experience_points END) as total_experience_points
FROM part_definitions p
JOIN part_categories pc ON p.category_id = pc.id
LEFT JOIN member_assignments ma ON p.id = ma.part_id
WHERE p.is_active = true
GROUP BY p.id, p.name, pc.name;

-- ビューコメント
COMMENT ON VIEW assignment_statistics IS 'パート別の所属統計情報を提供するビュー';

-- RLS設定
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定（履歴は参照のみ、管理者は全操作可能）
CREATE POLICY IF NOT EXISTS "Users can view related assignment history" ON assignment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM member_assignments ma 
            WHERE ma.id = assignment_id 
            AND (ma.user_id = auth.uid() OR auth.role() = 'authenticated')
        )
    );

CREATE POLICY IF NOT EXISTS "Authenticated users can insert history" ON assignment_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');