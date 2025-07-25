-- 利用可能時間枠テーブル作成
CREATE TABLE availability_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'maintenance')),
    cost DECIMAL(10, 2) DEFAULT 0,
    constraints JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 外部キー制約
    CONSTRAINT fk_availability_slots_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    
    -- 時間の論理制約（開始時間 < 終了時間）
    CONSTRAINT chk_availability_slots_time_order CHECK (start_time < end_time),
    
    -- 複合一意制約（同じ会場・日付・時間の重複スロット防止）
    CONSTRAINT uk_availability_slots_venue_datetime 
        UNIQUE (venue_id, slot_date, start_time, end_time)
);

-- インデックス作成
CREATE INDEX idx_availability_slots_venue_id ON availability_slots(venue_id);
CREATE INDEX idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX idx_availability_slots_status ON availability_slots(status);
CREATE INDEX idx_availability_slots_venue_date_status ON availability_slots(venue_id, slot_date, status);
CREATE INDEX idx_availability_slots_date_range ON availability_slots(slot_date, start_time, end_time);

-- JSONB制約用のGINインデックス
CREATE INDEX idx_availability_slots_constraints ON availability_slots USING GIN (constraints);

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();