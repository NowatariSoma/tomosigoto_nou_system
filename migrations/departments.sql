-- 学部マスターテーブル作成
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    campus VARCHAR(50) NOT NULL CHECK (campus IN ('今出川', '田辺')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_campus ON departments(campus);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- departments テーブルにトリガーを設定
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 学部マスターデータの初期投入
INSERT INTO departments (department_code, department_name, campus, is_active) VALUES
    ('LAW', '法学部', '今出川', true),
    ('ECO', '経済学部', '今出川', true),
    ('COM', '商学部', '今出川', true),
    ('LIT', '文学部', '今出川', true),
    ('THE', '神学部', '今出川', true),
    ('SOC', '社会学部', '今出川', true),
    ('POL', '政策学部', '今出川', true),
    ('GLO', 'グローバル・コミュニケーション学部', '今出川', true),
    ('GLS', 'グローバル地域文化学部', '今出川', true),
    ('CUL', '文化情報学部', '今出川', true),
    ('SCI', '理工学部', '田辺', true),
    ('LIF', '生命医科学部', '田辺', true),
    ('SPO', 'スポーツ健康科学部', '田辺', true),
    ('PSY', '心理学部', '今出川', true),
    ('HEA', '保健医療学部', '今出川', true)
ON CONFLICT (department_code) DO NOTHING;

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "departments_select_policy" ON departments
    FOR SELECT
    USING (true);

-- 管理者のみが更新可能（実際の権限管理は後で実装）
CREATE POLICY "departments_insert_policy" ON departments
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "departments_update_policy" ON departments
    FOR UPDATE
    USING (true);

-- テーブルコメント
COMMENT ON TABLE departments IS '学部マスターテーブル';
COMMENT ON COLUMN departments.id IS '学部ID';
COMMENT ON COLUMN departments.department_code IS '学部コード';
COMMENT ON COLUMN departments.department_name IS '学部名';
COMMENT ON COLUMN departments.campus IS 'キャンパス（今出川/田辺）';
COMMENT ON COLUMN departments.is_active IS '有効フラグ';
COMMENT ON COLUMN departments.created_at IS '作成日時';
COMMENT ON COLUMN departments.updated_at IS '更新日時';