-- Supabaseで練習表用のテーブルを作成するSQLスクリプト
-- SupabaseのダッシュボードのSQLエディタで実行してください

-- 1. practice_slots テーブル
CREATE TABLE IF NOT EXISTS practice_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. schedule_items テーブル
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

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_practice_slots_date ON practice_slots(date);
CREATE INDEX IF NOT EXISTS idx_schedule_items_practice_slot_id ON schedule_items(practice_slot_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_time ON schedule_items(time);

-- 4. 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. トリガーの作成
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

-- 6. サンプルデータの挿入（5月26日の練習表）
INSERT INTO practice_slots (date, title, description, is_active) 
VALUES ('2024-05-26', '2024-05-26の練習表', 'サンプルデータ付きの練習表です', true)
ON CONFLICT (date) DO NOTHING;

-- 7. サンプルスケジュールアイテムの挿入
INSERT INTO schedule_items (practice_slot_id, time, duration, activity, columns)
SELECT 
    ps.id,
    '19:00',
    '(5)',
    '集合・挨拶',
    ARRAY['', '', '', '', '']
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '19:05',
    '(10)',
    '女子準備',
    ARRAY['', '男子準備', '', '', '']
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '19:15',
    '(20)',
    '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
    ARRAY[
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート'
    ]
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '19:35',
    '(15)',
    '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
    ARRAY[
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート'
    ]
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '19:50',
    '(20)',
    '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
    ARRAY[
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート'
    ]
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '20:10',
    '(15)',
    '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
    ARRAY[
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート'
    ]
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '20:25',
    '(20)',
    '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
    ARRAY[
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート',
        '○○パート' || chr(10) || '××パート' || chr(10) || '△△パート'
    ]
FROM practice_slots ps WHERE ps.date = '2024-05-26'

UNION ALL

SELECT 
    ps.id,
    '20:45',
    '',
    '集合・整上坊・挨拶',
    ARRAY['', '', '', '', '']
FROM practice_slots ps WHERE ps.date = '2024-05-26';
