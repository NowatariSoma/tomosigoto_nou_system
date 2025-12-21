-- 1. venues テーブル
create table venues (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    code text unique not null,
    campus text not null,
    address text not null,
    latitude double precision not null,
    longitude double precision not null,
    can_mai boolean not null,
    capacity int not null,
    desk int,
    chair int,
    description text,
    is_active boolean not null,
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp
);

