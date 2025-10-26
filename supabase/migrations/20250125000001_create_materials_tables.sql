-- Materials関連テーブルの作成
-- 能楽部資料庫のプレイリスト・動画管理用

-- playlists テーブル（年度+舞台の情報）
create table playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int not null,
  stage text not null,
  thumbnail_url text,
  created_at timestamptz default timezone('Asia/Tokyo', now()) not null,
  updated_at timestamptz default timezone('Asia/Tokyo', now()) not null
);

-- sub_playlists テーブル（本番・稽古のプレイリスト情報）
create table sub_playlists (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references playlists(id) on delete cascade,
  title text not null,
  recorded_date date not null,
  phase text not null check (phase in ('本番', '稽古')),
  playlist_url text not null,
  thumbnail_url text,
  created_at timestamptz default timezone('Asia/Tokyo', now()) not null,
  updated_at timestamptz default timezone('Asia/Tokyo', now()) not null
);

-- videos テーブル（個別動画情報）
create table videos (
  id uuid primary key default gen_random_uuid(),
  sub_playlist_id uuid not null references sub_playlists(id) on delete cascade,
  title text not null,
  video_url text not null,
  recorded_date date,
  thumbnail_url text,
  created_at timestamptz default timezone('Asia/Tokyo', now()) not null,
  updated_at timestamptz default timezone('Asia/Tokyo', now()) not null
);

-- インデックスの作成
create index idx_playlists_year on playlists(year);
create index idx_playlists_stage on playlists(stage);
create index idx_sub_playlists_playlist_id on sub_playlists(playlist_id);
create index idx_sub_playlists_phase on sub_playlists(phase);
create index idx_videos_sub_playlist_id on videos(sub_playlist_id);

-- RLS (Row Level Security) の有効化
alter table playlists enable row level security;
alter table sub_playlists enable row level security;
alter table videos enable row level security;

-- RLS ポリシーの作成（認証済みユーザーのみアクセス可能）
create policy "認証済みユーザーはplaylistsを閲覧可能" on playlists
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはsub_playlistsを閲覧可能" on sub_playlists
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはvideosを閲覧可能" on videos
  for select using (auth.role() = 'authenticated');

-- 管理者のみCRUD操作可能
create policy "管理者はplaylistsを管理可能" on playlists
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はsub_playlistsを管理可能" on sub_playlists
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はvideosを管理可能" on videos
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

-- updated_at の自動更新トリガー
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('Asia/Tokyo', now());
  return new;
end;
$$ language plpgsql;

create trigger update_playlists_updated_at before update on playlists
  for each row execute function update_updated_at_column();

create trigger update_sub_playlists_updated_at before update on sub_playlists
  for each row execute function update_updated_at_column();

create trigger update_videos_updated_at before update on videos
  for each row execute function update_updated_at_column();
