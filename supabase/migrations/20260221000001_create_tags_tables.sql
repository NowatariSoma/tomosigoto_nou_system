-- タグ機能のためのテーブル作成
-- AI自動タグ生成システム用

-- タグカテゴリテーブル（回生、先生、演目などのタグ種類）
create table if not exists public.tag_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique, -- 例: "回生", "先生", "演目"
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- タグテーブル（具体的なタグ値）
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.tag_categories(id) on delete cascade,
  name        text not null, -- 例: "1回生", "弓八幡", "先生"
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint tags_category_name_unique unique (category_id, name)
);

-- ビデオタグ関連テーブル（videos と tags の多対多関係）
create table if not exists public.video_tags (
  id              uuid primary key default gen_random_uuid(),
  video_id        uuid not null references public.videos(id) on delete cascade,
  tag_id          uuid not null references public.tags(id) on delete cascade,
  confidence      float check (confidence >= 0.0 and confidence <= 1.0), -- AIの信頼度
  auto_generated  boolean not null default false, -- AI生成かどうか
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint video_tags_unique unique (video_id, tag_id)
);

-- インデックスの作成
create index if not exists idx_tags_category_id on public.tags(category_id);
create index if not exists idx_video_tags_video_id on public.video_tags(video_id);
create index if not exists idx_video_tags_tag_id on public.video_tags(tag_id);
create index if not exists idx_video_tags_auto_generated on public.video_tags(auto_generated);

-- updated_at の自動更新トリガー
create trigger set_updated_at_tag_categories
  before update on public.tag_categories
  for each row
  execute function set_updated_at();

create trigger set_updated_at_tags
  before update on public.tags
  for each row
  execute function set_updated_at();

create trigger set_updated_at_video_tags
  before update on public.video_tags
  for each row
  execute function set_updated_at();

-- RLS の有効化
alter table public.tag_categories enable row level security;
alter table public.tags enable row level security;
alter table public.video_tags enable row level security;

-- RLS ポリシーの作成（認証済みユーザーのみアクセス可能）
create policy "認証済みユーザーはtag_categoriesを閲覧可能" on public.tag_categories
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはtagsを閲覧可能" on public.tags
  for select using (auth.role() = 'authenticated');

create policy "認証済みユーザーはvideo_tagsを閲覧可能" on public.video_tags
  for select using (auth.role() = 'authenticated');

-- 管理者のみCRUD操作可能
create policy "管理者はtag_categoriesを管理可能" on public.tag_categories
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はtagsを管理可能" on public.tags
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

create policy "管理者はvideo_tagsを管理可能" on public.video_tags
  for all using (auth.role() = 'authenticated' and auth.jwt() ->> 'role' = 'admin');

-- 初期タグカテゴリの挿入
insert into public.tag_categories (name, description) values
  ('回生', '学年レベル（1回生、2回生など）'),
  ('先生', '先生が舞っているかどうか'),
  ('演目', '能楽の演目名');

-- 初期タグの挿入
insert into public.tags (category_id, name, description) 
select 
  tc.id,
  tag_name,
  tag_description
from public.tag_categories tc
cross join (
  values 
    ('回生', '1回生', '1年生が舞う動画'),
    ('回生', '2回生', '2年生が舞う動画'),
    ('回生', '3回生', '3年生が舞う動画'),
    ('回生', '4回生', '4年生が舞う動画'),
    ('先生', '先生', '先生が舞っている動画'),
    ('先生', '学生', '学生のみが舞っている動画'),
    ('演目', '弓八幡', '弓八幡の演目'),
    ('演目', '羽衣', '羽衣の演目'),
    ('演目', '敦盛', '敦盛の演目')
) as tag_data(category_name, tag_name, tag_description)
where tc.name = tag_data.category_name;