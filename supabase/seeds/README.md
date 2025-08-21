# Supabase Seeds

このディレクトリには、開発環境用のサンプルデータ（seedデータ）が含まれています。

## ファイル構成

- `01_user_seed.sql` - ユーザー関連データ（auth.users, departments, user_profiles, user_roles）
- `02_stage_and_parts_seed.sql` - 舞台（高砂、羽衣など）とパート情報
- `03_practice_schedules_seed.sql` - 練習スケジュール関連データ（practice_schedules, schedule_available_venues）
- `04_venue_seed.sql` - 会場情報のサンプルデータ
- `05_member_assignments_seed.sql` - メンバーのパート所属データ
- `06_sessions_seed.sql` - セッション関連データ（sessions, session_instructors, session_attendances）

## 実行方法

### 方法1: Supabase CLIを使用
```bash
# データベースをリセットしてseedを実行
supabase db reset

# seedのみ実行
supabase seed
```

### 方法2: PSQLを直接使用して個別実行
```bash
# ローカルのSupabaseデータベースに接続して個別のseedファイルを実行
# 推奨実行順序:

# 1. ユーザー関連テーブル（auth.users, departments, user_profiles, user_roles）
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/01_user_seed.sql

# 2. 会場データ
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/04_venue_seed.sql

# 3. 舞台・パートデータ
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/02_stage_and_parts_seed.sql

# 4. 練習スケジュールデータ
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/03_practice_schedules_seed.sql

# 5. メンバー割り当てデータ
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/05_member_assignments_seed.sql

# 6. セッション関連データ（sessions, session_instructors, session_attendances）
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/06_sessions_seed.sql
```

### 方法3: 特定のseedファイルのみ実行
```bash
# 例: 舞台データのみ実行
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/02_stage_and_parts_seed.sql
```

## 注意事項

1. **auth.usersテーブルについて**
   - `01_user_seed.sql` にテスト用のauth.usersデータが含まれています
   - 本番環境では、Supabase AuthのUIまたはAPIを使用してユーザーを作成してください
   - 開発環境では、ダミーUUID（00000000-0000-0000-0000-000000000001など）がそのまま使用できます

2. **テーブルの依存関係**
   - seedファイルは以下の順序で実行してください:
   1. `01_user_seed.sql` （auth.users, departments, user_profiles, user_roles）
   2. `04_venue_seed.sql` （venues）
   3. `02_stage_and_parts_seed.sql` （stages, parts）
   4. `03_practice_schedules_seed.sql` （practice_schedules, schedule_available_venues）
   5. `05_member_assignments_seed.sql` （member_assignments）
   6. `06_sessions_seed.sql` （sessions, session_instructors, session_attendances）

3. **重複実行**
   - 同じseedファイルを複数回実行するとエラーになる可能性があります
   - 再実行する場合は`supabase db reset`でデータベースをリセットしてください

## データの内容

### 対応するマイグレーション
- `20250822000011_create_user_tables.sql` - ユーザー関連テーブル
- `20250822000012_create_stage_part_member_tables.sql` - 舞台・パート・メンバー所属テーブル
- `20250822000013_practice_schedule_table.sql` - 練習スケジュールテーブル
- `20250822000014_create_venue_tables.sql` - 会場テーブル
- `20250822000100_security_rls_policies.sql` - RLSセキュリティポリシー

### 舞台データ
- 高砂（第50回定期公演）- 2025年3月15日
- 羽衣（春季研究発表会）- 2025年5月20日
- 紅葉狩（秋季公演）- 2025年10月10日
- 鶴亀（新人発表会）- 2025年7月1日
- 道成寺（冬季特別公演）- 2025年12月20日（非アクティブ）

### 会場データ
- 今出川キャンパス（良心館、至誠館）
- 田辺キャンパス（知徳館、恵道館）
- オンライン会議室

### 学部データ
- 学部: 法学部、経済学部、商学部、文学部、社会学部等（13学部）
- 大学院: 法学研究科、経済学研究科等（7研究科）

### その他
- テストユーザー（15名、ダミーauth.usersデータ）
- ユーザープロフィール（学生ID、氏名、学部所属など）
- ユーザー役割（admin、instructor、part_leader、memberなど）
- 練習スケジュール（2025年2月〜5月、7件）
- メンバー割り当てデータ（各舞台の配役）
- セッションデータ（練習セッション、指導者割り当て、出欠管理）