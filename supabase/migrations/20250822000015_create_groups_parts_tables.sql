-- グループ・パート管理用テーブル作成
-- 練習表の凡例で使用するグループ（A, B, C等）とパート名を管理

-- 1. groups テーブル（グループA, B, C等の凡例用）
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 16進数カラーコード
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. practice_parts テーブル（パート名用、既存のpartsテーブルと区別）
CREATE TABLE practice_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_is_active ON groups(is_active);
CREATE INDEX idx_groups_sort_order ON groups(sort_order);

CREATE INDEX idx_practice_parts_name ON practice_parts(name);
CREATE INDEX idx_practice_parts_is_active ON practice_parts(is_active);
CREATE INDEX idx_practice_parts_sort_order ON practice_parts(sort_order);

-- トリガーの作成
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_parts_updated_at
    BEFORE UPDATE ON practice_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの挿入（グループ）
INSERT INTO groups (name, display_name, color, is_active, sort_order) VALUES
('A', 'グループA', '#3B82F6', true, 1),
('B', 'グループB', '#10B981', true, 2),
('C', 'グループC', '#F59E0B', true, 3),
('D', 'グループD', '#EF4444', true, 4),
('E', 'グループE', '#8B5CF6', true, 5);

-- サンプルデータの挿入（パート）
INSERT INTO practice_parts (name, display_name, description, is_active, sort_order) VALUES
('○○パート', '○○パート', 'メインのパート練習', true, 1),
('××パート', '××パート', 'サブのパート練習', true, 2),
('△△パート', '△△パート', '補助のパート練習', true, 3),
('集合', '集合・挨拶', '練習開始時の集合', true, 4),
('準備', '準備', '練習前の準備時間', true, 5),
('整上', '整上・挨拶', '練習終了時の整上', true, 6);

-- コメント追加
COMMENT ON TABLE groups IS '練習表の凡例で使用するグループ（A, B, C等）を管理するテーブル';
COMMENT ON TABLE practice_parts IS '練習表で使用するパート名を管理するテーブル';

-- カラムコメント
COMMENT ON COLUMN groups.name IS 'グループ名（A, B, C等）';
COMMENT ON COLUMN groups.display_name IS '表示用グループ名';
COMMENT ON COLUMN groups.color IS 'グループの色（16進数カラーコード）';
COMMENT ON COLUMN groups.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN groups.sort_order IS '表示順序';

COMMENT ON COLUMN practice_parts.name IS 'パート名';
COMMENT ON COLUMN practice_parts.display_name IS '表示用パート名';
COMMENT ON COLUMN practice_parts.description IS 'パートの説明';
COMMENT ON COLUMN practice_parts.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN practice_parts.sort_order IS '表示順序';
