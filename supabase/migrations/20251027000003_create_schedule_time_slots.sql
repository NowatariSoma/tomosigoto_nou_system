-- schedule_time_slots テーブル
CREATE TABLE schedule_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  slot_order integer NOT NULL CHECK (slot_order > 0),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_time < end_time),
  UNIQUE (schedule_id, slot_order) -- 同一スケジュール内での順序の重複を防止
);

-- カラムコメント
COMMENT ON TABLE schedule_time_slots IS '練習スケジュールの時間スロット（開始時刻・終了時刻）を管理するテーブル';
COMMENT ON COLUMN schedule_time_slots.schedule_id IS '練習スケジュールID参照';
COMMENT ON COLUMN schedule_time_slots.slot_order IS '時間スロットの順序（上から何個目か）';
COMMENT ON COLUMN schedule_time_slots.start_time IS '時間スロットの開始時刻';
COMMENT ON COLUMN schedule_time_slots.end_time IS '時間スロットの終了時刻';

-- インデックス
CREATE INDEX idx_schedule_time_slots_schedule_id ON schedule_time_slots(schedule_id);
CREATE INDEX idx_schedule_time_slots_slot_order ON schedule_time_slots(slot_order);
CREATE INDEX idx_schedule_time_slots_start_time ON schedule_time_slots(start_time);

-- updated_at 自動更新（共通関数 update_updated_at_column() 前提）
CREATE TRIGGER trg_u_schedule_time_slots
BEFORE UPDATE ON public.schedule_time_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

