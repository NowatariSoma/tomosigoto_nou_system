# Supabase Seeds

このディレクトリには、開発環境用のサンプルデータ（seedデータ）が含まれています。

## ファイル構成

- `00_seed_all.sql` - すべてのseedファイルを正しい順序で実行するマスターファイル
- `01_venue_seed.sql` - 会場情報のサンプルデータ
- `02_user_seed.sql` - ユーザー関連のサンプルデータ（※現在未使用）
- `03_department_and_profiles_seed.sql` - 学部とユーザープロファイルのサンプルデータ
- `04_stage_and_parts_seed.sql` - 舞台（高砂、羽衣など）とパート情報
- `05_member_assignments_seed.sql` - メンバーのパート所属データ
- `06_practice_and_venue_seed.sql` - 練習スケジュール、会場管理データ
- `07_session_attendance_seed.sql` - セッションと出欠データ

## 実行方法

### 方法1: Supabase CLIを使用
```bash
# データベースをリセットしてseedを実行
supabase db reset

# seedのみ実行
supabase seed
```

### 方法2: PSQLを直接使用
```bash
# ローカルのSupabaseデータベースに接続してseedを実行
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/00_seed_all.sql
```

### 方法3: 個別のseedファイルを実行
```bash
# 特定のseedファイルのみ実行
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/04_stage_and_parts_seed.sql
```

## 注意事項

1. **auth.usersへの依存**
   - 一部のテーブル（user_profiles, session_instructors）はauth.usersテーブルのIDを参照します
   - これらのINSERT文はコメントアウトされています
   - 実際に使用する場合は、先にauth.usersにユーザーを作成してからコメントを解除してください

2. **テーブルの依存関係**
   - seedファイルは依存関係を考慮した順序で実行する必要があります
   - `00_seed_all.sql`を使用すると正しい順序で実行されます

3. **重複実行**
   - 同じseedファイルを複数回実行するとエラーになる可能性があります
   - 再実行する場合は`supabase db reset`でデータベースをリセットしてください

## データの内容

### 舞台データ
- 高砂（第50回定期公演）
- 羽衣（春季研究発表会）
- 紅葉狩（秋季公演）
- 鶴亀（新人発表会）
- 道成寺（冬季特別公演）

### 会場データ
- 今出川キャンパス（明徳館、弘風館）
- 田辺キャンパス（紫苑館ホール）
- 学外施設（京都能楽堂）

### その他
- 練習スケジュール
- 出欠管理データ
- 会場利用可能性ルール