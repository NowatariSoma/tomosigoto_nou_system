-- セッションテーブルのUNIQUE制約を修正
-- 同じ時限（slot_order）でも異なる会場なら複数セッションを許可

-- 既存のUNIQUE制約を削除
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_schedule_id_slot_order_key;

-- 新しいUNIQUE制約を追加（会場を含む）
ALTER TABLE sessions ADD CONSTRAINT sessions_schedule_venue_slot_unique
  UNIQUE (schedule_id, schedule_available_venue_id, slot_order);