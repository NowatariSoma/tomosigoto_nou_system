-- 既存のテーブルを削除して新しく作成するSQLスクリプト
-- SupabaseのダッシュボードのSQLエディタで実行してください

-- 1. 既存のテーブルとトリガーを削除
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS parts CASCADE;

-- 2. 更新日時自動更新関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. groups テーブルを作成
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. parts テーブルを作成
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. インデックスの作成
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_groups_is_active ON groups(is_active);
CREATE INDEX idx_groups_sort_order ON groups(sort_order);

CREATE INDEX idx_parts_name ON parts(name);
CREATE INDEX idx_parts_is_active ON parts(is_active);
CREATE INDEX idx_parts_sort_order ON parts(sort_order);

-- 6. トリガーの作成
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. サンプルデータの挿入（グループ）
INSERT INTO groups (name, display_name, color, is_active, sort_order) VALUES
('A', 'グループA', '#3B82F6', true, 1),
('B', 'グループB', '#10B981', true, 2),
('C', 'グループC', '#F59E0B', true, 3),
('D', 'グループD', '#EF4444', true, 4),
('E', 'グループE', '#8B5CF6', true, 5);

-- 8. サンプルデータの挿入（パート）
INSERT INTO parts (name, display_name, description, is_active, sort_order) VALUES
('○○パート', '○○パート', 'メインのパート練習', true, 1),
('××パート', '××パート', 'サブのパート練習', true, 2),
('△△パート', '△△パート', '補助のパート練習', true, 3),
('集合', '集合・挨拶', '練習開始時の集合', true, 4),
('準備', '準備', '練習前の準備時間', true, 5),
('整上', '整上・挨拶', '練習終了時の整上', true, 6);




