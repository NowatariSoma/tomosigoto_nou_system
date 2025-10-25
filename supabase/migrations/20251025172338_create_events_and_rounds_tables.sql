-- Create events table
CREATE TABLE events (
  id varchar(50) PRIMARY KEY,
  title varchar(100) NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location varchar(200),
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create rounds table
CREATE TABLE rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(50) NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number integer NOT NULL CHECK (round_number > 0),
  round_name varchar(100) NOT NULL,
  description text,
  start_time time,
  end_time time,
  status varchar(20) DEFAULT 'scheduled',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, round_number)
);

-- Create indexes
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_rounds_event_id ON rounds(event_id);
CREATE INDEX idx_rounds_round_number ON rounds(round_number);

-- Create triggers for updated_at
CREATE TRIGGER trg_u_events
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_u_rounds
BEFORE UPDATE ON public.rounds
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
