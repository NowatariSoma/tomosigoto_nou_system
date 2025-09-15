-- 練習表（日付）管理テーブル作成
-- 練習日ごとのスケジュールを管理するテーブル

-- 1. practice_slots テーブル（練習日管理）
CREATE TABLE practice_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE, -- 練習日（日付）
    title VARCHAR(255), -- 練習表のタイトル
    description TEXT, -- 説明
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_practice_slots_date ON practice_slots(date);
CREATE INDEX idx_practice_slots_is_active ON practice_slots(is_active);

-- トリガーの作成
CREATE TRIGGER update_practice_slots_updated_at
    BEFORE UPDATE ON practice_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE practice_slots IS '練習日（日付）を管理するテーブル';
COMMENT ON COLUMN practice_slots.date IS '練習日（日付）';
COMMENT ON COLUMN practice_slots.title IS '練習表のタイトル';
COMMENT ON COLUMN practice_slots.description IS '説明';
COMMENT ON COLUMN practice_slots.is_active IS 'アクティブフラグ';

