-- セッション詳細テーブル作成

-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL DEFAULT 'practice',
    priority INTEGER NOT NULL DEFAULT 1,
    resources JSONB DEFAULT '{}',
    location_in_venue VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_session_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_session_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT valid_session_type CHECK (session_type IN ('practice', 'rehearsal', 'performance', 'lesson', 'meeting')),
    CONSTRAINT valid_session_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- セッション担当者テーブル
CREATE TABLE IF NOT EXISTS session_instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'instructor',
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    notes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_instructor_role CHECK (role IN ('primary', 'assistant', 'observer', 'supervisor')),
    CONSTRAINT valid_instructor_status CHECK (status IN ('assigned', 'confirmed', 'declined', 'substituted')),
    CONSTRAINT unique_session_user_role UNIQUE (session_id, user_id, role)
);

-- パート別セッション割り当てテーブル
CREATE TABLE IF NOT EXISTS part_session_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    part_id UUID NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT false,
    special_requirements JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_assignment_priority CHECK (priority >= 1 AND priority <= 10),
    CONSTRAINT valid_assignment_status CHECK (status IN ('assigned', 'confirmed', 'optional', 'excluded')),
    CONSTRAINT unique_session_part UNIQUE (session_id, part_id)
);

-- インデックス作成
-- セッションテーブル
CREATE INDEX idx_sessions_schedule_id ON sessions(schedule_id);
CREATE INDEX idx_sessions_time_range ON sessions(start_time, end_time);
CREATE INDEX idx_sessions_type_priority ON sessions(session_type, priority);
CREATE INDEX idx_sessions_status ON sessions(status);

-- セッション担当者テーブル
CREATE INDEX idx_session_instructors_session_id ON session_instructors(session_id);
CREATE INDEX idx_session_instructors_user_id ON session_instructors(user_id);
CREATE INDEX idx_session_instructors_role ON session_instructors(role);

-- パート別セッション割り当てテーブル
CREATE INDEX idx_part_session_assignments_session_id ON part_session_assignments(session_id);
CREATE INDEX idx_part_session_assignments_part_id ON part_session_assignments(part_id);
CREATE INDEX idx_part_session_assignments_priority ON part_session_assignments(priority);

-- updated_at自動更新のトリガー
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_instructors_updated_at 
    BEFORE UPDATE ON session_instructors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_part_session_assignments_updated_at 
    BEFORE UPDATE ON part_session_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS(行レベルセキュリティ)有効化
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_session_assignments ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーのみアクセス可能なポリシー
CREATE POLICY "sessions_policy" ON sessions
    USING (auth.role() = 'authenticated');

CREATE POLICY "session_instructors_policy" ON session_instructors
    USING (auth.role() = 'authenticated');

CREATE POLICY "part_session_assignments_policy" ON part_session_assignments
    USING (auth.role() = 'authenticated');

-- テーブルコメント
COMMENT ON TABLE sessions IS 'セッション詳細情報';
COMMENT ON COLUMN sessions.id IS 'セッションID';
COMMENT ON COLUMN sessions.schedule_id IS 'スケジュールID参照';
COMMENT ON COLUMN sessions.start_time IS '開始時間';
COMMENT ON COLUMN sessions.end_time IS '終了時間';
COMMENT ON COLUMN sessions.title IS 'セッションタイトル';
COMMENT ON COLUMN sessions.description IS '説明';
COMMENT ON COLUMN sessions.session_type IS 'セッション種別';
COMMENT ON COLUMN sessions.priority IS '優先度(1-10)';
COMMENT ON COLUMN sessions.resources IS '必要リソース(JSON)';
COMMENT ON COLUMN sessions.location_in_venue IS '会場内位置';
COMMENT ON COLUMN sessions.status IS 'ステータス';

COMMENT ON TABLE session_instructors IS 'セッション担当者情報';
COMMENT ON COLUMN session_instructors.id IS '担当者ID';
COMMENT ON COLUMN session_instructors.session_id IS 'セッションID参照';
COMMENT ON COLUMN session_instructors.user_id IS 'ユーザーID参照';
COMMENT ON COLUMN session_instructors.role IS '役割';
COMMENT ON COLUMN session_instructors.status IS 'ステータス';
COMMENT ON COLUMN session_instructors.notes IS '備考(JSON)';

COMMENT ON TABLE part_session_assignments IS 'パート別セッション割り当て情報';
COMMENT ON COLUMN part_session_assignments.id IS '割り当てID';
COMMENT ON COLUMN part_session_assignments.session_id IS 'セッションID参照';
COMMENT ON COLUMN part_session_assignments.part_id IS 'パートID参照';
COMMENT ON COLUMN part_session_assignments.priority IS '優先度(1-10)';
COMMENT ON COLUMN part_session_assignments.is_required IS '必須参加フラグ';
COMMENT ON COLUMN part_session_assignments.special_requirements IS '特別要件(JSON)';
COMMENT ON COLUMN part_session_assignments.status IS 'ステータス';