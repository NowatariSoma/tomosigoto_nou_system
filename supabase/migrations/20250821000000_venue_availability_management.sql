-- 会場利用可能性管理テーブル群

-- 1. 基本利用可能性ルールテーブル
-- 曜日・時間帯別の基本的な利用可能性を管理
create table venue_availability_rules (
    id uuid primary key default gen_random_uuid(),
    venue_id uuid not null references venues(id),
    day_of_week integer, -- 0=日曜, 1=月曜, ..., 6=土曜 (NULLで全曜日)
    start_time time,
    end_time time,
    is_available boolean not null default true,
    priority integer not null default 1, -- 優先度（高い数値ほど優先）
    description text, -- ルールの説明
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- 2. 特定日例外テーブル
-- 特定の日付での利用可能性の例外を管理
create table venue_date_exceptions (
    id uuid primary key default gen_random_uuid(),
    venue_id uuid not null references venues(id),
    exception_date date not null,
    start_time time,
    end_time time,
    is_available boolean not null,
    reason text, -- 'maintenance', 'event', 'closed', 'special_booking'など
    description text, -- 例外の詳細説明
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp
);

-- 3. 練習スケジュール利用可能会場テーブル
-- 各練習スケジュールで利用可能な会場を管理
create table schedule_available_venues (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid not null references practice_schedules(id),
    venue_id uuid not null references venues(id),
    is_preferred boolean not null default false, -- 優先利用会場
    priority integer not null default 1, -- 会場選択優先度
    notes text, -- 備考
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    
    -- 同じスケジュールで同じ会場の重複を防ぐ
    unique(schedule_id, venue_id)
);

-- インデックス作成
create index idx_venue_availability_rules_venue_id on venue_availability_rules(venue_id);
create index idx_venue_availability_rules_day_of_week on venue_availability_rules(day_of_week);
create index idx_venue_date_exceptions_venue_id on venue_date_exceptions(venue_id);
create index idx_venue_date_exceptions_date on venue_date_exceptions(exception_date);
create index idx_schedule_available_venues_schedule_id on schedule_available_venues(schedule_id);
create index idx_schedule_available_venues_venue_id on schedule_available_venues(venue_id);

-- コメント追加
comment on table venue_availability_rules is '会場の基本利用可能性ルール（曜日・時間帯別）';
comment on table venue_date_exceptions is '会場利用の特定日例外（メンテナンス・イベント等）';
comment on table schedule_available_venues is '練習スケジュール別利用可能会場';

comment on column venue_availability_rules.day_of_week is '0=日曜, 1=月曜, ..., 6=土曜, NULL=全曜日';
comment on column venue_availability_rules.priority is '優先度（高い数値ほど優先、同じ会場で複数ルールがある場合）';
comment on column venue_date_exceptions.reason is 'maintenance, event, closed, special_booking等';
comment on column schedule_available_venues.is_preferred is '優先利用会場フラグ';
comment on column schedule_available_venues.priority is '会場選択時の優先度';