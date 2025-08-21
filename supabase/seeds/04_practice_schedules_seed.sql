-- 練習スケジュール関連テーブルのシードデータ
-- 対応マイグレーション: 20250822000013_practice_schedule_table.sql

-- practice_schedules テーブル
INSERT INTO practice_schedules (
    selected_venue_id, 
    schedule_date, 
    start_time, 
    end_time, 
    description, 
    schedule_type, 
    status
) 
SELECT 
    v.id as selected_venue_id,
    schedule_data.schedule_date,
    schedule_data.start_time,
    schedule_data.end_time,
    schedule_data.description,
    schedule_data.schedule_type,
    'active' as status
FROM venues v
CROSS JOIN (
    VALUES 
    ('2025-02-15'::date, '09:00'::time, '12:00'::time, '定期公演「高砂」第1回練習', 'regular_practice'),
    ('2025-02-22'::date, '09:00'::time, '12:00'::time, '定期公演「高砂」第2回練習', 'regular_practice'),
    ('2025-03-01'::date, '09:00'::time, '15:00'::time, '定期公演「高砂」総練習', 'dress_rehearsal'),
    ('2025-03-08'::date, '13:00'::time, '17:00'::time, '定期公演「高砂」ゲネプロ', 'final_rehearsal'),
    ('2025-04-05'::date, '10:00'::time, '12:00'::time, '春季研究発表会「羽衣」第1回練習', 'regular_practice'),
    ('2025-04-12'::date, '10:00'::time, '12:00'::time, '春季研究発表会「羽衣」第2回練習', 'regular_practice'),
    ('2025-05-10'::date, '09:00'::time, '15:00'::time, '春季研究発表会「羽衣」総練習', 'dress_rehearsal')
) as schedule_data(schedule_date, start_time, end_time, description, schedule_type)
WHERE v.code = 'IM-RY';

-- schedule_available_venues テーブル
INSERT INTO schedule_available_venues (schedule_id, venue_id, is_preferred, priority, notes)
SELECT 
    ps.id as schedule_id,
    v.id as venue_id,
    CASE WHEN v.code = 'IM-RY' THEN true ELSE false END as is_preferred,
    CASE 
        WHEN v.code = 'IM-RY' THEN 1
        WHEN v.code = 'IM-SS' THEN 2
        WHEN v.code = 'TB-CT' THEN 3
        ELSE 4
    END as priority,
    CASE 
        WHEN v.code = 'IM-RY' THEN '主要練習会場'
        WHEN v.code = 'IM-SS' THEN '代替会場1'
        WHEN v.code = 'TB-CT' THEN '代替会場2'
        ELSE 'その他'
    END as notes
FROM practice_schedules ps
CROSS JOIN venues v
WHERE v.is_active = true AND v.can_mai = true;


-- セッション関連テーブルのシードデータ
-- 対応マイグレーション: 20250822000014_create_practice_schedule_tables.sql

-- sessions テーブル（練習セッション）
-- practice_schedules と parts の既存データに基づいてセッションを作成
INSERT INTO sessions (schedule_id, part_id, title, start_time, end_time, location_in_venue, priority)
SELECT 
    ps.id as schedule_id,
    p.id as part_id,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN p.name || '個人練習'
        WHEN p.name = '地謡' THEN '地謡合わせ'
        WHEN p.name = '囃子方' THEN '囃子練習'
        ELSE p.name || '練習'
    END as title,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN ps.start_time
        WHEN p.name = '地謡' THEN ps.start_time + interval '1 hour'
        WHEN p.name = '囃子方' THEN ps.start_time + interval '2 hours'
        ELSE ps.start_time + interval '30 minutes'
    END as start_time,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN ps.start_time + interval '1 hour'
        WHEN p.name = '地謡' THEN ps.start_time + interval '2 hours'
        WHEN p.name = '囃子方' THEN ps.end_time
        ELSE ps.start_time + interval '1 hour 30 minutes'
    END as end_time,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN '中央舞台'
        WHEN p.name = '地謡' THEN '上手側'
        WHEN p.name = '囃子方' THEN '下手側'
        ELSE '練習室'
    END as location_in_venue,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN 1
        WHEN p.name = '地謡' THEN 2
        WHEN p.name = '囃子方' THEN 3
        ELSE 4
    END as priority
FROM practice_schedules ps
JOIN parts p ON p.status = 'active'
WHERE ps.status = 'active'
LIMIT 50;

-- session_instructors テーブル（セッション担当者）
-- 指導者ユーザーをセッションに割り当て
INSERT INTO session_instructors (session_id, user_id)
SELECT 
    s.id as session_id,
    CASE 
        WHEN s.title LIKE '%地謡%' THEN '00000000-0000-0000-0000-000000000001'::uuid -- admin/instructor
        WHEN s.title LIKE '%囃子%' THEN '00000000-0000-0000-0000-000000000004'::uuid -- instructor
        WHEN s.title LIKE '%シテ%' THEN '00000000-0000-0000-0000-000000000013'::uuid -- instructor
        ELSE '00000000-0000-0000-0000-000000000014'::uuid -- instructor
    END as user_id
FROM sessions s
WHERE s.priority <= 3  -- 重要なセッションのみ指導者を配置
LIMIT 30;

-- session_attendances テーブル（セッション出欠管理）
-- member_assignments と sessions を結合して出欠データを生成
INSERT INTO session_attendances (session_id, member_assignment_id, attendance_status, check_in_time, check_out_time)
SELECT 
    s.id as session_id,
    ma.id as member_assignment_id,
    CASE 
        WHEN random() > 0.9 THEN 'absent'
        WHEN random() > 0.95 THEN 'late'
        WHEN random() > 0.98 THEN 'early_leave'
        ELSE 'present'
    END as attendance_status,
    CASE 
        WHEN random() > 0.9 THEN null  -- absent の場合はnull
        ELSE (CURRENT_DATE + s.start_time) + (random() * interval '10 minutes')
    END as check_in_time,
    CASE 
        WHEN random() > 0.9 THEN null  -- absent の場合はnull
        ELSE (CURRENT_DATE + s.end_time) - (random() * interval '5 minutes')
    END as check_out_time
FROM sessions s
JOIN parts p ON s.part_id = p.id
JOIN member_assignments ma ON p.id = ma.part_id
WHERE EXISTS (
    SELECT 1 FROM practice_schedules ps 
    WHERE ps.id = s.schedule_id 
    AND ps.schedule_date < CURRENT_DATE  -- 過去のセッションのみ出欠データを生成
)
LIMIT 200;