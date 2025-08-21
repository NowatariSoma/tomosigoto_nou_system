-- BACK-DB-001.3: 練習スケジュール・セッションテーブル設計
-- 練習表自動生成システムの中核となる練習スケジュールとセッション管理のデータベース構造

-- 1. practice_schedulesテーブル（練習スケジュールマスター）
CREATE TABLE practice_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    selected_venue_id uuid REFERENCES public.venues(id),
    schedule_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    description text,
    schedule_type varchar(20) NOT NULL,
    status varchar(20),
    created_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- 2. schedule_available_venuesテーブル（練習スケジュール利用可能会場）
CREATE TABLE schedule_available_venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
    venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    is_preferred boolean DEFAULT false,
    priority integer DEFAULT 0,
    notes text,
    created_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. sessionsテーブル（セッション詳細）
CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
    part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
    title varchar(30),
    start_time time NOT NULL,
    end_time time NOT NULL,
    location_in_venue varchar(255),
    priority integer DEFAULT 0,
    created_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. session_instructorsテーブル（セッション担当者）
CREATE TABLE session_instructors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. session_attendancesテーブル（セッション出欠管理）
CREATE TABLE session_attendances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    member_assignment_id uuid NOT NULL REFERENCES public.member_assignments(id) ON DELETE CASCADE,
    attendance_status varchar(30),
    check_in_time timestamp WITH TIME ZONE,
    check_out_time timestamp WITH TIME ZONE,
    created_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. セッション出欠状況サマリービュー
CREATE VIEW session_attendance_summary AS
SELECT 
    s.id as session_id,
    s.part_id,
    p.name as part_name,
    COUNT(ma.id) as total_members,
    COUNT(sa.id) as recorded_attendances,
    COUNT(CASE WHEN sa.attendance_status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN sa.attendance_status = 'absent' THEN 1 END) as absent_count
FROM public.sessions s
JOIN public.parts p ON s.part_id = p.id
LEFT JOIN public.member_assignments ma ON p.id = ma.part_id
LEFT JOIN public.session_attendances sa ON s.id = sa.session_id AND ma.id = sa.member_assignment_id
GROUP BY s.id, s.part_id, p.name;

-- インデックス作成（パフォーマンス向上のため）
CREATE INDEX idx_practice_schedules_date ON practice_schedules(schedule_date);
CREATE INDEX idx_practice_schedules_venue ON practice_schedules(selected_venue_id);
CREATE INDEX idx_practice_schedules_status ON practice_schedules(status);
CREATE INDEX idx_schedule_available_venues_schedule_id ON schedule_available_venues(schedule_id);
CREATE INDEX idx_schedule_available_venues_venue_id ON schedule_available_venues(venue_id);
CREATE INDEX idx_sessions_schedule_id ON sessions(schedule_id);
CREATE INDEX idx_sessions_part_id ON sessions(part_id);
CREATE INDEX idx_sessions_time ON sessions(start_time, end_time);
CREATE INDEX idx_session_instructors_session_id ON session_instructors(session_id);
CREATE INDEX idx_session_instructors_user_id ON session_instructors(user_id);
CREATE INDEX idx_session_attendances_session_id ON session_attendances(session_id);
CREATE INDEX idx_session_attendances_member_assignment_id ON session_attendances(member_assignment_id);
CREATE INDEX idx_session_attendances_status ON session_attendances(attendance_status);

-- updated_at自動更新トリガーの設定
CREATE TRIGGER update_practice_schedules_updated_at
BEFORE UPDATE ON public.practice_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_available_venues_updated_at
BEFORE UPDATE ON public.schedule_available_venues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_instructors_updated_at
BEFORE UPDATE ON public.session_instructors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_attendances_updated_at
BEFORE UPDATE ON public.session_attendances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- テーブルコメント
COMMENT ON TABLE practice_schedules IS '練習スケジュールマスター情報を管理するテーブル';
COMMENT ON TABLE schedule_available_venues IS '練習スケジュールで利用可能な会場を管理するテーブル';
COMMENT ON TABLE sessions IS '練習セッションの詳細情報を管理するテーブル';
COMMENT ON TABLE session_instructors IS 'セッションの担当者情報を管理するテーブル';
COMMENT ON TABLE session_attendances IS 'セッションの出欠管理を行うテーブル';
COMMENT ON VIEW session_attendance_summary IS 'セッション別の出欠状況サマリービュー';

-- practice_schedulesテーブルのカラムコメント
COMMENT ON COLUMN practice_schedules.id IS '練習スケジュールID（主キー）';
COMMENT ON COLUMN practice_schedules.selected_venue_id IS '選択された会場ID';
COMMENT ON COLUMN practice_schedules.schedule_date IS '練習日';
COMMENT ON COLUMN practice_schedules.start_time IS '練習開始時間';
COMMENT ON COLUMN practice_schedules.end_time IS '練習終了時間';
COMMENT ON COLUMN practice_schedules.description IS '練習の説明・備考';
COMMENT ON COLUMN practice_schedules.schedule_type IS '練習タイプ（通常練習、リハーサル等）';
COMMENT ON COLUMN practice_schedules.status IS 'スケジュールステータス';
COMMENT ON COLUMN practice_schedules.created_by IS '作成者ユーザーID';
COMMENT ON COLUMN practice_schedules.updated_by IS '最終更新者ユーザーID';

-- schedule_available_venuesテーブルのカラムコメント
COMMENT ON COLUMN schedule_available_venues.id IS '利用可能会場ID（主キー）';
COMMENT ON COLUMN schedule_available_venues.schedule_id IS '練習スケジュールID参照';
COMMENT ON COLUMN schedule_available_venues.venue_id IS '会場ID参照';
COMMENT ON COLUMN schedule_available_venues.is_preferred IS '優先会場フラグ';
COMMENT ON COLUMN schedule_available_venues.priority IS '優先順位';
COMMENT ON COLUMN schedule_available_venues.notes IS '備考';

-- sessionsテーブルのカラムコメント
COMMENT ON COLUMN sessions.id IS 'セッションID（主キー）';
COMMENT ON COLUMN sessions.schedule_id IS '練習スケジュールID参照';
COMMENT ON COLUMN sessions.part_id IS 'パートID参照';
COMMENT ON COLUMN sessions.title IS 'セッション名';
COMMENT ON COLUMN sessions.start_time IS 'セッション開始時間';
COMMENT ON COLUMN sessions.end_time IS 'セッション終了時間';
COMMENT ON COLUMN sessions.location_in_venue IS '会場内の場所';
COMMENT ON COLUMN sessions.priority IS 'セッション優先度';

-- session_instructorsテーブルのカラムコメント
COMMENT ON COLUMN session_instructors.id IS 'セッション担当者ID（主キー）';
COMMENT ON COLUMN session_instructors.session_id IS 'セッションID参照';
COMMENT ON COLUMN session_instructors.user_id IS '担当者ユーザーID参照';

-- session_attendancesテーブルのカラムコメント
COMMENT ON COLUMN session_attendances.id IS 'セッション出欠ID（主キー）';
COMMENT ON COLUMN session_attendances.session_id IS 'セッションID参照';
COMMENT ON COLUMN session_attendances.member_assignment_id IS 'メンバー所属ID参照';
COMMENT ON COLUMN session_attendances.attendance_status IS '出欠状況（present, absent, late, early_leave等）';
COMMENT ON COLUMN session_attendances.check_in_time IS 'チェックイン時刻';
COMMENT ON COLUMN session_attendances.check_out_time IS 'チェックアウト時刻';