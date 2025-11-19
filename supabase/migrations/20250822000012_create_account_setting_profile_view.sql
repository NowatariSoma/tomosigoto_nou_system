-- account_setting_profile ビューの作成
-- user_profiles と departments テーブルを結合してアカウント設定プロフィール情報を提供
-- 注意: このマイグレーションは 20250822000011_create_user_tables.sql の後に実行される必要があります

CREATE OR REPLACE VIEW public.account_setting_profile AS
SELECT 
    up.id,
    up.user_id,
    up.student_id,
    up.first_name_kanji,
    up.first_name_katakana,
    up.last_name_kanji,
    up.last_name_katakana,
    up.grade,
    d.department_code as faculty,
    d.department_name as faculty_name,
    u.email,
    up.avatar_url,
    up.preferences,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
LEFT JOIN public.departments d ON up.department_id = d.id
LEFT JOIN public.users u ON up.user_id = u.id;

