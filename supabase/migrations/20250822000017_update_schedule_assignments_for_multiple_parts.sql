-- スケジュール割り当てテーブルを複数パート対応に更新
-- 1つの時間・グループの組み合わせに複数のパートを割り当てられるようにする

-- 既存のテーブルを削除（データも削除される）
DROP TABLE IF EXISTS schedule_assignments CASCADE;

-- 新しいスケジュール割り当てテーブルを作成
CREATE TABLE schedule_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_slot_id UUID NOT NULL, -- 練習日（日付）のID
    time_slot VARCHAR(10) NOT NULL, -- 時間（例: "19:00"）
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE, -- グループID
    part_id UUID NOT NULL REFERENCES practice_parts(id) ON DELETE CASCADE, -- パートID
    notes TEXT, -- 備考・メモ
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0, -- パートの表示順序
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 同一時間・グループ・パートの重複を防ぐ（パートは複数可）
    UNIQUE(practice_slot_id, time_slot, group_id, part_id)
);

-- インデックスの作成
CREATE INDEX idx_schedule_assignments_practice_slot_id ON schedule_assignments(practice_slot_id);
CREATE INDEX idx_schedule_assignments_time_slot ON schedule_assignments(time_slot);
CREATE INDEX idx_schedule_assignments_group_id ON schedule_assignments(group_id);
CREATE INDEX idx_schedule_assignments_part_id ON schedule_assignments(part_id);
CREATE INDEX idx_schedule_assignments_is_active ON schedule_assignments(is_active);
CREATE INDEX idx_schedule_assignments_sort_order ON schedule_assignments(sort_order);

-- トリガーの作成
CREATE TRIGGER update_schedule_assignments_updated_at
    BEFORE UPDATE ON schedule_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE schedule_assignments IS '練習表の各コマ（時間×グループ）にパートを割り当てるテーブル（複数パート対応）';
COMMENT ON COLUMN schedule_assignments.practice_slot_id IS '練習日（日付）のID';
COMMENT ON COLUMN schedule_assignments.time_slot IS '時間スロット（例: 19:00）';
COMMENT ON COLUMN schedule_assignments.group_id IS 'グループID参照';
COMMENT ON COLUMN schedule_assignments.part_id IS 'パートID参照';
COMMENT ON COLUMN schedule_assignments.notes IS '備考・メモ';
COMMENT ON COLUMN schedule_assignments.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN schedule_assignments.sort_order IS 'パートの表示順序';




