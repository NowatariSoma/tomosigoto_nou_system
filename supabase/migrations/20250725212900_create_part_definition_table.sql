-- パート区分テーブル作成（階層構造対応）
-- BACK-DB-001.2: パート区分・メンバー所属テーブル設計

-- パート定義テーブル作成
CREATE TABLE IF NOT EXISTS part_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER NOT NULL REFERENCES part_categories(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES part_definitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    requirements JSONB DEFAULT '{}',
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT check_level_positive CHECK (level > 0),
    CONSTRAINT check_level_max CHECK (level <= 10),
    CONSTRAINT check_no_self_reference CHECK (id != parent_id)
);

-- テーブルコメント
COMMENT ON TABLE part_definitions IS 'パート区分の詳細と階層構造を管理するテーブル';
COMMENT ON COLUMN part_definitions.id IS 'パートID（主キー、UUID）';
COMMENT ON COLUMN part_definitions.category_id IS 'カテゴリID（part_categoriesテーブル参照）';
COMMENT ON COLUMN part_definitions.parent_id IS '親パートID（階層構造用）';
COMMENT ON COLUMN part_definitions.name IS 'パート名';
COMMENT ON COLUMN part_definitions.code IS 'パートコード（一意）';
COMMENT ON COLUMN part_definitions.level IS '階層レベル（1が最上位）';
COMMENT ON COLUMN part_definitions.description IS 'パートの説明';
COMMENT ON COLUMN part_definitions.requirements IS '必要条件（JSON形式）';
COMMENT ON COLUMN part_definitions.attributes IS 'パート属性情報（JSON形式）';
COMMENT ON COLUMN part_definitions.is_active IS '有効フラグ';
COMMENT ON COLUMN part_definitions.created_at IS '作成日時';
COMMENT ON COLUMN part_definitions.updated_at IS '更新日時';

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_part_definitions_category_id ON part_definitions(category_id);
CREATE INDEX IF NOT EXISTS idx_part_definitions_parent_id ON part_definitions(parent_id);
CREATE INDEX IF NOT EXISTS idx_part_definitions_code ON part_definitions(code);
CREATE INDEX IF NOT EXISTS idx_part_definitions_level ON part_definitions(level);
CREATE INDEX IF NOT EXISTS idx_part_definitions_is_active ON part_definitions(is_active);

-- 階層検索用の複合インデックス
CREATE INDEX IF NOT EXISTS idx_part_definitions_hierarchy ON part_definitions(category_id, level, parent_id);

-- 更新日時自動更新トリガー
DROP TRIGGER IF EXISTS update_part_definitions_updated_at ON part_definitions;
CREATE TRIGGER update_part_definitions_updated_at
    BEFORE UPDATE ON part_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 階層レベル整合性チェック関数
CREATE OR REPLACE FUNCTION check_part_hierarchy_level()
RETURNS TRIGGER AS $$
BEGIN
    -- 親パートが存在する場合、レベルが親より大きいことを確認
    IF NEW.parent_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM part_definitions 
            WHERE id = NEW.parent_id AND level >= NEW.level
        ) THEN
            RAISE EXCEPTION 'Child part level must be greater than parent level';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 階層レベルチェックトリガー
DROP TRIGGER IF EXISTS check_part_hierarchy_level_trigger ON part_definitions;
CREATE TRIGGER check_part_hierarchy_level_trigger
    BEFORE INSERT OR UPDATE ON part_definitions
    FOR EACH ROW
    EXECUTE FUNCTION check_part_hierarchy_level();

-- 初期データ挿入（謡のパート）
WITH utai_category AS (SELECT id FROM part_categories WHERE name = '謡')
INSERT INTO part_definitions (category_id, name, code, level, description, requirements, attributes) 
SELECT 
    utai_category.id,
    'シテ',
    'SHITE',
    1,
    '主役を演じるパート',
    '{"experience_years": 5, "skill_level": "advanced"}',
    '{"stage_position": "center", "costume": "special", "mask_required": true}'
FROM utai_category
ON CONFLICT (code) DO NOTHING;

WITH utai_category AS (SELECT id FROM part_categories WHERE name = '謡')
INSERT INTO part_definitions (category_id, name, code, level, description, requirements, attributes)
SELECT 
    utai_category.id,
    'ワキ',
    'WAKI',
    1,
    '脇役を演じるパート',
    '{"experience_years": 3, "skill_level": "intermediate"}',
    '{"stage_position": "side", "costume": "standard"}'
FROM utai_category
ON CONFLICT (code) DO NOTHING;

-- 初期データ挿入（踊のパート）
WITH odori_category AS (SELECT id FROM part_categories WHERE name = '踊')
INSERT INTO part_definitions (category_id, name, code, level, description, requirements, attributes)
SELECT 
    odori_category.id,
    '地謡',
    'JIUTAI',
    1,
    '地謡を担当するパート',
    '{"experience_years": 2, "skill_level": "beginner"}',
    '{"stage_position": "background", "instrument": "voice"}'
FROM odori_category
ON CONFLICT (code) DO NOTHING;

-- RLS設定
ALTER TABLE part_definitions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定
CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users" ON part_definitions
    FOR ALL USING (auth.role() = 'authenticated');