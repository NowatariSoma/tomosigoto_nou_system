-- Remove 'undecided' status from attendance records
-- undecided状態の出欠記録を削除

-- 1. undecided状態の記録を削除
DELETE FROM practice_user_attendance
WHERE status = 'undecided';

-- 2. CHECK制約はすでに正しい（present, absent, late, no_show のみ）
-- 念のため確認: 既存のテーブル定義では 'undecided' は含まれていない
