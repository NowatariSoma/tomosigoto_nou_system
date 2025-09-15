-- 練習表の時間・グループ・パート割り当て管理テーブル作成
-- 練習表の各コマ（時間×グループ）にどのパートが割り当てられるかを管理

-- 1. schedule_assignments テーブル（時間・グループ・パートの割り当て管理）
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_slot_id UUID NOT NULL, -- 練習日（日付）のID
    time_slot VARCHAR(10) NOT NULL, -- 時間（例: "19:00"）
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE, -- グループID
    part_id UUID REFERENCES practice_parts(id) ON DELETE SET NULL, -- パートID（NULL可）
    notes TEXT, -- 備考・メモ
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 同一時間・グループの重複を防ぐ
    UNIQUE(practice_slot_id, time_slot, group_id)
);

-- インデックスの作成
CREATE INDEX idx_schedule_assignments_practice_slot_id ON schedule_assignments(practice_slot_id);
CREATE INDEX idx_schedule_assignments_time_slot ON schedule_assignments(time_slot);
CREATE INDEX idx_schedule_assignments_group_id ON schedule_assignments(group_id);
CREATE INDEX idx_schedule_assignments_part_id ON schedule_assignments(part_id);
CREATE INDEX idx_schedule_assignments_is_active ON schedule_assignments(is_active);

-- トリガーの作成
CREATE TRIGGER update_schedule_assignments_updated_at
    BEFORE UPDATE ON schedule_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE schedule_assignments IS '練習表の各コマ（時間×グループ）にパートを割り当てるテーブル';
COMMENT ON COLUMN schedule_assignments.practice_slot_id IS '練習日（日付）のID';
COMMENT ON COLUMN schedule_assignments.time_slot IS '時間スロット（例: 19:00）';
COMMENT ON COLUMN schedule_assignments.group_id IS 'グループID参照';
COMMENT ON COLUMN schedule_assignments.part_id IS 'パートID参照（NULL可）';
COMMENT ON COLUMN schedule_assignments.notes IS '備考・メモ';
COMMENT ON COLUMN schedule_assignments.is_active IS 'アクティブフラグ';




