-- ====================================================================
-- Supabase Seed Data - Main Entry Point
-- ====================================================================
-- このファイルは `supabase seed` コマンドで自動的に実行されます
-- ====================================================================

-- seedsディレクトリの個別ファイルをインクルード
\i seeds/01_venue_seed.sql
\i seeds/03_department_and_profiles_seed.sql
\i seeds/04_stage_and_parts_seed.sql
\i seeds/05_member_assignments_seed.sql
\i seeds/06_practice_and_venue_seed.sql
\i seeds/07_session_attendance_seed.sql