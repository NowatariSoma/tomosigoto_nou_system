-- 練習スケジュール関連テーブルのシードデータ
-- 対応マイグレーション: 20250822000013_practice_schedule_table.sql

-- practice_schedules テーブル
INSERT INTO practice_schedules (
    schedule_date, 
    start_time, 
    end_time, 
    title,
    description, 
    schedule_type, 
    status
) 
VALUES 
    ('2025-02-15'::date, '09:00'::time, '12:00'::time, '定期公演「高砂」第1回練習', '高砂の基本練習。謡い、舞い、囃子の基本を確認します。', 'regular_practice', 'active'),
    ('2025-02-22'::date, '09:00'::time, '12:00'::time, '定期公演「高砂」第2回練習', '高砂の通し練習。全体の流れを確認し、細かい演技を磨きます。', 'regular_practice', 'active'),
    ('2025-03-01'::date, '09:00'::time, '15:00'::time, '定期公演「高砂」総練習', '本番前の総練習。衣装を着けて通し練習を行います。', 'dress_rehearsal', 'active'),
    ('2025-03-08'::date, '13:00'::time, '17:00'::time, '定期公演「高砂」ゲネプロ', '本番直前の最終リハーサル。照明、音響など本番環境での練習。', 'final_rehearsal', 'active'),
    ('2025-04-05'::date, '10:00'::time, '12:00'::time, '春季研究発表会「羽衣」第1回練習', '羽衣の基本練習。新入部員も参加し、基本動作から練習します。', 'regular_practice', 'active'),
    ('2025-04-12'::date, '10:00'::time, '12:00'::time, '春季研究発表会「羽衣」第2回練習', '羽衣の応用練習。個々の演技を磨き、全体のバランスを整えます。', 'regular_practice', 'active'),
    ('2025-05-10'::date, '09:00'::time, '15:00'::time, '春季研究発表会「羽衣」総練習', '発表会前の総練習。衣装を着けて本番さながらの練習を行います。', 'dress_rehearsal', 'active');

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
INSERT INTO sessions (schedule_id, part_id, title, slot_order, priority)
SELECT 
    ps.id as schedule_id,
    p.id as part_id,
    CASE 
        WHEN p.name LIKE '%シテ%' THEN p.name || '個人練習'
        WHEN p.name = '地謡' THEN '地謡合わせ'
        WHEN p.name = '囃子方' THEN '囃子練習'
        ELSE p.name || '練習'
    END as title,
    ROW_NUMBER() OVER (PARTITION BY ps.id ORDER BY p.name) as slot_order,
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
-- 注意: session_instructorsテーブルの構造が変更されたため、一時的にコメントアウト
-- INSERT INTO session_instructors (session_id, attendance_id)
-- SELECT 
--     s.id as session_id,
--     -- attendance_idが必要だが、現在のテーブル構造では直接user_idを参照できない
--     -- 出席記録を先に作成してからこのデータを投入する必要がある
-- FROM sessions s
-- WHERE s.priority <= 3  -- 重要なセッションのみ指導者を配置
-- LIMIT 30;

-- session_attendances テーブル（セッション出欠管理）
-- member_assignments と sessions を結合して出欠データを生成
-- 注意: session_attendancesテーブルは現在未定義のため、一時的にコメントアウト
-- INSERT INTO session_attendances (session_id, member_assignment_id, attendance_status, check_in_time, check_out_time)
-- SELECT 
--     s.id as session_id,
--     ma.id as member_assignment_id,
--     CASE 
--         WHEN random() > 0.9 THEN 'absent'
--         WHEN random() > 0.95 THEN 'late'
--         WHEN random() > 0.98 THEN 'early_leave'
--         ELSE 'present'
--     END as attendance_status,
--     CASE 
--         WHEN random() > 0.9 THEN null  -- absent の場合はnull
--         ELSE (CURRENT_DATE + s.start_time) + (random() * interval '10 minutes')
--     END as check_in_time,
--     CASE 
--         WHEN random() > 0.9 THEN null  -- absent の場合はnull
--         ELSE (CURRENT_DATE + s.end_time) - (random() * interval '5 minutes')
--     END as check_out_time
-- FROM sessions s
-- JOIN parts p ON s.part_id = p.id
-- JOIN member_assignments ma ON p.id = ma.part_id
-- WHERE EXISTS (
--     SELECT 1 FROM practice_schedules ps 
--     WHERE ps.id = s.schedule_id 
--     AND ps.schedule_date < CURRENT_DATE  -- 過去のセッションのみ出欠データを生成
-- )
-- LIMIT 200;