-- 謡踊区分マスターテーブル作成
-- BACK-DB-001.2: パート区分・メンバー所属テーブル設計

-- パートカテゴリテーブル作成
CREATE TABLE IF NOT EXISTS part_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- テーブルコメント
COMMENT ON TABLE part_categories IS '謡と踊の基本区分を管理するマスターテーブル';
COMMENT ON COLUMN part_categories.id IS 'カテゴリID（主キー）';
COMMENT ON COLUMN part_categories.name IS 'カテゴリ名（謡/踊）';
COMMENT ON COLUMN part_categories.description IS 'カテゴリの説明';
COMMENT ON COLUMN part_categories.attributes IS 'カテゴリ属性情報（JSON形式）';
COMMENT ON COLUMN part_categories.created_at IS '作成日時';
COMMENT ON COLUMN part_categories.updated_at IS '更新日時';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_part_categories_name ON part_categories(name);

-- 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新日時自動更新トリガー
DROP TRIGGER IF EXISTS update_part_categories_updated_at ON part_categories;
CREATE TRIGGER update_part_categories_updated_at
    BEFORE UPDATE ON part_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 初期データ挿入
INSERT INTO part_categories (name, description, attributes) VALUES
    ('謡', '謡のパート区分', '{"type": "vocal", "traditional": true}'),
    ('踊', '踊のパート区分', '{"type": "dance", "traditional": true}')
ON CONFLICT (name) DO NOTHING;

-- RLS (Row Level Security) 設定
ALTER TABLE part_categories ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定（認証されたユーザーは全ての操作が可能）
CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users" ON part_categories
    FOR ALL USING (auth.role() = 'authenticated');