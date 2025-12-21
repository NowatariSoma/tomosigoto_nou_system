-- YouTube OAuth state管理テーブル
-- CSRF対策のためのstate保存用

create table if not exists public.youtube_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

-- インデックスの作成
create index if not exists idx_youtube_oauth_states_state 
  on public.youtube_oauth_states(state);
create index if not exists idx_youtube_oauth_states_expires_at 
  on public.youtube_oauth_states(expires_at);

-- 期限切れのstateを自動削除する関数
create or replace function cleanup_expired_oauth_states()
returns void as $$
begin
  delete from public.youtube_oauth_states
  where expires_at < now();
end;
$$ language plpgsql;

-- RLS (Row Level Security) の有効化
alter table public.youtube_oauth_states enable row level security;

-- RLSポリシー: サービスロールのみアクセス可能
create policy "Service role can manage youtube oauth states"
  on public.youtube_oauth_states
  for all
  using (auth.role() = 'service_role');

