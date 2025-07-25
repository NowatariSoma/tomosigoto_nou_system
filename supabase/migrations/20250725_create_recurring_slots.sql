-- 定期予約枠テーブル作成
CREATE TABLE recurring_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    recurrence_rule VARCHAR(50) DEFAULT 'weekly' CHECK (recurrence_rule IN ('weekly', 'biweekly', 'monthly')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_recurring_slots_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    
    -- 時間の論理制約（開始時間 < 終了時間）
    CONSTRAINT chk_recurring_slots_time_order CHECK (start_time < end_time),
    
    -- 有効期間の論理制約（開始日 <= 終了日）
    CONSTRAINT chk_recurring_slots_date_order CHECK (valid_from <= valid_until),
    
    -- 曜日の制約（0=日曜日, 1=月曜日, ..., 6=土曜日）
    CONSTRAINT chk_recurring_slots_day_of_week CHECK (day_of_week BETWEEN 0 AND 6)
);

-- インデックス作成
CREATE INDEX idx_recurring_slots_venue_id ON recurring_slots(venue_id);
CREATE INDEX idx_recurring_slots_day_of_week ON recurring_slots(day_of_week);
CREATE INDEX idx_recurring_slots_is_active ON recurring_slots(is_active);
CREATE INDEX idx_recurring_slots_valid_period ON recurring_slots(valid_from, valid_until);
CREATE INDEX idx_recurring_slots_venue_active ON recurring_slots(venue_id, is_active);

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER update_recurring_slots_updated_at BEFORE UPDATE ON recurring_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE recurring_slots IS '定期予約枠テーブル - 会場の定期的な利用可能時間パターンを管理';
COMMENT ON COLUMN recurring_slots.day_of_week IS '曜日 (0=日曜日, 1=月曜日, ..., 6=土曜日)';
COMMENT ON COLUMN recurring_slots.recurrence_rule IS '繰り返しルール (weekly, biweekly, monthly)';