-- ====================================================================
-- セッション指導者シードデータ
-- ====================================================================
-- 対応マイグレーション: 20250822000014_create_practice_schedule_tables.sql
-- 注意: このファイルは他のseedファイルの実行後に実行してください
-- 依存関係: 01_user_seed.sql, 04_practice_schedules_seed.sql, 05_practice_user_attendance_seed.sql

-- セッション指導者データを挿入
DO $$
DECLARE
    -- 練習スケジュールID
    schedule_id_1 UUID;
    schedule_id_2 UUID;
    schedule_id_3 UUID;
    schedule_id_4 UUID;
    schedule_id_5 UUID;
    schedule_id_6 UUID;
    schedule_id_7 UUID;
    
    -- 出席レコードID（指導者として参加するユーザー）
    attendance_id_1 UUID;
    attendance_id_2 UUID;
    attendance_id_3 UUID;
    attendance_id_4 UUID;
    attendance_id_5 UUID;
    
    -- 利用可能会場ID
    venue_id_1 UUID;
    venue_id_2 UUID;
    venue_id_3 UUID;
BEGIN
    -- 練習スケジュールIDを取得（タイトルで特定）
    SELECT id INTO schedule_id_1 FROM practice_schedules WHERE title = '定期公演「高砂」第1回練習' LIMIT 1;
    SELECT id INTO schedule_id_2 FROM practice_schedules WHERE title = '定期公演「高砂」第2回練習' LIMIT 1;
    SELECT id INTO schedule_id_3 FROM practice_schedules WHERE title = '定期公演「高砂」総練習' LIMIT 1;
    SELECT id INTO schedule_id_4 FROM practice_schedules WHERE title = '定期公演「高砂」ゲネプロ' LIMIT 1;
    SELECT id INTO schedule_id_5 FROM practice_schedules WHERE title = '春季研究発表会「羽衣」第1回練習' LIMIT 1;
    SELECT id INTO schedule_id_6 FROM practice_schedules WHERE title = '春季研究発表会「羽衣」第2回練習' LIMIT 1;
    SELECT id INTO schedule_id_7 FROM practice_schedules WHERE title = '春季研究発表会「羽衣」総練習' LIMIT 1;
    
    -- 出席レコードIDを取得（指導者として参加するユーザーの出席レコード）
    -- 山田太郎（部長）の出席レコード
    SELECT pua.id INTO attendance_id_1 
    FROM practice_user_attendance pua
    JOIN users u ON pua.user_id = u.id
    WHERE u.name = '山田太郎' AND pua.schedule_id = schedule_id_1 AND pua.status = 'attending'
    LIMIT 1;
    
    -- 佐藤花子（副部長）の出席レコード
    SELECT pua.id INTO attendance_id_2 
    FROM practice_user_attendance pua
    JOIN users u ON pua.user_id = u.id
    WHERE u.name = '佐藤花子' AND pua.schedule_id = schedule_id_1 AND pua.status = 'attending'
    LIMIT 1;
    
    -- 田中次郎（経験者）の出席レコード
    SELECT pua.id INTO attendance_id_3 
    FROM practice_user_attendance pua
    JOIN users u ON pua.user_id = u.id
    WHERE u.name = '田中次郎' AND pua.schedule_id = schedule_id_2 AND pua.status = 'attending'
    LIMIT 1;
    
    -- 鈴木三郎（経験者）の出席レコード
    SELECT pua.id INTO attendance_id_4 
    FROM practice_user_attendance pua
    JOIN users u ON pua.user_id = u.id
    WHERE u.name = '鈴木三郎' AND pua.schedule_id = schedule_id_3 AND pua.status = 'attending'
    LIMIT 1;
    
    -- 高橋四郎（経験者）の出席レコード
    SELECT pua.id INTO attendance_id_5 
    FROM practice_user_attendance pua
    JOIN users u ON pua.user_id = u.id
    WHERE u.name = '高橋四郎' AND pua.schedule_id = schedule_id_4 AND pua.status = 'attending'
    LIMIT 1;
    
    -- 利用可能会場IDを取得
    SELECT sav.id INTO venue_id_1 
    FROM schedule_available_venues sav
    JOIN venues v ON sav.venue_id = v.id
    WHERE sav.schedule_id = schedule_id_1 AND v.code = 'IM-SS'
    LIMIT 1;
    
    SELECT sav.id INTO venue_id_2 
    FROM schedule_available_venues sav
    JOIN venues v ON sav.venue_id = v.id
    WHERE sav.schedule_id = schedule_id_2 AND v.code = 'TB-CT'
    LIMIT 1;
    
    SELECT sav.id INTO venue_id_3 
    FROM schedule_available_venues sav
    JOIN venues v ON sav.venue_id = v.id
    WHERE sav.schedule_id = schedule_id_3 AND v.code = 'IM-SS'
    LIMIT 1;
    
    -- セッション指導者データを挿入
    -- 定期公演「高砂」第1回練習
    IF attendance_id_1 IS NOT NULL AND schedule_id_1 IS NOT NULL THEN
        INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
        VALUES (attendance_id_1, schedule_id_1, venue_id_1, 1);
        
        RAISE NOTICE '山田太郎を定期公演「高砂」第1回練習の指導者として追加しました';
    END IF;
    
    IF attendance_id_2 IS NOT NULL AND schedule_id_1 IS NOT NULL THEN
        INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
        VALUES (attendance_id_2, schedule_id_1, venue_id_1, 2);
        
        RAISE NOTICE '佐藤花子を定期公演「高砂」第1回練習の指導者として追加しました';
    END IF;
    
    -- 定期公演「高砂」第2回練習
    IF attendance_id_3 IS NOT NULL AND schedule_id_2 IS NOT NULL THEN
        INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
        VALUES (attendance_id_3, schedule_id_2, venue_id_2, 1);
        
        RAISE NOTICE '田中次郎を定期公演「高砂」第2回練習の指導者として追加しました';
    END IF;
    
    -- 定期公演「高砂」総練習
    IF attendance_id_4 IS NOT NULL AND schedule_id_3 IS NOT NULL THEN
        INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
        VALUES (attendance_id_4, schedule_id_3, venue_id_3, 1);
        
        RAISE NOTICE '鈴木三郎を定期公演「高砂」総練習の指導者として追加しました';
    END IF;
    
    -- 定期公演「高砂」ゲネプロ
    IF attendance_id_5 IS NOT NULL AND schedule_id_4 IS NOT NULL THEN
        INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
        VALUES (attendance_id_5, schedule_id_4, venue_id_1, 1);
        
        RAISE NOTICE '高橋四郎を定期公演「高砂」ゲネプロの指導者として追加しました';
    END IF;
    
    -- 複数指導者のセッション例（春季研究発表会「羽衣」第1回練習）
    -- 山田太郎と佐藤花子が共同指導
    IF schedule_id_5 IS NOT NULL THEN
        -- 山田太郎の出席レコードを取得
        SELECT pua.id INTO attendance_id_1 
        FROM practice_user_attendance pua
        JOIN users u ON pua.user_id = u.id
        WHERE u.name = '山田太郎' AND pua.schedule_id = schedule_id_5 AND pua.status = 'attending'
        LIMIT 1;
        
        -- 佐藤花子の出席レコードを取得
        SELECT pua.id INTO attendance_id_2 
        FROM practice_user_attendance pua
        JOIN users u ON pua.user_id = u.id
        WHERE u.name = '佐藤花子' AND pua.schedule_id = schedule_id_5 AND pua.status = 'attending'
        LIMIT 1;
        
        -- 利用可能会場IDを取得
        SELECT sav.id INTO venue_id_1 
        FROM schedule_available_venues sav
        JOIN venues v ON sav.venue_id = v.id
        WHERE sav.schedule_id = schedule_id_5 AND v.code = 'IM-SS'
        LIMIT 1;
        
        IF attendance_id_1 IS NOT NULL THEN
            INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
            VALUES (attendance_id_1, schedule_id_5, venue_id_1, 1);
            
            RAISE NOTICE '山田太郎を春季研究発表会「羽衣」第1回練習の主指導者として追加しました';
        END IF;
        
        IF attendance_id_2 IS NOT NULL THEN
            INSERT INTO session_instructors (attendance_id, schedule_id, schedule_available_venue_id, slot_order)
            VALUES (attendance_id_2, schedule_id_5, venue_id_1, 2);
            
            RAISE NOTICE '佐藤花子を春季研究発表会「羽衣」第1回練習の副指導者として追加しました';
        END IF;
    END IF;
    
    RAISE NOTICE 'セッション指導者シードデータの挿入が完了しました';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'エラーが発生しました: %', SQLERRM;
        RAISE;
END $$;
