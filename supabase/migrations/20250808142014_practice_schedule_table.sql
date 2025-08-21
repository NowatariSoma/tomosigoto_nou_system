-- まず依存されるテーブルから作成

-- membersテーブル（メンバー情報）
create table members (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null unique,
    email varchar(100) unique,
    full_name varchar(100) not null,
    is_active boolean default true,
    can_supervise boolean default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- partsテーブル（パート区分）
create table parts (
    id uuid primary key default gen_random_uuid(),
    part_name varchar(50) not null,
    description varchar(200),
    priority integer default 5,
    is_active boolean default true,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- practice_schedulesテーブル（参照元になるため最初に作成）
create table practice_schedules (
    id uuid primary key default gen_random_uuid(),
    selected_venue_id uuid references venues(id),
    schedule_date date not null,
    start_time time not null,
    end_time time not null,
    description text,
    schedule_type varchar(20) not null,
    status varchar(20),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    created_by uuid references users(id),
    updated_by uuid references users(id)
);

-- sessionsテーブル
create table sessions (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid references practice_schedules(id),
    part_id uuid not null references parts(id),
    title varchar(30),
    start_time time not null,
    end_time time not null,
    location_in_venue varchar(255),
    priority int,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- session_instructorsテーブル
create table session_instructors (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references sessions(id),
    user_id uuid references users(id),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- session_attendancesテーブル
create table session_attendances (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id),
    member_assignment_id uuid not null references member_assignments(id),
    attendance_status varchar(30),
    check_in_time timestamp,
    check_out_time timestamp,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- セッション出欠状況サマリービュー
create view session_attendance_summary as
select 
    s.id as session_id,
    s.part_id,
    p.name as part_name,
    count(ma.id) as total_members,
    count(sa.id) as recorded_attendances,
    count(case when sa.attendance_status = 'present' then 1 end) as present_count,
    count(case when sa.attendance_status = 'absent' then 1 end) as absent_count
from sessions s
join parts p on s.part_id = p.id
left join member_assignments ma on p.id = ma.part_id
left join session_attendances sa on s.id = sa.session_id and ma.id = sa.member_assignment_id
group by s.id, s.part_id, p.name;

-- インデックス作成
create index idx_sessions_part_id on sessions(part_id);
create index idx_sessions_schedule_id on sessions(schedule_id);
create index idx_session_attendances_session_id on session_attendances(session_id);
create index idx_session_attendances_member_assignment_id on session_attendances(member_assignment_id);

-- これでテーブルは完成