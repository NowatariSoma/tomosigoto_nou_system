-- 最適化テスト用データ追加
-- ユーザー、メンバー割り当て、出席データを追加

-- 1. ユーザーの追加（もし存在しなければ）
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES 
-- 既存のユーザーはスキップ
('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'instructor1@example.com', '$2a$10$dummy_hash_1', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'instructor2@example.com', '$2a$10$dummy_hash_2', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member1@example.com', '$2a$10$dummy_hash_3', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member2@example.com', '$2a$10$dummy_hash_4', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member3@example.com', '$2a$10$dummy_hash_5', NOW(), NULL, NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 2. user_profiles の追加（既に存在する場合はスキップ）
INSERT INTO user_profiles (
    user_id, student_id, first_name_kanji, first_name_katakana,
    last_name_kanji, last_name_katakana, grade, department_id, preferences
)
SELECT 
    user_id, student_id, first_name_kanji, first_name_katakana,
    last_name_kanji, last_name_katakana, grade, department_id, preferences
FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'INST001', '秀雄', 'ヒデオ', '指導', 'シドウ', 4, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'INST002', '美和', 'ミワ', '先生', 'センセイ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'MEM001', '太郎', 'タロウ', '田中', 'タナカ', 3, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000004'::uuid, 'MEM002', '花子', 'ハナコ', '佐藤', 'サトウ', 2, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), '{}'::jsonb),
    ('00000000-0000-0000-0000-000000000005'::uuid, 'MEM003', '次郎', 'ジロウ', '鈴木', 'スズキ', 1, (SELECT id FROM departments WHERE department_code = 'LIT' LIMIT 1), '{}'::jsonb)
) AS v(user_id, student_id, first_name_kanji, first_name_katakana, last_name_kanji, last_name_katakana, grade, department_id, preferences)
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_profiles.user_id = v.user_id
);

-- 3. user_roles の追加（指導者にinstructorロール、既に存在する場合はスキップ）
INSERT INTO user_roles (user_id, role_type, is_visible_to_general) 
SELECT * FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'instructor', true),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'instructor', true)
) AS v(user_id, role_type, is_visible_to_general)
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE (user_roles.user_id, user_roles.role_type) = (v.user_id, v.role_type)
);

-- 4. 紅葉狩ステージ（d3333333-3333-3333-3333-333333333333）のパートへのメンバー割り当て追加
-- パートID: e3333331 (前シテ), e3333332 (後シテ), e3333333 (ワキ), e3333334 (ツレ), e3333335 (地謡), e3333336 (囃子方)
INSERT INTO member_assignments (user_id, part_id, category, display_order) VALUES
-- 指導者（パートリーダー）
('00000000-0000-0000-0000-000000000001'::uuid, 'e3333331-3333-3333-3333-333333333331', 'mai', 1),
('00000000-0000-0000-0000-000000000001'::uuid, 'e3333332-3333-3333-3333-333333333332', 'mai', 1),
('00000000-0000-0000-0000-000000000002'::uuid, 'e3333333-3333-3333-3333-333333333333', 'utai', 1),
-- 一般メンバー
('00000000-0000-0000-0000-000000000003'::uuid, 'e3333334-3333-3333-3333-333333333334', 'utai', 1),
('00000000-0000-0000-0000-000000000004'::uuid, 'e3333334-3333-3333-3333-333333333334', 'utai', 2),
('00000000-0000-0000-0000-000000000005'::uuid, 'e3333335-3333-3333-3333-333333333335', 'utai', 1)
ON CONFLICT (user_id, part_id) DO NOTHING;

-- 5. 出席データの追加（練習スケジュールID: f33b2e49-742a-47e7-8fa7-24953c4322f1）
-- 注意: created_by, updated_byカラムが存在するかどうかを確認してから実行してください
-- もしエラーが出る場合はカラムを削除して再実行してください

-- カラムの存在を確認してからINSERT
DO $$
BEGIN
    -- created_byカラムが存在するかチェック
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_user_attendance' 
        AND column_name = 'created_by'
    ) THEN
        -- created_by/updated_byあり
        INSERT INTO practice_user_attendance (
            practice_schedule_id, user_id, status, notes, created_by, updated_by
        ) VALUES
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'present', '出席確定', '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'present', '出席確定', '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000002'::uuid),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'present', '出席確定', '00000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000003'::uuid),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 'present', '出席確定', '00000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000004'::uuid),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, 'present', '出席確定', '00000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000005'::uuid)
        ON CONFLICT (practice_schedule_id, user_id) DO NOTHING;
    ELSE
        -- created_by/updated_byなし
        INSERT INTO practice_user_attendance (
            practice_schedule_id, user_id, status, notes
        ) VALUES
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'present', '出席確定'),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'present', '出席確定'),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'present', '出席確定'),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 'present', '出席確定'),
        ('f33b2e49-742a-47e7-8fa7-24953c4322f1'::uuid, '00000000-0000-0000-0000-000000000005'::uuid, 'present', '出席確定')
        ON CONFLICT (practice_schedule_id, user_id) DO NOTHING;
    END IF;
END $$;

-- 6. セッション指導者の追加（最適化後に使用）
-- 最適化前は空で問題なし

