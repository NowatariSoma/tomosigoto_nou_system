-- Add available_from and available_to columns to practice_user_attendance table
-- 参加可能時間範囲を記録するためのカラムを追加

-- 1. available_fromカラムを追加（参加開始時刻）
ALTER TABLE practice_user_attendance
ADD COLUMN available_from TIME;

-- 2. available_toカラムを追加（参加終了時刻）
ALTER TABLE practice_user_attendance
ADD COLUMN available_to TIME;

-- 3. カラムコメント
COMMENT ON COLUMN practice_user_attendance.available_from IS '参加開始時刻（部分参加の場合のみ使用）';
COMMENT ON COLUMN practice_user_attendance.available_to IS '参加終了時刻（部分参加の場合のみ使用）';

-- 4. ユーザー別の出欠履歴ビューを更新してavailable_from, available_toを含める
CREATE OR REPLACE VIEW practice_user_attendance_history AS
SELECT
    u.id as user_id,
    u.email,
    up.first_name_kanji,
    up.last_name_kanji,
    up.student_id,
    a.status as attendance_status,
    a.available_from,
    a.available_to,
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
