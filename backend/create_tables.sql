-- 練習表用のテーブル作成SQL

-- practice_slots テーブル
CREATE TABLE IF NOT EXISTS practice_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- schedule_items テーブル
CREATE TABLE IF NOT EXISTS schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_slot_id UUID NOT NULL REFERENCES practice_slots(id) ON DELETE CASCADE,
    time VARCHAR(10) NOT NULL,
    duration VARCHAR(20),
    activity TEXT NOT NULL,
    columns TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
CREATE INDEX IF NOT EXISTS idx_schedule_items_practice_slot_id ON schedule_items(practice_slot_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_time ON schedule_items(time);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
DROP TRIGGER IF EXISTS update_practice_slots_updated_at ON practice_slots;
CREATE TRIGGER update_practice_slots_updated_at
    BEFORE UPDATE ON practice_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_items_updated_at ON schedule_items;
CREATE TRIGGER update_schedule_items_updated_at
    BEFORE UPDATE ON schedule_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
