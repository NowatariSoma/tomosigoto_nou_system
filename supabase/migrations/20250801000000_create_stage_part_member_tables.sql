-- BACK-DB-001.2: 舞台・パート・メンバー所属管理システム
-- 舞台情報、パート情報、メンバー所属を管理する3テーブル構成

-- 1. stages テーブル（舞台情報管理）
CREATE TABLE stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    performance_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. parts テーブル（パート情報管理）
CREATE TABLE parts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. member_assignments テーブル（メンバー所属管理）
CREATE TABLE member_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    category VARCHAR(10) NOT NULL CHECK (category IN ('utai', 'mai')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 同一ユーザーが同一パートに重複して登録されることを防ぐ
    UNIQUE(user_id, part_id)
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_stages_performance_date ON stages(performance_date);
CREATE INDEX idx_parts_stage_id ON parts(stage_id);
CREATE INDEX idx_parts_status ON parts(status);
CREATE INDEX idx_member_assignments_user_id ON member_assignments(user_id);
CREATE INDEX idx_member_assignments_part_id ON member_assignments(part_id);
CREATE INDEX idx_member_assignments_category ON member_assignments(category);

-- stages テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_stages_updated_at
BEFORE UPDATE ON public.stages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- parts テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_parts_updated_at
BEFORE UPDATE ON public.parts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- member_assignments テーブルにupdated_atトリガーを設定
CREATE TRIGGER update_member_assignments_updated_at
BEFORE UPDATE ON public.member_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- コメント追加（テーブル説明）
COMMENT ON TABLE stages IS '舞台情報を管理するテーブル';
COMMENT ON TABLE parts IS '舞台に紐づくパート情報を管理するテーブル';
COMMENT ON TABLE member_assignments IS 'メンバーのパート所属（謡・舞区分）を管理するテーブル';

-- カラムコメントの追加（PostgreSQL用）
-- stages テーブル
COMMENT ON COLUMN stages.name IS '舞台名称';
COMMENT ON COLUMN stages.description IS '舞台説明';
COMMENT ON COLUMN stages.performance_date IS '公演予定日';
COMMENT ON COLUMN stages.status IS 'ステータス';

-- parts テーブル
COMMENT ON COLUMN parts.stage_id IS '舞台ID参照';
COMMENT ON COLUMN parts.name IS 'パート名';
COMMENT ON COLUMN parts.description IS 'パート説明';
COMMENT ON COLUMN parts.status IS 'パートステータス';

-- member_assignments テーブル
COMMENT ON COLUMN member_assignments.user_id IS 'ユーザーID参照';
COMMENT ON COLUMN member_assignments.part_id IS 'パートID参照';
COMMENT ON COLUMN member_assignments.category IS '謡舞区分';
COMMENT ON COLUMN member_assignments.display_order IS '表示順序';