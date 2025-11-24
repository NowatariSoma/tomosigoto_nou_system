-- YouTube OAuthトークン管理テーブル
-- システム管理者用のYouTube OAuth認証情報を保存

-- pgcrypto extension の有効化（gen_random_uuid()を使用するため）
create extension if not exists pgcrypto;

-- youtube_oauth_tokens テーブル
create table if not exists public.youtube_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  account_type text not null default 'system' check (account_type in ('system', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_uri text default 'https://oauth2.googleapis.com/token',
  client_id text,
  client_secret text,
  scopes text[],
  expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint youtube_oauth_tokens_system_unique unique (account_type) where account_type = 'system',
  constraint youtube_oauth_tokens_user_unique unique (user_id) where account_type = 'user'
);

-- インデックスの作成
create index if not exists idx_youtube_oauth_tokens_account_type 
  on public.youtube_oauth_tokens(account_type);
create index if not exists idx_youtube_oauth_tokens_user_id 
  on public.youtube_oauth_tokens(user_id) where user_id is not null;

-- updated_at を自動更新するトリガー
create trigger set_updated_at_youtube_oauth_tokens
  before update on public.youtube_oauth_tokens
  for each row
  execute function set_updated_at();

-- RLS (Row Level Security) の有効化
alter table public.youtube_oauth_tokens enable row level security;

-- RLSポリシー: サービスロールのみアクセス可能（システム管理者用）
create policy "Service role can manage youtube oauth tokens"
  on public.youtube_oauth_tokens
  for all
  using (auth.role() = 'service_role');

