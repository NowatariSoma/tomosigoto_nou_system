-- User関連テーブルのシードデータ
-- 対応マイグレーション: 20250731064119_create_tables_from_user_dir.sql

-- departments テーブルのサンプルデータ
INSERT INTO departments (id, department_code, department_name, campus, is_active) VALUES
(gen_random_uuid(), 'LAW', '法学部', '今出川', true),
(gen_random_uuid(), 'ECO', '経済学部', '今出川', true),
(gen_random_uuid(), 'COM', '商学部', '今出川', true),
(gen_random_uuid(), 'LIT', '文学部', '今出川', true),
(gen_random_uuid(), 'SPS', '社会学部', '今出川', true),
(gen_random_uuid(), 'POL', '政策学部', '今出川', true),
(gen_random_uuid(), 'CUL', '文化情報学部', '今出川', true),
(gen_random_uuid(), 'ENG', '理工学部', '田辺', true),
(gen_random_uuid(), 'LHS', '生命医科学部', '田辺', true),
(gen_random_uuid(), 'SPS-T', 'スポーツ健康科学部', '田辺', true),
(gen_random_uuid(), 'PSY', '心理学部', '今出川', true),
(gen_random_uuid(), 'GCS', 'グローバル・コミュニケーション学部', '今出川', true),
(gen_random_uuid(), 'GRM', 'グローバル地域文化学部', '今出川', true);