-- ============================================================
-- tomosigoto_nou_system: 統合スキーマ
-- auth.users → public.users 実テーブルに移行
-- Supabase Auth (GoTrue) 非依存版
-- ============================================================

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 共通トリガー関数
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- materials 系で使用していた関数を統一
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. users テーブル (Supabase auth.users の代替・実テーブル)
-- ============================================================

CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT UNIQUE NOT NULL,
    encrypted_password   TEXT NOT NULL,
    is_verified          BOOLEAN DEFAULT FALSE,
    verify_token         TEXT,
    verify_token_expires TIMESTAMP WITH TIME ZONE,
    raw_user_meta_data   JSONB DEFAULT '{}',
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_sign_in_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. refresh_tokens テーブル (自前認証用)
-- ============================================================

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================================
-- 3. departments テーブル
-- ============================================================

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) UNIQUE,
    department_name VARCHAR(100),
    campus          VARCHAR(50),
    is_active       BOOLEAN,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. user_profiles テーブル
-- ============================================================

CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id          TEXT UNIQUE NOT NULL,
    first_name_kanji    TEXT NOT NULL,
    first_name_katakana TEXT NOT NULL,
    last_name_kanji     TEXT NOT NULL,
    last_name_katakana  TEXT NOT NULL,
    grade               INTEGER,
    department_id       UUID NOT NULL REFERENCES departments(id),
    email               TEXT,
    avatar_url          TEXT,
    preferences         JSONB,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN user_profiles.email IS 'メールアドレス（users テーブルと同期）';

-- ============================================================
-- 5. user_roles テーブル
-- ============================================================

CREATE TABLE user_roles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
    role_type             TEXT NOT NULL,
    is_visible_to_general BOOLEAN DEFAULT FALSE,
    is_instructor         BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. account_setting_history テーブル
-- ============================================================

CREATE TABLE account_setting_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name  TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_setting_history_user_id ON account_setting_history(user_id);
CREATE INDEX idx_account_setting_history_changed_at ON account_setting_history(changed_at DESC);

-- ============================================================
-- 7. venues テーブル
-- ============================================================

CREATE TABLE venues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    code        TEXT UNIQUE NOT NULL,
    campus      TEXT NOT NULL,
    address     TEXT NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    can_mai     BOOLEAN NOT NULL,
    capacity    INT NOT NULL,
    desk        INT,
    chair       INT,
    description TEXT,
    is_active   BOOLEAN NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. stages テーブル
-- ============================================================

CREATE TABLE stages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    performance_date DATE,
    status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_stages_performance_date ON stages(performance_date);

CREATE TRIGGER update_stages_updated_at
BEFORE UPDATE ON stages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. parts テーブル
-- ============================================================

CREATE TABLE parts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id    UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parts_stage_id ON parts(stage_id);
CREATE INDEX idx_parts_status ON parts(status);

CREATE TRIGGER update_parts_updated_at
BEFORE UPDATE ON parts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. member_assignments テーブル
-- ============================================================

CREATE TABLE member_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    part_id       UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    category      VARCHAR(10) NOT NULL CHECK (category IN ('utai', 'mai')),
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, part_id)
);

CREATE INDEX idx_member_assignments_user_id ON member_assignments(user_id);
CREATE INDEX idx_member_assignments_part_id ON member_assignments(part_id);
CREATE INDEX idx_member_assignments_category ON member_assignments(category);

CREATE TRIGGER update_member_assignments_updated_at
BEFORE UPDATE ON member_assignments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. contacts テーブル
-- ============================================================

CREATE TABLE contacts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT,
    category   TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
    content    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. practice_schedules テーブル
-- ============================================================

CREATE TABLE practice_schedules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_date  DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    division_count INTEGER NOT NULL DEFAULT 1 CHECK (division_count > 0),
    title          VARCHAR(100),
    description    TEXT,
    schedule_type  VARCHAR(20) NOT NULL,
    status         VARCHAR(20),
    stage_id       UUID REFERENCES stages(id) ON DELETE SET NULL,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_schedules_date ON practice_schedules(schedule_date);
CREATE INDEX idx_practice_schedules_status ON practice_schedules(status);
CREATE INDEX idx_practice_schedules_stage_id ON practice_schedules(stage_id);

CREATE TRIGGER trg_u_practice_schedules
BEFORE UPDATE ON practice_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN practice_schedules.stage_id IS '舞台ID参照（この練習で扱う舞台）';

-- ============================================================
-- 13. schedule_available_venues テーブル
-- ============================================================

CREATE TABLE schedule_available_venues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    venue_id    UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT false,
    priority    INTEGER DEFAULT 0,
    notes       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_available_venues_schedule_id ON schedule_available_venues(schedule_id);

CREATE TRIGGER trg_u_schedule_available_venues
BEFORE UPDATE ON schedule_available_venues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. sessions テーブル
-- ============================================================

CREATE TABLE sessions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id                 UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    part_id                     UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    title                       VARCHAR(30),
    slot_order                  INTEGER NOT NULL CHECK (slot_order > 0),
    schedule_available_venue_id UUID REFERENCES schedule_available_venues(id) ON DELETE SET NULL,
    priority                    INTEGER DEFAULT 0,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sessions_schedule_venue_slot_unique
        UNIQUE (schedule_id, schedule_available_venue_id, slot_order)
);

CREATE INDEX idx_sessions_schedule_id ON sessions(schedule_id);
CREATE INDEX idx_sessions_schedule_available_venue_id ON sessions(schedule_available_venue_id);
CREATE INDEX idx_sessions_part_id ON sessions(part_id);
CREATE INDEX idx_sessions_slot_order ON sessions(slot_order);

CREATE TRIGGER trg_u_sessions
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 15. practice_user_attendance テーブル
-- ============================================================

CREATE TABLE practice_user_attendance (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_schedule_id UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status               TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'no_show', 'undecided')),
    notes                TEXT,
    available_from       TIME,
    available_to         TIME,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (practice_schedule_id, user_id)
);

CREATE INDEX idx_practice_user_attendance_practice_schedule_id ON practice_user_attendance(practice_schedule_id);
CREATE INDEX idx_practice_user_attendance_user_id ON practice_user_attendance(user_id);
CREATE INDEX idx_practice_user_attendance_status ON practice_user_attendance(status);
CREATE INDEX idx_pua_schedule_user_status ON practice_user_attendance(practice_schedule_id, user_id, status);

CREATE TRIGGER trg_u_practice_user_attendance
BEFORE UPDATE ON practice_user_attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 16. session_instructors テーブル
-- ============================================================

CREATE TABLE session_instructors (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id               UUID NOT NULL REFERENCES practice_user_attendance(id) ON DELETE RESTRICT,
    schedule_id                 UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    schedule_available_venue_id UUID REFERENCES schedule_available_venues(id) ON DELETE SET NULL,
    slot_order                  INTEGER NOT NULL CHECK (slot_order > 0),
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_instructors_attendance_id ON session_instructors(attendance_id);
CREATE INDEX idx_session_instructors_schedule_id ON session_instructors(schedule_id);

CREATE TRIGGER trg_u_session_instructors
BEFORE UPDATE ON session_instructors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 17. schedule_time_slots テーブル
-- ============================================================

CREATE TABLE schedule_time_slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES practice_schedules(id) ON DELETE CASCADE,
    slot_order  INTEGER NOT NULL CHECK (slot_order > 0),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (start_time < end_time),
    UNIQUE (schedule_id, slot_order)
);

CREATE INDEX idx_schedule_time_slots_schedule_id ON schedule_time_slots(schedule_id);
CREATE INDEX idx_schedule_time_slots_slot_order ON schedule_time_slots(slot_order);
CREATE INDEX idx_schedule_time_slots_start_time ON schedule_time_slots(start_time);

CREATE TRIGGER trg_u_schedule_time_slots
BEFORE UPDATE ON schedule_time_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 18. playlists テーブル
-- ============================================================

CREATE TABLE playlists (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    name          TEXT NOT NULL,
    year          INT,
    thumbnail_url TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_playlists_year ON playlists(year);
CREATE INDEX idx_playlists_name ON playlists(name);

CREATE TRIGGER set_updated_at_playlists
BEFORE UPDATE ON playlists
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 19. sub_playlists テーブル
-- ============================================================

CREATE TABLE sub_playlists (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id   UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    recorded_date DATE,
    phase         TEXT,
    playlist_url  TEXT,
    thumbnail_url TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_playlists_playlist_id ON sub_playlists(playlist_id);
CREATE INDEX idx_sub_playlists_phase ON sub_playlists(phase);

CREATE TRIGGER set_updated_at_sub_playlists
BEFORE UPDATE ON sub_playlists
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 20. videos テーブル
-- ============================================================

CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_playlist_id UUID NOT NULL REFERENCES sub_playlists(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    video_url       TEXT NOT NULL,
    recorded_date   DATE,
    thumbnail_url   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_sub_playlist_id ON videos(sub_playlist_id);

CREATE TRIGGER set_updated_at_videos
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 21. favorites テーブル
-- ============================================================

CREATE TABLE favorites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT favorites_unique UNIQUE (user_id, video_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_video_id ON favorites(video_id);

CREATE TRIGGER set_updated_at_favorites
BEFORE UPDATE ON favorites
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 22. youtube_oauth_tokens テーブル
-- ============================================================

CREATE TABLE youtube_oauth_tokens (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type   TEXT NOT NULL DEFAULT 'system' CHECK (account_type IN ('system', 'user')),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token   TEXT NOT NULL,
    refresh_token  TEXT,
    token_uri      TEXT DEFAULT 'https://oauth2.googleapis.com/token',
    client_id      TEXT,
    client_secret  TEXT,
    scopes         TEXT[],
    expiry         TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT youtube_oauth_tokens_system_unique UNIQUE (account_type) WHERE account_type = 'system',
    CONSTRAINT youtube_oauth_tokens_user_unique UNIQUE (user_id) WHERE account_type = 'user'
);

CREATE INDEX idx_youtube_oauth_tokens_account_type ON youtube_oauth_tokens(account_type);
CREATE INDEX idx_youtube_oauth_tokens_user_id ON youtube_oauth_tokens(user_id) WHERE user_id IS NOT NULL;

CREATE TRIGGER set_updated_at_youtube_oauth_tokens
BEFORE UPDATE ON youtube_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 23. youtube_oauth_states テーブル
-- ============================================================

CREATE TABLE youtube_oauth_states (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state      TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_youtube_oauth_states_state ON youtube_oauth_states(state);
CREATE INDEX idx_youtube_oauth_states_expires_at ON youtube_oauth_states(expires_at);

CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS VOID AS $$
BEGIN
    DELETE FROM youtube_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 24. ビュー
-- ============================================================

CREATE VIEW account_setting_profile AS
SELECT
    up.id,
    up.user_id,
    up.student_id,
    up.first_name_kanji,
    up.first_name_katakana,
    up.last_name_kanji,
    up.last_name_katakana,
    up.grade,
    d.department_code AS faculty,
    d.department_name AS faculty_name,
    u.email,
    up.avatar_url,
    up.preferences,
    up.created_at,
    up.updated_at
FROM user_profiles up
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN users u ON up.user_id = u.id;

CREATE VIEW practice_user_attendance_summary AS
SELECT
    ps.id AS practice_schedule_id,
    ps.schedule_date,
    ps.description,
    v.name AS venue_name,
    COUNT(a.id) AS total_people,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_show_count,
    ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL /
         NULLIF(COUNT(a.id), 0) * 100), 2
    ) AS attendance_rate
FROM practice_schedules ps
LEFT JOIN schedule_available_venues sav ON ps.id = sav.schedule_id
LEFT JOIN venues v ON sav.venue_id = v.id
LEFT JOIN practice_user_attendance a ON ps.id = a.practice_schedule_id
GROUP BY ps.id, ps.schedule_date, ps.description, v.name;

CREATE VIEW practice_user_attendance_history AS
SELECT
    u.id AS user_id,
    u.email,
    up.first_name_kanji,
    up.last_name_kanji,
    up.student_id,
    a.status AS attendance_status,
    a.available_from,
    a.available_to,
    ps.schedule_date,
    ps.description,
    v.name AS venue_name,
    a.notes
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN practice_user_attendance a ON u.id = a.user_id
LEFT JOIN practice_schedules ps ON a.practice_schedule_id = ps.id
LEFT JOIN schedule_available_venues sav ON ps.id = sav.schedule_id
LEFT JOIN venues v ON sav.venue_id = v.id
ORDER BY u.id, ps.schedule_date DESC;

-- ============================================================
-- 25. インストラクター候補取得関数
-- ============================================================

CREATE OR REPLACE FUNCTION get_instructor_candidates(p_practice_schedule_id UUID)
RETURNS TABLE (
    user_id          UUID,
    email            TEXT,
    first_name_kanji TEXT,
    last_name_kanji  TEXT,
    student_id       TEXT,
    grade            INTEGER,
    attendance_id    UUID,
    attendance_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email,
        up.first_name_kanji,
        up.last_name_kanji,
        up.student_id,
        up.grade,
        pua.id AS attendance_id,
        pua.status AS attendance_status
    FROM users u
    INNER JOIN user_profiles up ON u.id = up.user_id
    INNER JOIN practice_user_attendance pua ON u.id = pua.user_id
    WHERE
        up.grade = 4
        AND pua.practice_schedule_id = p_practice_schedule_id
        AND pua.status IN ('present', 'late')
    ORDER BY up.last_name_kanji, up.first_name_kanji;
END;
$$ LANGUAGE plpgsql;
