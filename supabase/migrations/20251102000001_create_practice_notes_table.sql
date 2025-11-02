-- 練習備考テーブル
CREATE TABLE practice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  title varchar(100) NOT NULL,
  content text NOT NULL,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- カラムコメント
COMMENT ON COLUMN practice_notes.practice_schedule_id IS '練習スケジュールID';
COMMENT ON COLUMN practice_notes.title IS '備考タイトル';
COMMENT ON COLUMN practice_notes.content IS '備考内容';
COMMENT ON COLUMN practice_notes.priority IS '表示優先度（数値が大きいほど上に表示）';

-- インデックス
CREATE INDEX idx_practice_notes_schedule_id ON practice_notes(practice_schedule_id);
CREATE INDEX idx_practice_notes_priority ON practice_notes(priority DESC);

-- updated_at 自動更新
CREATE TRIGGER trg_u_practice_notes
BEFORE UPDATE ON public.practice_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
