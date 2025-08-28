-- BACK-DB-001.5: シンプルな出欠管理テーブル設計
-- 1回の練習の出欠（出席、欠席、遅刻、無断欠席）を管理するためのデータベース構造

-- 1. practice_user_attendanceテーブル（出欠記録）
CREATE TABLE practice_user_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_schedule_id UUID NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. インデックス作成（パフォーマンス向上のため）
CREATE INDEX idx_practice_user_attendance_practice_schedule_id ON practice_user_attendance(practice_schedule_id);
CREATE INDEX idx_practice_user_attendance_user_id ON practice_user_attendance(user_id);
CREATE INDEX idx_practice_user_attendance_status ON practice_user_attendance(status);
CREATE INDEX idx_practice_user_attendance_created_at ON practice_user_attendance(created_at);

-- 3. updated_at自動更新トリガー
CREATE TRIGGER update_practice_user_attendance_updated_at
BEFORE UPDATE ON public.practice_user_attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. テーブルコメント
COMMENT ON TABLE practice_user_attendance IS '練習ごとの出席を管理するテーブル';

-- 5. カラムコメント
COMMENT ON COLUMN practice_user_attendance.id IS '出欠記録ID（主キー）';
COMMENT ON COLUMN practice_user_attendance.practice_schedule_id IS '練習スケジュールID（practice_schedules参照）';
COMMENT ON COLUMN practice_user_attendance.user_id IS 'ユーザーID（auth.users参照）';
COMMENT ON COLUMN practice_user_attendance.status IS '出席状況（present: 出席, absent: 欠席, late: 遅刻, no_show: 無断欠席）';
COMMENT ON COLUMN practice_user_attendance.notes IS '備考';
COMMENT ON COLUMN practice_user_attendance.created_at IS '作成日時';
COMMENT ON COLUMN practice_user_attendance.updated_at IS '更新日時';
COMMENT ON COLUMN practice_user_attendance.created_by IS '作成者ユーザーID';
COMMENT ON COLUMN practice_user_attendance.updated_by IS '最終更新者ユーザーID';

-- 6. 練習別の出欠状況サマリービュー
CREATE VIEW practice_user_attendance_summary AS
SELECT 
    ps.id as practice_schedule_id,
    ps.schedule_date,
    ps.description,
    v.name as venue_name,
    COUNT(a.id) as total_people,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / 
         NULLIF(COUNT(a.id), 0) * 100), 2
    ) as attendance_rate
FROM public.practice_schedules ps
LEFT JOIN public.venues v ON ps.selected_venue_id = v.id
LEFT JOIN practice_user_attendance a ON ps.id = a.practice_schedule_id
GROUP BY ps.id, ps.schedule_date, ps.description, v.name;

-- 7. ユーザー別の出欠履歴ビュー（時間情報を削除）
CREATE VIEW practice_user_attendance_history AS
SELECT 
    u.id as user_id,
    u.email,
    up.first_name_kanji,
    up.last_name_kanji,
    up.student_id,
    a.status as attendance_status,
    ps.schedule_date,
    ps.description,
    v.name as venue_name,
    a.notes
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN practice_user_attendance a ON u.id = a.user_id
LEFT JOIN public.practice_schedules ps ON a.practice_schedule_id = ps.id
LEFT JOIN public.venues v ON ps.selected_venue_id = v.id
ORDER BY u.id, ps.schedule_date DESC;

-- 8. ビューのコメント
COMMENT ON VIEW practice_user_attendance_summary IS '練習別の出欠状況サマリービュー';
COMMENT ON VIEW practice_user_attendance_history IS 'ユーザー別の出欠履歴ビュー';