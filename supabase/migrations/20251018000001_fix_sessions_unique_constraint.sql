-- 既存のUNIQUE制約を削除
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_schedule_id_slot_order_key;

-- 新しいUNIQUE制約を追加（会場も含める）
ALTER TABLE sessions ADD CONSTRAINT sessions_schedule_venue_slot_unique
  UNIQUE (schedule_id, schedule_available_venue_id, slot_order);

-- コメント追加
COMMENT ON CONSTRAINT sessions_schedule_venue_slot_unique ON sessions IS
  '同一スケジュール・同一会場・同一時限での重複を防止';
