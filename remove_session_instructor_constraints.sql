-- session_instructorsテーブルの制約を削除するSQLスクリプト
-- 手動でSupabase Dashboardで実行してください

-- 1. トリガーを削除
DROP TRIGGER IF EXISTS trg_check_session_instructor_integrity ON public.session_instructors;
DROP TRIGGER IF EXISTS trg_prevent_absent_if_instructor ON public.practice_user_attendance;

-- 2. 関数を削除
DROP FUNCTION IF EXISTS public.check_session_instructor_integrity();
DROP FUNCTION IF EXISTS public.prevent_absent_if_instructor();

-- 3. UNIQUE制約を削除
ALTER TABLE public.session_instructors DROP CONSTRAINT IF EXISTS session_instructors_session_id_attendance_id_key;

-- 確認用クエリ（実行後に確認してください）
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'session_instructors' AND table_schema = 'public';
