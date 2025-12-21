-- Materials関連テーブルのシードデータ
-- 対応テーブル: playlists, sub_playlists, videos, favorites
-- 注意: このseedファイルはSupabaseダッシュボードで直接作成されたテーブル構造に基づいています
-- このseedファイルは他のテーブルに影響を与えず、既存データがあればスキップします

BEGIN;

-- playlists テーブル（年度+舞台の情報）
-- ON CONFLICT DO NOTHING: 既に同じIDのレコードが存在する場合はスキップ
INSERT INTO public.playlists (id, title, name, year, thumbnail_url, created_at, updated_at) VALUES
-- 2024年度の舞台
('10000000-0000-0000-0000-000000000001'::uuid, '第50回定期公演', '高砂', 2024, 'https://example.com/thumbnails/takasago_2024.jpg', NOW(), NOW()),
('10000000-0000-0000-0000-000000000002'::uuid, '第50回定期公演', '羽衣', 2024, 'https://example.com/thumbnails/hagoromo_2024.jpg', NOW(), NOW()),
('10000000-0000-0000-0000-000000000003'::uuid, '第51回定期公演', '船弁慶', 2024, 'https://example.com/thumbnails/funabenkei_2024.jpg', NOW(), NOW()),
-- 2023年度の舞台
('10000000-0000-0000-0000-000000000004'::uuid, '第49回定期公演', '高砂', 2023, 'https://example.com/thumbnails/takasago_2023.jpg', NOW(), NOW()),
('10000000-0000-0000-0000-000000000005'::uuid, '第49回定期公演', '羽衣', 2023, 'https://example.com/thumbnails/hagoromo_2023.jpg', NOW(), NOW()),
-- 2025年度の舞台
('10000000-0000-0000-0000-000000000006'::uuid, '第51回定期公演', '高砂', 2025, 'https://example.com/thumbnails/takasago_2025.jpg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- sub_playlists テーブル（本番・稽古のプレイリスト情報）
-- ON CONFLICT DO NOTHING: 既に同じIDのレコードが存在する場合はスキップ
INSERT INTO public.sub_playlists (id, playlist_id, title, recorded_date, phase, playlist_url, thumbnail_url, created_at, updated_at) VALUES
-- 2024年度 高砂のサブプレイリスト
('20000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '高砂 本番', '2024-03-15'::date, '本番', 'https://youtube.com/playlist?list=PL2024_takasago_honban', 'https://example.com/thumbnails/takasago_honban_2024.jpg', NOW(), NOW()),
('20000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '高砂 稽古1回目', '2024-01-20'::date, '稽古', 'https://youtube.com/playlist?list=PL2024_takasago_keiko1', 'https://example.com/thumbnails/takasago_keiko1_2024.jpg', NOW(), NOW()),
('20000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '高砂 稽古2回目', '2024-02-10'::date, '稽古', 'https://youtube.com/playlist?list=PL2024_takasago_keiko2', 'https://example.com/thumbnails/takasago_keiko2_2024.jpg', NOW(), NOW()),
-- 2024年度 羽衣のサブプレイリスト
('20000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '羽衣 本番', '2024-03-15'::date, '本番', 'https://youtube.com/playlist?list=PL2024_hagoromo_honban', 'https://example.com/thumbnails/hagoromo_honban_2024.jpg', NOW(), NOW()),
('20000000-0000-0000-0000-000000000005'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '羽衣 稽古1回目', '2024-01-25'::date, '稽古', 'https://youtube.com/playlist?list=PL2024_hagoromo_keiko1', 'https://example.com/thumbnails/hagoromo_keiko1_2024.jpg', NOW(), NOW()),
-- 2024年度 船弁慶のサブプレイリスト
('20000000-0000-0000-0000-000000000006'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, '船弁慶 本番', '2024-07-20'::date, '本番', 'https://youtube.com/playlist?list=PL2024_funabenkei_honban', 'https://example.com/thumbnails/funabenkei_honban_2024.jpg', NOW(), NOW()),
('20000000-0000-0000-0000-000000000007'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, '船弁慶 稽古1回目', '2024-05-15'::date, '稽古', 'https://youtube.com/playlist?list=PL2024_funabenkei_keiko1', 'https://example.com/thumbnails/funabenkei_keiko1_2024.jpg', NOW(), NOW()),
-- 2023年度 高砂のサブプレイリスト
('20000000-0000-0000-0000-000000000008'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, '高砂 本番', '2023-03-10'::date, '本番', 'https://youtube.com/playlist?list=PL2023_takasago_honban', 'https://example.com/thumbnails/takasago_honban_2023.jpg', NOW(), NOW()),
-- 2025年度 高砂のサブプレイリスト
('20000000-0000-0000-0000-000000000009'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, '高砂 稽古1回目', '2025-01-15'::date, '稽古', 'https://youtube.com/playlist?list=PL2025_takasago_keiko1', 'https://example.com/thumbnails/takasago_keiko1_2025.jpg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- videos テーブル（個別動画情報）
-- ON CONFLICT DO NOTHING: 既に同じIDのレコードが存在する場合はスキップ
INSERT INTO public.videos (id, sub_playlist_id, title, video_url, recorded_date, thumbnail_url, created_at, updated_at) VALUES
-- 2024年度 高砂 本番の動画
('30000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, '高砂 本番 序', 'https://youtube.com/watch?v=takasago_honban_jo', '2024-03-15'::date, 'https://example.com/thumbnails/takasago_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, '高砂 本番 破', 'https://youtube.com/watch?v=takasago_honban_ha', '2024-03-15'::date, 'https://example.com/thumbnails/takasago_ha.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, '高砂 本番 急', 'https://youtube.com/watch?v=takasago_honban_kyu', '2024-03-15'::date, 'https://example.com/thumbnails/takasago_kyu.jpg', NOW(), NOW()),
-- 2024年度 高砂 稽古1回目の動画
('30000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, '高砂 稽古1回目 序', 'https://youtube.com/watch?v=takasago_keiko1_jo', '2024-01-20'::date, 'https://example.com/thumbnails/takasago_keiko1_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, '高砂 稽古1回目 破', 'https://youtube.com/watch?v=takasago_keiko1_ha', '2024-01-20'::date, 'https://example.com/thumbnails/takasago_keiko1_ha.jpg', NOW(), NOW()),
-- 2024年度 高砂 稽古2回目の動画
('30000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, '高砂 稽古2回目 序', 'https://youtube.com/watch?v=takasago_keiko2_jo', '2024-02-10'::date, 'https://example.com/thumbnails/takasago_keiko2_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000007'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, '高砂 稽古2回目 破', 'https://youtube.com/watch?v=takasago_keiko2_ha', '2024-02-10'::date, 'https://example.com/thumbnails/takasago_keiko2_ha.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000008'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, '高砂 稽古2回目 急', 'https://youtube.com/watch?v=takasago_keiko2_kyu', '2024-02-10'::date, 'https://example.com/thumbnails/takasago_keiko2_kyu.jpg', NOW(), NOW()),
-- 2024年度 羽衣 本番の動画
('30000000-0000-0000-0000-000000000009'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, '羽衣 本番 序', 'https://youtube.com/watch?v=hagoromo_honban_jo', '2024-03-15'::date, 'https://example.com/thumbnails/hagoromo_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000010'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, '羽衣 本番 破', 'https://youtube.com/watch?v=hagoromo_honban_ha', '2024-03-15'::date, 'https://example.com/thumbnails/hagoromo_ha.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000011'::uuid, '20000000-0000-0000-0000-000000000004'::uuid, '羽衣 本番 急', 'https://youtube.com/watch?v=hagoromo_honban_kyu', '2024-03-15'::date, 'https://example.com/thumbnails/hagoromo_kyu.jpg', NOW(), NOW()),
-- 2024年度 羽衣 稽古1回目の動画
('30000000-0000-0000-0000-000000000012'::uuid, '20000000-0000-0000-0000-000000000005'::uuid, '羽衣 稽古1回目 序', 'https://youtube.com/watch?v=hagoromo_keiko1_jo', '2024-01-25'::date, 'https://example.com/thumbnails/hagoromo_keiko1_jo.jpg', NOW(), NOW()),
-- 2024年度 船弁慶 本番の動画
('30000000-0000-0000-0000-000000000013'::uuid, '20000000-0000-0000-0000-000000000006'::uuid, '船弁慶 本番 序', 'https://youtube.com/watch?v=funabenkei_honban_jo', '2024-07-20'::date, 'https://example.com/thumbnails/funabenkei_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000014'::uuid, '20000000-0000-0000-0000-000000000006'::uuid, '船弁慶 本番 破', 'https://youtube.com/watch?v=funabenkei_honban_ha', '2024-07-20'::date, 'https://example.com/thumbnails/funabenkei_ha.jpg', NOW(), NOW()),
-- 2023年度 高砂 本番の動画
('30000000-0000-0000-0000-000000000015'::uuid, '20000000-0000-0000-0000-000000000008'::uuid, '高砂 本番 序', 'https://youtube.com/watch?v=takasago_2023_jo', '2023-03-10'::date, 'https://example.com/thumbnails/takasago_2023_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000016'::uuid, '20000000-0000-0000-0000-000000000008'::uuid, '高砂 本番 破', 'https://youtube.com/watch?v=takasago_2023_ha', '2023-03-10'::date, 'https://example.com/thumbnails/takasago_2023_ha.jpg', NOW(), NOW()),
-- 2025年度 高砂 稽古1回目の動画
('30000000-0000-0000-0000-000000000017'::uuid, '20000000-0000-0000-0000-000000000009'::uuid, '高砂 稽古1回目 序', 'https://youtube.com/watch?v=takasago_2025_keiko1_jo', '2025-01-15'::date, 'https://example.com/thumbnails/takasago_2025_keiko1_jo.jpg', NOW(), NOW()),
('30000000-0000-0000-0000-000000000018'::uuid, '20000000-0000-0000-0000-000000000009'::uuid, '高砂 稽古1回目 破', 'https://youtube.com/watch?v=takasago_2025_keiko1_ha', '2025-01-15'::date, 'https://example.com/thumbnails/takasago_2025_keiko1_ha.jpg', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- favorites テーブル（ユーザーのお気に入り動画）
-- 注意: user_idは01_user_seed.sqlで作成されたテストユーザーを参照しています
-- ON CONFLICT DO NOTHING: 既に同じ(user_id, video_id)の組み合わせが存在する場合はスキップ
-- 参照先のuser_idやvideo_idが存在しない場合は、外部キー制約によりエラーになりますが、
-- トランザクションでラップされているため、エラー時は全体がロールバックされます
INSERT INTO public.favorites (id, user_id, video_id, created_at, updated_at) VALUES
-- ユーザー1のお気に入り
('40000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000009'::uuid, NOW(), NOW()),
-- ユーザー2のお気に入り
('40000000-0000-0000-0000-000000000004'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000005'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000004'::uuid, NOW(), NOW()),
-- ユーザー3のお気に入り
('40000000-0000-0000-0000-000000000006'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, '30000000-0000-0000-0000-000000000013'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000007'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, '30000000-0000-0000-0000-000000000014'::uuid, NOW(), NOW()),
-- ユーザー4のお気に入り
('40000000-0000-0000-0000-000000000008'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, '30000000-0000-0000-0000-000000000015'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000009'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, '30000000-0000-0000-0000-000000000016'::uuid, NOW(), NOW()),
('40000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, '30000000-0000-0000-0000-000000000017'::uuid, NOW(), NOW())
ON CONFLICT (user_id, video_id) DO NOTHING;

COMMIT;

