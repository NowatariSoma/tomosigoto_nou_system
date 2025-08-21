-- Department and User Profiles関連テーブルのシードデータ
-- 対応マイグレーション: 20250731064119_create_tables_from_user_dir.sql

-- -- departments テーブルのサンプルデータ（02_user_seed.sqlで既に挿入済みの場合は重複を避ける）
-- INSERT INTO departments (id, department_code, department_name, campus, is_active, created_at, updated_at) 
-- VALUES
-- ('a1111111-1111-1111-1111-111111111111', 'LIT', '文学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a2222222-2222-2222-2222-222222222222', 'ECO', '経済学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a3333333-3333-3333-3333-333333333333', 'LAW', '法学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a4444444-4444-4444-4444-444444444444', 'COM', '商学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a5555555-5555-5555-5555-555555555555', 'ENG', '工学部', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a6666666-6666-6666-6666-666666666666', 'SCI', '理学部', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a7777777-7777-7777-7777-777777777777', 'MED', '医学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('a8888888-8888-8888-8888-888888888888', 'SOC', '社会学部', '今出川', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
-- ON CONFLICT (department_code) DO NOTHING;

-- user_profiles テーブルのサンプルデータ
-- 注意: user_idは実際のauth.usersのIDを参照する必要があるため、
-- 実際の運用時には適切なユーザーIDに置き換える必要があります
-- ここではサンプルとしてUUIDを生成していますが、実際には存在するユーザーIDを使用してください

-- サンプルプロファイル（実際のユーザーIDが必要な場合はコメントアウトしてください）
/*
INSERT INTO user_profiles (
    id, user_id, student_id, 
    first_name_kanji, first_name_katakana, 
    last_name_kanji, last_name_katakana, 
    grade, department_id, avatar_url, preferences
) VALUES
('b1111111-1111-1111-1111-111111111111', 'existing_user_id_1', 'S2024001', 
 '太郎', 'タロウ', '山田', 'ヤマダ', 
 2, 'a1111111-1111-1111-1111-111111111111', null, '{"theme": "light", "notifications": true}'),
('b2222222-2222-2222-2222-222222222222', 'existing_user_id_2', 'S2024002', 
 '花子', 'ハナコ', '鈴木', 'スズキ', 
 3, 'a2222222-2222-2222-2222-222222222222', null, '{"theme": "dark", "notifications": false}'),
('b3333333-3333-3333-3333-333333333333', 'existing_user_id_3', 'S2024003', 
 '健太', 'ケンタ', '田中', 'タナカ', 
 1, 'a5555555-5555-5555-5555-555555555555', null, '{"theme": "light", "notifications": true}'),
('b4444444-4444-4444-4444-444444444444', 'existing_user_id_4', 'S2024004', 
 '美香', 'ミカ', '佐藤', 'サトウ', 
 4, 'a3333333-3333-3333-3333-333333333333', null, '{"theme": "auto", "notifications": true}'),
('b5555555-5555-5555-5555-555555555555', 'existing_user_id_5', 'S2024005', 
 '大輔', 'ダイスケ', '高橋', 'タカハシ', 
 2, 'a8888888-8888-8888-8888-888888888888', null, '{"theme": "light", "notifications": true}');
*/

-- user_roles テーブルのサンプルデータ
-- 注意: user_idは実際のauth.usersのIDを参照する必要があります
/*
INSERT INTO user_roles (id, user_id, role_type, is_visible_to_general) VALUES
('c1111111-1111-1111-1111-111111111111', 'existing_user_id_1', 'admin', true),
('c2222222-2222-2222-2222-222222222222', 'existing_user_id_2', 'instructor', true),
('c3333333-3333-3333-3333-333333333333', 'existing_user_id_3', 'member', false),
('c4444444-4444-4444-4444-444444444444', 'existing_user_id_4', 'leader', true),
('c5555555-5555-5555-5555-555555555555', 'existing_user_id_5', 'member', false);
*/