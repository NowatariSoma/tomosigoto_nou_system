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

-- users テーブルのサンプルデータ
INSERT INTO users (id, email, auth_provider, is_active, email_verified) VALUES
(gen_random_uuid(), 'student001@mail.doshisha.ac.jp', 'email', true, true),
(gen_random_uuid(), 'student002@mail.doshisha.ac.jp', 'email', true, true),
(gen_random_uuid(), 'student003@mail.doshisha.ac.jp', 'email', true, true),
(gen_random_uuid(), 'teacher001@mail.doshisha.ac.jp', 'email', true, true),
(gen_random_uuid(), 'teacher002@mail.doshisha.ac.jp', 'email', true, true),
(gen_random_uuid(), 'admin001@mail.doshisha.ac.jp', 'email', true, true);

-- user_profiles テーブルのサンプルデータ
INSERT INTO user_profiles (user_id, student_id, first_name_kanji, first_name_katakana, last_name_kanji, last_name_katakana, grade, department_id, preferences)
SELECT 
    u.id as user_id,
    profile_data.student_id,
    profile_data.first_name_kanji,
    profile_data.first_name_katakana,
    profile_data.last_name_kanji,
    profile_data.last_name_katakana,
    profile_data.grade,
    d.id as department_id,
    profile_data.preferences
FROM users u
CROSS JOIN LATERAL (
    SELECT 
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN 'DU22001'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN 'DU22002'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN 'DU21003'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN 'T001'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN 'T002'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN 'A001'
        END as student_id,
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN '太郎'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN '花子'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN '次郎'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN '教授'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN '准教授'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN '管理者'
        END as first_name_kanji,
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN 'タロウ'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN 'ハナコ'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN 'ジロウ'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN 'キョウジュ'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN 'ジュンキョウジュ'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN 'カンリシャ'
        END as first_name_katakana,
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN '同志社'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN '同志社'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN '同志社'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN '田中'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN '佐藤'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN '管理'
        END as last_name_kanji,
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN 'ドウシシャ'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN 'ドウシシャ'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN 'ドウシシャ'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN 'タナカ'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN 'サトウ'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN 'カンリ'
        END as last_name_katakana,
        CASE 
            WHEN u.email LIKE 'student001%' THEN 2
            WHEN u.email LIKE 'student002%' THEN 2
            WHEN u.email LIKE 'student003%' THEN 3
            ELSE NULL
        END as grade,
        CASE 
            WHEN u.email = 'student001@mail.doshisha.ac.jp' THEN 'ENG'
            WHEN u.email = 'student002@mail.doshisha.ac.jp' THEN 'CUL'
            WHEN u.email = 'student003@mail.doshisha.ac.jp' THEN 'COM'
            WHEN u.email = 'teacher001@mail.doshisha.ac.jp' THEN 'ENG'
            WHEN u.email = 'teacher002@mail.doshisha.ac.jp' THEN 'CUL'
            WHEN u.email = 'admin001@mail.doshisha.ac.jp' THEN 'LAW'
        END as dept_code,
        CASE 
            WHEN u.email LIKE 'student%' THEN '{"notification": true, "language": "ja", "theme": "light"}'::jsonb
            WHEN u.email LIKE 'teacher%' THEN '{"notification": true, "language": "ja", "theme": "dark", "admin_panel": true}'::jsonb
            ELSE '{"notification": false, "language": "ja", "theme": "system", "admin_panel": true}'::jsonb
        END as preferences
) profile_data
JOIN departments d ON d.department_code = profile_data.dept_code;

-- user_roles テーブルのサンプルデータ
INSERT INTO user_roles (user_id, role_type, is_visible_to_general)
SELECT 
    u.id as user_id,
    CASE 
        WHEN u.email LIKE 'student%' THEN 'student'
        WHEN u.email LIKE 'teacher%' THEN 'teacher'
        WHEN u.email LIKE 'admin%' THEN 'admin'
        ELSE 'guest'
    END as role_type,
    CASE 
        WHEN u.email LIKE 'admin%' THEN false
        ELSE true
    END as is_visible_to_general
FROM users u;