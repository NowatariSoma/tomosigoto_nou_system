-- インストラクター候補を取得するRPC関数
-- 学年4のユーザーで、指定された練習スケジュールに出席記録があるユーザーを取得
-- 注意: このマイグレーションは user_profiles と practice_user_attendance テーブルが作成された後に実行される必要があります

CREATE OR REPLACE FUNCTION get_instructor_candidates(practice_schedule_id UUID)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    first_name_kanji TEXT,
    last_name_kanji TEXT,
    student_id TEXT,
    grade INTEGER,
    attendance_id UUID,
    attendance_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        up.first_name_kanji,
        up.last_name_kanji,
        up.student_id,
        up.grade,
        pua.id as attendance_id,
        pua.status as attendance_status
    FROM auth.users u
    INNER JOIN public.user_profiles up ON u.id = up.user_id
    INNER JOIN public.practice_user_attendance pua ON u.id = pua.user_id
    WHERE 
        up.grade = 4
        AND pua.practice_schedule_id = practice_schedule_id
        AND pua.status IN ('present', 'late')  -- 出席または遅刻のユーザーのみ
    ORDER BY up.last_name_kanji, up.first_name_kanji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数のコメント
COMMENT ON FUNCTION get_instructor_candidates(UUID) IS 'インストラクター候補を取得（学年4かつ出席記録があるユーザー）';

