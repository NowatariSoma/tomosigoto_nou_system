# BACK-DB-001.4: 会場・設備管理テーブルの設計と実装

## 概要
練習表自動生成システムの会場および設備管理に関連するデータベーステーブルを設計・実装します。会場基本情報、収容人数、利用可能時間、設備情報、予約状態などのエンティティを定義します。

## 詳細
- 会場基本情報テーブルの設計と実装
- 収容人数と利用可能時間テーブルの設計と実装
- 設備情報テーブルの設計と実装
- 会場予約状態管理テーブルの設計と実装
- 会場利用履歴テーブルの設計と実装

## 依存関係
- 親タスク: BACK-DB-001

## 参照ファイル
- [設計書/10_データモデル_1_概要と主要エンティティ.md](../../../../設計書/10_データモデル_1_概要と主要エンティティ.md)
- [設計書/09_アルゴリズム詳細_1_スケジュール生成.md](../../../../設計書/09_アルゴリズム詳細_1_スケジュール生成.md)

## 成果物
- 会場・設備管理テーブル定義SQL
- ER図（該当部分）
- RLSポリシー定義
- 初期データスクリプト
- テーブル間制約定義

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要テーブル
1. **venues**
   - venue_id: UUID PRIMARY KEY
   - venue_name: TEXT NOT NULL
   - address: TEXT
   - description: TEXT
   - capacity: INTEGER
   - location_coordinates: POINT
   - contact_information: JSONB
   - is_active: BOOLEAN DEFAULT TRUE
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

2. **venue_availability**
   - availability_id: UUID PRIMARY KEY
   - venue_id: UUID REFERENCES venues(venue_id)
   - day_of_week: INTEGER NOT NULL
   - start_time: TIME NOT NULL
   - end_time: TIME NOT NULL
   - is_regular: BOOLEAN DEFAULT TRUE
   - notes: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

3. **venue_special_dates**
   - special_date_id: UUID PRIMARY KEY
   - venue_id: UUID REFERENCES venues(venue_id)
   - date: DATE NOT NULL
   - is_available: BOOLEAN NOT NULL
   - start_time: TIME
   - end_time: TIME
   - reason: TEXT
   - created_by: UUID REFERENCES member_profiles(member_id)
   - created_at: TIMESTAMP

4. **equipment**
   - equipment_id: UUID PRIMARY KEY
   - equipment_name: TEXT NOT NULL
   - equipment_type: TEXT NOT NULL
   - description: TEXT
   - quantity: INTEGER NOT NULL
   - status: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

5. **venue_equipment**
   - venue_equipment_id: UUID PRIMARY KEY
   - venue_id: UUID REFERENCES venues(venue_id)
   - equipment_id: UUID REFERENCES equipment(equipment_id)
   - quantity: INTEGER NOT NULL
   - is_permanent: BOOLEAN DEFAULT TRUE
   - notes: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

6. **venue_bookings**
   - booking_id: UUID PRIMARY KEY
   - venue_id: UUID REFERENCES venues(venue_id)
   - booking_date: DATE NOT NULL
   - start_time: TIME NOT NULL
   - end_time: TIME NOT NULL
   - purpose: TEXT
   - booked_by: UUID REFERENCES member_profiles(member_id)
   - status: TEXT NOT NULL
   - external_reference: TEXT
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

7. **venue_usage_history**
   - usage_id: UUID PRIMARY KEY
   - venue_id: UUID REFERENCES venues(venue_id)
   - session_id: UUID REFERENCES practice_sessions(session_id)
   - usage_date: DATE NOT NULL
   - start_time: TIME NOT NULL
   - end_time: TIME NOT NULL
   - part_id: INTEGER REFERENCES parts(part_id)
   - participant_count: INTEGER
   - notes: TEXT
   - created_at: TIMESTAMP

## RLSポリシー
1. **venues テーブル**
   - すべてのログインユーザーが読み取り可能
   - 管理者のみが作成・編集・削除可能

2. **venue_availability, venue_special_dates テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成担当者と管理者のみが作成・編集可能
   - 管理者のみが削除可能

3. **equipment, venue_equipment テーブル**
   - すべてのログインユーザーが読み取り可能
   - 管理者のみが作成・編集・削除可能

4. **venue_bookings テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成担当者と管理者のみが作成・編集可能
   - 管理者のみが削除可能

5. **venue_usage_history テーブル**
   - すべてのログインユーザーが読み取り可能
   - システムのみが作成可能（自動記録）
   - 管理者のみが編集・削除可能

## 主要ファイル
- `migrations/012_venues.sql` - 会場基本情報テーブル定義
- `migrations/013_venue_availability.sql` - 会場利用可能時間テーブル定義
- `migrations/014_equipment.sql` - 設備と会場設備テーブル定義
- `migrations/015_venue_bookings.sql` - 会場予約テーブル定義
- `migrations/016_venue_usage_history.sql` - 会場利用履歴テーブル定義
- `rls/004_venues_policies.sql` - RLSポリシー定義
- `seed/004_default_venues.sql` - デフォルト会場の初期データ
- `seed/005_default_equipment.sql` - デフォルト設備の初期データ 