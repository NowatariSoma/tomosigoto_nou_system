-- Venue関連テーブルのシードデータ
-- 対応マイグレーション: 20250706043141_create_venue_tables.sql

-- venues テーブルのサンプルデータ
INSERT INTO venues (id, name, code, campus, address, latitude, longitude, can_mai, capacity, description, is_active) VALUES
(gen_random_uuid(), '今出川キャンパス 良心館', 'IM-RY', '今出川', '京都市上京区今出川通烏丸東入', 35.0312, 135.7681, true, 200, '同志社大学今出川キャンパスの中心的な講義棟', true),
(gen_random_uuid(), '今出川キャンパス 至誠館', 'IM-SS', '今出川', '京都市上京区今出川通烏丸東入', 35.0315, 135.7685, true, 150, '情報系の講義が行われる建物', true),
(gen_random_uuid(), '田辺キャンパス 知徳館', 'TB-CT', '田辺', '京田辺市多々羅都谷1-3', 34.8158, 135.7666, true, 300, '田辺キャンパスのメイン講義棟', true),
(gen_random_uuid(), '田辺キャンパス 恵道館', 'TB-KD', '田辺', '京田辺市多々羅都谷1-3', 34.8161, 135.7669, false, 100, '理工学部の実験・実習施設', true),
(gen_random_uuid(), 'オンライン会議室A', 'ONLINE-A', 'オンライン', 'オンライン', 0, 0, true, 50, 'Zoom会議室A', true);

-- venue_attributes テーブルのサンプルデータ（テーブル未作成のためコメントアウト）
-- INSERT INTO venue_attributes (venue_id, attribute_key, attribute_value, attribute_type) 
-- SELECT 
--     v.id as venue_id,
--     attr.attribute_key,
--     attr.attribute_value,
--     '設備' as attribute_type
-- FROM venues v
-- CROSS JOIN (
--     SELECT 'プロジェクター' as attribute_key, 'EPSON EB-2250U' as attribute_value UNION ALL
--     SELECT 'Wi-Fi' as attribute_key, '802.11ac対応' as attribute_value UNION ALL
--     SELECT 'マイク' as attribute_key, 'ワイヤレスマイク2本' as attribute_value UNION ALL
--     SELECT 'ホワイトボード' as attribute_key, '電子ホワイトボード' as attribute_value
-- ) attr
-- WHERE v.code IN ('IM-RY', 'IM-SS', 'TB-CT', 'TB-KD');

-- オンライン会議室の属性（テーブル未作成のためコメントアウト）
-- INSERT INTO venue_attributes (venue_id, attribute_key, attribute_value, attribute_type)
-- SELECT 
--     v.id as venue_id,
--     attr.attribute_key,
--     attr.attribute_value,
--     'オンライン機能' as attribute_type
-- FROM venues v
-- CROSS JOIN (
--     SELECT '画面共有' as attribute_key, 'フルHD対応' as attribute_value UNION ALL
--     SELECT 'チャット機能' as attribute_key, 'リアルタイムチャット' as attribute_value UNION ALL
--     SELECT '録画機能' as attribute_key, 'クラウド録画' as attribute_value UNION ALL
--     SELECT 'ブレイクアウトルーム' as attribute_key, '最大50部屋' as attribute_value
-- ) attr
-- WHERE v.code = 'ONLINE-A';

-- availability_slots テーブルのサンプルデータ（テーブル未作成のためコメントアウト）
-- INSERT INTO availability_slots (venue_id, date, start_time, end_time, status, cost)
-- SELECT 
--     v.id as venue_id,
--     (CURRENT_DATE + interval '1 day' * generate_series(0, 6)) as date,
--     time_slot.start_time,
--     time_slot.end_time,
--     'available' as status,
--     CASE 
--         WHEN v.venue_type = 'オンライン' THEN 0
--         ELSE 1000 + (v.capacity * 5)
--     END as cost
-- FROM venues v
-- CROSS JOIN (
--     SELECT '09:00'::time as start_time, '10:30'::time as end_time UNION ALL
--     SELECT '10:45'::time, '12:15'::time UNION ALL
--     SELECT '13:15'::time, '14:45'::time UNION ALL
--     SELECT '15:00'::time, '16:30'::time UNION ALL
--     SELECT '16:45'::time, '18:15'::time
-- ) time_slot
-- WHERE v.is_active = true;

-- recurring_units テーブルのサンプルデータ（テーブル未作成のためコメントアウト）
-- INSERT INTO recurring_units (venue_id, day_of_week, start_time, end_time, valid_from, valid_until, recurrence_rule, is_active)
-- SELECT 
--     v.id as venue_id,
--     dow.day_of_week,
--     '09:00'::time as start_time,
--     '10:30'::time as end_time,
--     CURRENT_DATE as valid_from,
--     CURRENT_DATE + interval '6 months' as valid_until,
--     'RRULE:FREQ=WEEKLY;INTERVAL=1' as recurrence_rule,
--     true as is_active
-- FROM venues v
-- CROSS JOIN (
--     SELECT 1 as day_of_week UNION ALL  -- 月曜日
--     SELECT 3 UNION ALL                 -- 水曜日
--     SELECT 5                           -- 金曜日
-- ) dow
-- WHERE v.code IN ('IM-RY', 'TB-CT');