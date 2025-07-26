-- 支援テーブル作成（会場・パート定義）

-- 会場マスターテーブル（基本構造のみ）
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- パート定義テーブル（基本構造のみ）
CREATE TABLE IF NOT EXISTS part_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES part_definitions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_venues_name ON venues(name);
CREATE INDEX idx_part_definitions_name ON part_definitions(name);
CREATE INDEX idx_part_definitions_parent ON part_definitions(parent_id);

-- updated_at自動更新のトリガー
CREATE TRIGGER update_venues_updated_at 
    BEFORE UPDATE ON venues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_part_definitions_updated_at 
    BEFORE UPDATE ON part_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS(行レベルセキュリティ)有効化
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_definitions ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみアクセス可能なポリシー
CREATE POLICY "venues_policy" ON venues
    USING (auth.role() = 'authenticated');

CREATE POLICY "part_definitions_policy" ON part_definitions
    USING (auth.role() = 'authenticated');

-- サンプルデータ挿入
INSERT INTO venues (name, capacity, address) VALUES 
    ('第一稽古場', 50, '東京都千代田区'),
    ('第二稽古場', 30, '東京都千代田区'),
    ('大ホール', 200, '東京都千代田区')
ON CONFLICT DO NOTHING;

INSERT INTO part_definitions (name, description) VALUES 
    ('謡', '謡のパート'),
    ('囃子', '囃子のパート'),
    ('小鼓', '小鼓担当'),
    ('大鼓', '大鼓担当'),
    ('太鼓', '太鼓担当'),
    ('笛', '笛担当'),
    ('舞', '舞のパート')
ON CONFLICT DO NOTHING;

-- テーブルコメント
COMMENT ON TABLE venues IS '会場マスター情報';
COMMENT ON TABLE part_definitions IS 'パート定義マスター';