-- スケジュール時間スロットのシードデータ
-- 対応マイグレーション: 20251027000003_create_schedule_time_slots.sql

-- schedule_time_slots テーブル
-- 各練習スケジュールに時間スロットを追加
-- 練習時間を30分間隔で分割して時間スロットを作成

-- 方法1: 既存のpractice_schedulesに対して30分間隔で時間スロットを生成
-- 注意: PostgreSQLのgenerate_seriesを使う場合は、LATERAL JOINを使用
INSERT INTO schedule_time_slots (schedule_id, slot_order, start_time, end_time)
SELECT 
    ps.id as schedule_id,
    slot_num as slot_order,
    (ps.start_time + (slot_num - 1) * interval '30 minutes')::time as start_time,
    LEAST(
        (ps.start_time + slot_num * interval '30 minutes')::time,
        ps.end_time
    ) as end_time
FROM practice_schedules ps
CROSS JOIN LATERAL generate_series(
    1, 
    GREATEST(1, EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))::int / 1800)
) as slot_num
WHERE ps.status = 'active'
  AND ps.end_time > ps.start_time
  AND EXTRACT(EPOCH FROM (ps.end_time - ps.start_time)) >= 1800; -- 最低30分以上のスケジュールのみ

-- より詳細な時間スロットの例（手動で追加する場合）
-- 例: 2025-02-15の練習スケジュールに6つの時間スロットを追加
-- INSERT INTO schedule_time_slots (schedule_id, slot_order, start_time, end_time)
-- SELECT 
--     ps.id as schedule_id,
--     1 as slot_order,
--     '09:00'::time as start_time,
--     '09:30'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date
-- UNION ALL
-- SELECT 
--     ps.id as schedule_id,
--     2 as slot_order,
--     '09:30'::time as start_time,
--     '10:00'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date
-- UNION ALL
-- SELECT 
--     ps.id as schedule_id,
--     3 as slot_order,
--     '10:00'::time as start_time,
--     '10:30'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date
-- UNION ALL
-- SELECT 
--     ps.id as schedule_id,
--     4 as slot_order,
--     '10:30'::time as start_time,
--     '11:00'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date
-- UNION ALL
-- SELECT 
--     ps.id as schedule_id,
--     5 as slot_order,
--     '11:00'::time as start_time,
--     '11:30'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date
-- UNION ALL
-- SELECT 
--     ps.id as schedule_id,
--     6 as slot_order,
--     '11:30'::time as start_time,
--     '12:00'::time as end_time
-- FROM practice_schedules ps
-- WHERE ps.schedule_date = '2025-02-15'::date;

