-- ====================================================================
-- 練習ユーザー出欠シードデータ
-- ====================================================================
-- 対応マイグレーション: 20250828103958_create_attendance_tables.sql
-- 注意: このファイルは他のseedファイルの実行後に実行してください

-- 練習スケジュールIDを取得
DO $$
DECLARE
    schedule_id_1 UUID;
    schedule_id_2 UUID;
    schedule_id_3 UUID;
    user_id_1 UUID;
    user_id_2 UUID;
    user_id_3 UUID;
    user_id_4 UUID;
    user_id_5 UUID;
BEGIN
    -- 練習スケジュールIDを取得
    SELECT id INTO schedule_id_1 FROM practice_schedules LIMIT 1;
    SELECT id INTO schedule_id_2 FROM practice_schedules LIMIT 1 OFFSET 1;
    SELECT id INTO schedule_id_3 FROM practice_schedules LIMIT 1 OFFSET 2;
    
    -- ユーザーIDを取得
    SELECT id INTO user_id_1 FROM auth.users LIMIT 1;
    SELECT id INTO user_id_2 FROM auth.users LIMIT 1 OFFSET 1;
    SELECT id INTO user_id_3 FROM auth.users LIMIT 1 OFFSET 2;
    SELECT id INTO user_id_4 FROM auth.users LIMIT 1 OFFSET 3;
    SELECT id INTO user_id_5 FROM auth.users LIMIT 1 OFFSET 4;

    -- 練習1: 全員出席
    INSERT INTO practice_user_attendance (
        practice_schedule_id, user_id, status, notes, created_by, updated_by
    ) VALUES 
        (schedule_id_1, user_id_1, 'present', '体調良好', user_id_1, user_id_1),
        (schedule_id_1, user_id_2, 'present', '体調良好', user_id_2, user_id_2),
        (schedule_id_1, user_id_3, 'present', '体調良好', user_id_3, user_id_3),
        (schedule_id_1, user_id_4, 'present', '体調良好', user_id_4, user_id_4),
        (schedule_id_1, user_id_5, 'present', '体調良好', user_id_5, user_id_5);

    -- 練習2: 様々な出席状況
    INSERT INTO practice_user_attendance (
        practice_schedule_id, user_id, status, notes, created_by, updated_by
    ) VALUES 
        (schedule_id_2, user_id_1, 'present', '体調良好', user_id_1, user_id_1),
        (schedule_id_2, user_id_2, 'absent', '体調不良のため欠席', user_id_2, user_id_2),
        (schedule_id_2, user_id_3, 'late', '電車遅延のため遅刻', user_id_3, user_id_3),
        (schedule_id_2, user_id_4, 'no_show', '連絡なし', user_id_4, user_id_4);

    -- 練習3: 出席率の異なるパターン
    INSERT INTO practice_user_attendance (
        practice_schedule_id, user_id, status, notes, created_by, updated_by
    ) VALUES 
        (schedule_id_3, user_id_1, 'present', '出席', user_id_1, user_id_1),
        (schedule_id_3, user_id_2, 'present', '出席', user_id_2, user_id_2),
        (schedule_id_3, user_id_3, 'present', '出席', user_id_3, user_id_3),
        (schedule_id_3, user_id_4, 'absent', '体調不良のため欠席', user_id_4, user_id_4),
        (schedule_id_3, user_id_5, 'absent', '体調不良のため欠席', user_id_5, user_id_5);

END $$;

-- データ挿入後の確認用クエリ
-- 練習別の出欠状況サマリー
SELECT 
    '練習別出欠サマリー' as info,
    COUNT(*) as total_records
FROM practice_user_attendance;

-- 出席状況別の集計
SELECT 
    '出席状況別集計' as info,
    status,
    COUNT(*) as count
FROM practice_user_attendance
GROUP BY status
ORDER BY count DESC;

-- 練習スケジュール別の出席率
SELECT 
    '練習別出席率' as info,
    ps.schedule_date,
    COUNT(a.id) as total_people,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::decimal / 
         NULLIF(COUNT(a.id), 0) * 100), 2
    ) as attendance_rate
FROM practice_schedules ps
LEFT JOIN practice_user_attendance a ON ps.id = a.practice_schedule_id
GROUP BY ps.id, ps.schedule_date
ORDER BY ps.schedule_date;