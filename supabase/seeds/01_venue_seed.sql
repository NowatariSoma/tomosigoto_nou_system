-- Venue関連テーブルのシードデータ
-- 対応マイグレーション: 20250804145616_recreate_venue_tables.sql

-- venues テーブルのサンプルデータ
INSERT INTO venues (id, name, code, campus, address, latitude, longitude, can_mai, capacity, desk, chair, description, is_active) VALUES
(gen_random_uuid(), '今出川キャンパス 良心館', 'IM-RY', '今出川', '京都市上京区今出川通烏丸東入', 35.0312, 135.7681, true, 200, 100, 200, '同志社大学今出川キャンパスの中心的な講義棟', true),
(gen_random_uuid(), '今出川キャンパス 至誠館', 'IM-SS', '今出川', '京都市上京区今出川通烏丸東入', 35.0315, 135.7685, true, 150, 75, 150, '情報系の講義が行われる建物', true),
(gen_random_uuid(), '田辺キャンパス 知徳館', 'TB-CT', '田辺', '京田辺市多々羅都谷1-3', 34.8158, 135.7666, true, 300, 150, 300, '田辺キャンパスのメイン講義棟', true),
(gen_random_uuid(), '田辺キャンパス 恵道館', 'TB-KD', '田辺', '京田辺市多々羅都谷1-3', 34.8161, 135.7669, false, 100, 50, 100, '理工学部の実験・実習施設', true),
(gen_random_uuid(), 'オンライン会議室A', 'ONLINE-A', 'オンライン', 'オンライン', 0.0, 0.0, false, 50, 0, 0, 'Zoom会議室A', true);