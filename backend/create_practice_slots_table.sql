-- practice_slotsテーブルを作成するSQLスクリプト
-- SupabaseダッシュボードのSQLエディタで実行してください

CREATE TABLE IF NOT EXISTS practice_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
CREATE INDEX IF NOT EXISTS idx_practice_slots_is_active ON practice_slots(is_active);

-- コメントを追加
COMMENT ON TABLE practice_slots IS '練習日（日付）を管理するテーブル';
COMMENT ON COLUMN practice_slots.date IS '練習日（日付）';
COMMENT ON COLUMN practice_slots.title IS '練習表のタイトル';
COMMENT ON COLUMN practice_slots.description IS '説明';
COMMENT ON COLUMN practice_slots.is_active IS 'アクティブフラグ';

-- サンプルデータを挿入（オプション）
INSERT INTO practice_slots (date, title, description, is_active) 
VALUES 
    ('2024-05-26', '5月26日練習', '通常練習', true),
    ('2024-05-27', '5月27日練習', '通常練習', true),
    ('2024-05-28', '5月28日練習', '通常練習', true)
ON CONFLICT (date) DO NOTHING;

