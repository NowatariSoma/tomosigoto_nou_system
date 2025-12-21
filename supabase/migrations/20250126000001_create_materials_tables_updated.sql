-- Materials関連テーブルの作成（更新版）
-- 能楽部資料庫のプレイリスト・動画管理用
-- 注意: このマイグレーションはSupabaseダッシュボードで直接作成されたテーブル構造に基づいています

-- pgcrypto extension の有効化（gen_random_uuid()を使用するため）
create extension if not exists pgcrypto;

-- playlists テーブル（年度+舞台の情報）
create table if not exists public.playlists (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  name          text not null,
  year          int,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- sub_playlists テーブル（本番・稽古のプレイリスト情報）
create table if not exists public.sub_playlists (
  id            uuid primary key default gen_random_uuid(),
  playlist_id   uuid not null references public.playlists(id) on delete cascade,
  title         text not null,
  recorded_date date,
  phase         text,
  playlist_url  text,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- videos テーブル（個別動画情報）
create table if not exists public.videos (
  id              uuid primary key default gen_random_uuid(),
  sub_playlist_id uuid not null references public.sub_playlists(id) on delete cascade,
  title           text not null,
  video_url       text not null,
  recorded_date   date,
  thumbnail_url   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- favorites テーブル（ユーザーのお気に入り動画）
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  video_id   uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favorites_unique unique (user_id, video_id)
);

-- インデックスの作成
create index if not exists idx_playlists_year on public.playlists(year);
create index if not exists idx_playlists_name on public.playlists(name);
create index if not exists idx_sub_playlists_playlist_id on public.sub_playlists(playlist_id);
create index if not exists idx_sub_playlists_phase on public.sub_playlists(phase);
create index if not exists idx_videos_sub_playlist_id on public.videos(sub_playlist_id);
create index if not exists idx_favorites_user_id on public.favorites(user_id);
create index if not exists idx_favorites_video_id on public.favorites(video_id);

-- updated_at を自動更新する共通トリガー関数
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_at の自動更新トリガー
create trigger set_updated_at_playlists
  before update on public.playlists
  for each row
  execute function set_updated_at();

create trigger set_updated_at_sub_playlists
  before update on public.sub_playlists
  for each row
  execute function set_updated_at();

create trigger set_updated_at_videos
  before update on public.videos
  for each row
  execute function set_updated_at();

create trigger set_updated_at_favorites
  before update on public.favorites
  for each row
  execute function set_updated_at();

-- RLS (Row Level Security) の有効化
alter table public.playlists enable row level security;
alter table public.sub_playlists enable row level security;
alter table public.videos enable row level security;
alter table public.favorites enable row level security;

-- RLS ポリシーの作成（認証済みユーザーのみアクセス可能）
create policy "認証済みユーザーはplaylistsを閲覧可能" on public.playlists
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはsub_playlistsを閲覧可能" on public.sub_playlists
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはvideosを閲覧可能" on public.videos
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーは自分のお気に入りを閲覧可能" on public.favorites
  for select using (auth.uid() = user_id);

-- 管理者のみCRUD操作可能
create policy "管理者はplaylistsを管理可能" on public.playlists
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はsub_playlistsを管理可能" on public.sub_playlists
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はvideosを管理可能" on public.videos
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

-- ユーザーは自分のお気に入りを追加・削除可能
create policy "ユーザーは自分のお気に入りを追加可能" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "ユーザーは自分のお気に入りを削除可能" on public.favorites
  for delete using (auth.uid() = user_id);

