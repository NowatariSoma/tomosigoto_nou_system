-- Add late_time column to practice_user_attendance table
-- 遅刻時間を記録するためのカラムを追加

-- 1. late_timeカラムを追加
ALTER TABLE practice_user_attendance
ADD COLUMN late_time TIME;

-- 2. カラムコメント
COMMENT ON COLUMN practice_user_attendance.late_time IS '遅刻時間（status=lateの場合のみ使用）';

-- 3. ユーザー別の出欠履歴ビューを更新してlate_timeを含める
CREATE OR REPLACE VIEW practice_user_attendance_history AS
SELECT
    u.id as user_id,
    u.email,
    up.first_name_kanji,
    up.last_name_kanji,
    up.student_id,
    a.status as attendance_status,
    a.late_time,
    ps.schedule_date,
    ps.description,
    v.name as venue_name,
    a.notes
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN practice_user_attendance a ON u.id = a.user_id
LEFT JOIN public.practice_schedules ps ON a.practice_schedule_id = ps.id
LEFT JOIN public.schedule_available_venues sav ON ps.id = sav.schedule_id
LEFT JOIN public.venues v ON sav.venue_id = v.id
ORDER BY u.id, ps.schedule_date DESC;
