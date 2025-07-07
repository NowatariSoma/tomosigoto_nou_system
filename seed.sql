-- サイトデータ
insert into public.m_sites (site_name) values
('製造ライン A'),
('倉庫エリア B'),
('製造ライン C'),
('屋外資材置き場');

-- カメラデータ
insert into public.m_cameras (camera_name, site_id) values
('CAM-12', 1),
('CAM-05', 2),
('CAM-08', 3),
('CAM-22', 4),
('CAM-11', 1);

-- イベントカテゴリ
insert into public.m_event_categories (category_name) values
('不安全行動'),
('不安全状態');

-- イベント詳細
insert into public.m_event_details (detail_name, category_id) values
('安全帯未装着の高所作業', 1),
('通路の障害物放置', 2),
('保護メガネ未着用の切削作業', 1),
('不安定な資材の積み上げ', 2),
('安全カバー未装着の機械操作', 1);

-- 画像データ
insert into public.t_images (camera_id, file_url, captured_at, created_at) values
(1, 'https://example.com/images/event1.jpg', '2025-01-15 14:23:00+09', '2025-01-15 14:23:00+09'),
(2, 'https://example.com/images/event2.jpg', '2025-01-15 10:47:00+09', '2025-01-15 10:47:00+09'),
(3, 'https://example.com/images/event3.jpg', '2025-01-14 09:32:00+09', '2025-01-14 09:32:00+09'),
(4, 'https://example.com/images/event4.jpg', '2025-01-14 16:05:00+09', '2025-01-14 16:05:00+09'),
(5, 'https://example.com/images/event5.jpg', '2025-01-13 11:12:00+09', '2025-01-13 11:12:00+09');

-- 検出オブジェクト
insert into public.t_detected_objects (image_id, confidence, bounding_box) values
(1, 0.95, null),
(2, 0.88, null),
(3, 0.92, null),
(4, 0.97, null),
(5, 0.90, null);

-- 安全イベント
insert into public.t_safety_events (event_time, severity, description, resolved, event_detail_id, detected_object_id) values
('2025-01-15 14:23:00+09', 3, '作業者が安全帯を装着せずに高所作業を実施', false, 1, 1),
('2025-01-15 10:47:00+09', 2, '通路に障害物が放置されている', false, 2, 2),
('2025-01-14 09:32:00+09', 2, '作業者が保護メガネを着用せずに切削作業を実施', true, 3, 3),
('2025-01-14 16:05:00+09', 3, '積み上げられた資材が不安定な状態で放置', false, 4, 4),
('2025-01-13 11:12:00+09', 3, '機械の安全カバーを外した状態での操作', true, 5, 5);
