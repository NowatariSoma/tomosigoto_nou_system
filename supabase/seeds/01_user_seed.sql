-- ユーザー関連テーブルのシードデータ
-- 対応マイグレーション: 20250822000011_create_user_tables.sql

-- auth.users テーブルへのテストユーザー追加
-- 注意: 実際の本番環境では、ユーザーはSupabase Authを通じて作成されます
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
-- テストユーザー1-15（member_assignmentsで使用）
('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user1@example.com', '$2a$10$dummy_hash_1', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user2@example.com', '$2a$10$dummy_hash_2', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user3@example.com', '$2a$10$dummy_hash_3', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user4@example.com', '$2a$10$dummy_hash_4', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user5@example.com', '$2a$10$dummy_hash_5', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user6@example.com', '$2a$10$dummy_hash_6', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user7@example.com', '$2a$10$dummy_hash_7', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user8@example.com', '$2a$10$dummy_hash_8', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user9@example.com', '$2a$10$dummy_hash_9', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user10@example.com', '$2a$10$dummy_hash_10', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user11@example.com', '$2a$10$dummy_hash_11', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000012'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user12@example.com', '$2a$10$dummy_hash_12', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000013'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user13@example.com', '$2a$10$dummy_hash_13', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000014'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user14@example.com', '$2a$10$dummy_hash_14', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000015'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user15@example.com', '$2a$10$dummy_hash_15', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '');

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
('GS-LHS', '生命医科学研究科', '田辺', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- user_profiles テーブル（テストユーザー用プロファイル）
-- 注意: department_idは上記のdepartmentsテーブルから実際のIDを参照する必要があります
-- ここでは仮のIDを使用していますが、実際の実装では適切なIDに置き換えてください
INSERT INTO user_profiles (
    user_id,
    student_id,
    first_name_kanji,
    first_name_katakana,
    last_name_kanji,
    last_name_katakana,
    grade,
    department_id,
    avatar_url,
    preferences
) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'ST001', '太郎', 'タロウ', '田中', 'タナカ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000002'::uuid, 'ST002', '花子', 'ハナコ', '佐藤', 'サトウ', 2, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000003'::uuid, 'ST003', '次郎', 'ジロウ', '鈴木', 'スズキ', 4, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000004'::uuid, 'ST004', '美咲', 'ミサキ', '高橋', 'タカハシ', 1, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000005'::uuid, 'ST005', '健太', 'ケンタ', '伊藤', 'イトウ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000006'::uuid, 'ST006', '愛', 'アイ', '渡辺', 'ワタナベ', 2, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000007'::uuid, 'ST007', '大輔', 'ダイスケ', '山本', 'ヤマモト', 4, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000008'::uuid, 'ST008', '由美', 'ユミ', '中村', 'ナカムラ', 1, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000009'::uuid, 'ST009', '和也', 'カズヤ', '小林', 'コバヤシ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000010'::uuid, 'ST010', '麻衣', 'マイ', '加藤', 'カトウ', 2, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000011'::uuid, 'ST011', '翔太', 'ショウタ', '吉田', 'ヨシダ', 1, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000012'::uuid, 'ST012', '優香', 'ユウカ', '森', 'モリ', 2, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000013'::uuid, 'ST013', '拓也', 'タクヤ', '清水', 'シミズ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000014'::uuid, 'ST014', '恵', 'メグミ', '岡田', 'オカダ', 4, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}'),
('00000000-0000-0000-0000-000000000015'::uuid, 'ST015', '雅人', 'マサト', '池田', 'イケダ', 1, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), NULL, '{}');

-- user_roles テーブル（ユーザーの役割）
INSERT INTO user_roles (user_id, role_type, is_visible_to_general) VALUES
-- 管理者・指導者
('00000000-0000-0000-0000-000000000001', 'admin', true),
('00000000-0000-0000-0000-000000000001', 'instructor', true),
('00000000-0000-0000-0000-000000000004', 'senior_member', true),
('00000000-0000-0000-0000-000000000004', 'instructor', true),
('00000000-0000-0000-0000-000000000010', 'senior_member', true),
('00000000-0000-0000-0000-000000000013', 'instructor', true),
('00000000-0000-0000-0000-000000000014', 'instructor', true),
-- パートリーダー
('00000000-0000-0000-0000-000000000002', 'part_leader', true),
('00000000-0000-0000-0000-000000000003', 'part_leader', true),
('00000000-0000-0000-0000-000000000006', 'part_leader', true),
('00000000-0000-0000-0000-000000000009', 'part_leader', true),
-- 一般メンバー
('00000000-0000-0000-0000-000000000005', 'member', false),
('00000000-0000-0000-0000-000000000007', 'member', false),
('00000000-0000-0000-0000-000000000008', 'member', false),
('00000000-0000-0000-0000-000000000011', 'member', false),
('00000000-0000-0000-0000-000000000012', 'member', false),
('00000000-0000-0000-0000-000000000015', 'member', false),
-- 新入部員
('00000000-0000-0000-0000-000000000007', 'new_member', false),
('00000000-0000-0000-0000-000000000011', 'new_member', false),
('00000000-0000-0000-0000-000000000015', 'new_member', false);