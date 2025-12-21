-- Enum
CREATE TYPE attendance_status AS ENUM ('present','late','absent','undecided');

-- 1) practice_schedules
CREATE TABLE practice_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  division_count integer NOT NULL DEFAULT 1 CHECK (division_count > 0),
  title varchar(100),
  description text,
  schedule_type varchar(20) NOT NULL,
  status varchar(20),
  stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- カラムコメント
COMMENT ON COLUMN practice_schedules.stage_id IS '舞台ID参照（この練習で扱う舞台）';

-- 2) schedule_available_venues
CREATE TABLE schedule_available_venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  is_preferred boolean DEFAULT false,
  priority integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- 3) sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  title varchar(30),
  slot_order integer NOT NULL CHECK (slot_order > 0),
  schedule_available_venue_id uuid REFERENCES public.schedule_available_venues(id) ON DELETE SET NULL,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
);

-- 4) practice_user_attendance（Enum版）
CREATE TABLE practice_user_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'undecided',
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (practice_schedule_id, user_id) -- 同日同ユーザーの重複防止
);

-- 5) session_instructors（attendance参照）
CREATE TABLE session_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES public.practice_user_attendance(id) ON DELETE RESTRICT,
  schedule_id uuid NOT NULL REFERENCES public.practice_schedules(id) ON DELETE CASCADE,
  schedule_available_venue_id uuid REFERENCES public.schedule_available_venues(id) ON DELETE SET NULL,
  slot_order integer NOT NULL CHECK (slot_order > 0),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_practice_schedules_date ON practice_schedules(schedule_date);
CREATE INDEX idx_practice_schedules_status ON practice_schedules(status);
CREATE INDEX idx_practice_schedules_stage_id ON practice_schedules(stage_id);
CREATE INDEX idx_schedule_available_venues_schedule_id ON schedule_available_venues(schedule_id);
CREATE INDEX idx_sessions_schedule_id ON sessions(schedule_id);
CREATE INDEX idx_sessions_schedule_available_venue_id ON sessions(schedule_available_venue_id);
CREATE INDEX idx_sessions_part_id ON sessions(part_id);
CREATE INDEX idx_sessions_slot_order ON sessions(slot_order);
CREATE INDEX idx_pua_schedule_user_status ON practice_user_attendance (practice_schedule_id, user_id, status);
CREATE INDEX idx_si_session_id ON session_instructors(session_id);

-- updated_at 自動更新（共通関数 update_updated_at_column() 前提）
CREATE TRIGGER trg_u_practice_schedules
BEFORE UPDATE ON public.practice_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_u_schedule_available_venues
BEFORE UPDATE ON public.schedule_available_venues
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_u_sessions
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_u_session_instructors
BEFORE UPDATE ON public.session_instructors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_u_practice_user_attendance
BEFORE UPDATE ON public.practice_user_attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
