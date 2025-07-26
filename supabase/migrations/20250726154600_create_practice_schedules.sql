-- 練習スケジュールマスターテーブル作成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 練習スケジュールテーブル
CREATE TABLE IF NOT EXISTS practice_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL DEFAULT 'regular',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- 制約
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_schedule_type CHECK (schedule_type IN ('regular', 'special', 'extra', 'makeup')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'cancelled', 'completed'))
);

-- インデックス作成
CREATE INDEX idx_practice_schedules_date ON practice_schedules(schedule_date);
CREATE INDEX idx_practice_schedules_venue_date ON practice_schedules(venue_id, schedule_date);
CREATE INDEX idx_practice_schedules_status ON practice_schedules(status);
CREATE INDEX idx_practice_schedules_type_date ON practice_schedules(schedule_type, schedule_date);

-- updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_practice_schedules_updated_at 
    BEFORE UPDATE ON practice_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS(行レベルセキュリティ)有効化
ALTER TABLE practice_schedules ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみアクセス可能なポリシー
CREATE POLICY "practice_schedules_policy" ON practice_schedules
    USING (auth.role() = 'authenticated');

-- テーブルコメント
COMMENT ON TABLE practice_schedules IS '練習スケジュールマスター情報';
COMMENT ON COLUMN practice_schedules.id IS 'スケジュールID';
COMMENT ON COLUMN practice_schedules.venue_id IS '会場ID参照';
COMMENT ON COLUMN practice_schedules.schedule_date IS '練習日';
COMMENT ON COLUMN practice_schedules.start_time IS '開始時間';
COMMENT ON COLUMN practice_schedules.end_time IS '終了時間';
COMMENT ON COLUMN practice_schedules.title IS '練習タイトル';
COMMENT ON COLUMN practice_schedules.description IS '説明';
COMMENT ON COLUMN practice_schedules.schedule_type IS '練習種別(regular/special/extra/makeup)';
COMMENT ON COLUMN practice_schedules.status IS 'ステータス(draft/published/cancelled/completed)';
COMMENT ON COLUMN practice_schedules.metadata IS 'メタデータ(JSON)';
COMMENT ON COLUMN practice_schedules.created_by IS '作成者ID';