-- venues テーブル
INSERT INTO venues (name, code, campus, address, latitude, longitude, can_mai, capacity, desk, chair, description, is_active) VALUES
('今出川キャンパス 良心館', 'IM-RY', '今出川', '京都市上京区今出川通烏丸東入', 35.0312, 135.7681, true, 200, 50, 200, '同志社大学今出川キャンパスの中心的な講義棟', true),
('今出川キャンパス 至誠館', 'IM-SS', '今出川', '京都市上京区今出川通烏丸東入', 35.0315, 135.7685, true, 150, 30, 150, '情報系の講義が行われる建物', true),
('田辺キャンパス 知徳館', 'TB-CT', '田辺', '京田辺市多々羅都谷1-3', 34.8158, 135.7666, true, 300, 80, 300, '田辺キャンパスのメイン講義棟', true),
('田辺キャンパス 恵道館', 'TB-KD', '田辺', '京田辺市多々羅都谷1-3', 34.8161, 135.7669, false, 100, 20, 100, '理工学部の実験・実習施設', true),
('オンライン会議室A', 'ONLINE-A', 'オンライン', 'オンライン', 0, 0, true, 50, 0, 0, 'Zoom会議室A', true);

-- departments テーブル
INSERT INTO departments (department_code, department_name, campus, is_active, created_at, updated_at) VALUES
-- 今出川キャンパス
('LAW', '法学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ECO', '経済学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('COM', '商学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('LIT', '文学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SPS', '社会学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('POL', '政策学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('CUL', '文化情報学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('PSY', '心理学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GCS', 'グローバル・コミュニケーション学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GRM', 'グローバル地域文化学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 田辺キャンパス
('ENG', '理工学部', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('LHS', '生命医科学部', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('SHS', 'スポーツ健康科学部', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- 大学院
('GS-LAW', '法学研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-ECO', '経済学研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-COM', '商学研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-LIT', '文学研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-SPS', '社会学研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-ENG', '理工学研究科', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-LHS', '生命医科学研究科', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('GS-BUS', 'ビジネス研究科', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);