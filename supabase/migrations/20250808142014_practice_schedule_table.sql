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
    session_id uuid references sessions(id),
    member_id uuid references members(id),
    part_id uuid references parts(id),
    attendance_status varchar(30),
    check_in_time timestamp,
    check_out_time timestamp,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- session_partsテーブル（セッションとパートの関連）
create table session_parts (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references sessions(id),
    part_id uuid not null references parts(id),
    is_required boolean not null default true,
    priority integer not null default 1,
    notes text,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    
    -- 同じセッションで同じパートの重複を防ぐ
    unique(session_id, part_id)
);

-- パート別出欠状況サマリービュー
create view session_part_attendance_summary as
select 
    sp.session_id,
    sp.part_id,
    p.name as part_name,
    count(ma.id) as total_members,
    count(sa.id) as recorded_attendances,
    count(case when sa.attendance_status = 'present' then 1 end) as present_count,
    count(case when sa.attendance_status = 'absent' then 1 end) as absent_count
from session_parts sp
join parts p on sp.part_id = p.id
left join member_assignments ma on p.id = ma.part_id
left join session_attendances sa on sp.session_id = sa.session_id and ma.user_id = sa.member_id
group by sp.session_id, sp.part_id, p.name;

-- インデックス作成
create index idx_session_parts_session_id on session_parts(session_id);
create index idx_session_parts_part_id on session_parts(part_id);

-- これでテーブルは完成