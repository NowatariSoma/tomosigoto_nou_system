-- Enum
CREATE TYPE attendance_status AS ENUM ('present','late','absent','undecided');

-- 1) practice_schedules
CREATE TABLE practice_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  division_count integer NOT NULL DEFAULT 1 CHECK (division_count > 0),
  description text,
  schedule_type varchar(20) NOT NULL,
  status varchar(20),
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

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
  UNIQUE (schedule_id, slot_order) -- 同一スケジュールでの重複コマ防止
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
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  attendance_id uuid NOT NULL REFERENCES public.practice_user_attendance(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, attendance_id)
);

-- インデックス
CREATE INDEX idx_practice_schedules_date ON practice_schedules(schedule_date);
CREATE INDEX idx_practice_schedules_status ON practice_schedules(status);
CREATE INDEX idx_schedule_available_venues_schedule_id ON schedule_available_venues(schedule_id);
CREATE INDEX idx_schedule_available_venues_venue_id ON schedule_available_venues(venue_id);
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

-- 整合性トリガ（同一スケジュール & 出席系のみ）
CREATE OR REPLACE FUNCTION public.check_session_instructor_integrity()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.practice_user_attendance pua
      ON pua.id = NEW.attendance_id
    WHERE s.id = NEW.session_id
      AND pua.practice_schedule_id = s.schedule_id
      AND pua.status IN ('present','late')
  ) THEN
    RAISE EXCEPTION 'attendance/schedule mismatch OR status not eligible';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_session_instructor_integrity
BEFORE INSERT OR UPDATE ON public.session_instructors
FOR EACH ROW EXECUTE FUNCTION public.check_session_instructor_integrity();

-- 逆方向の保全（監督割当中に absent 禁止）
CREATE OR REPLACE FUNCTION public.prevent_absent_if_instructor()
RETURNS trigger AS $$
DECLARE
  has_assignment boolean;
BEGIN
  IF NEW.status = 'absent' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.session_instructors si
      WHERE si.attendance_id = NEW.id
    ) INTO has_assignment;

    IF has_assignment THEN
      RAISE EXCEPTION 'cannot set to absent: instructor assignment exists';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_absent_if_instructor
BEFORE UPDATE OF status ON public.practice_user_attendance
FOR EACH ROW EXECUTE FUNCTION public.prevent_absent_if_instructor();