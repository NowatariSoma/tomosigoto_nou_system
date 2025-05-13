# BACK-DB-001.3: スケジュール管理テーブルの設計と実装

## 概要
練習表自動生成システムのスケジュール管理に関連するデータベーステーブルを設計・実装します。練習スケジュールのバージョン管理、練習セッション情報、監督者割り当て、スケジュール公開状態などのエンティティを定義します。

## 詳細
- スケジュールバージョン管理テーブルの設計と実装
- 練習セッション情報テーブルの設計と実装
- 監督者割り当て情報テーブルの設計と実装
- スケジュール公開状態管理テーブルの設計と実装
- セッション参加者管理テーブルの設計と実装

## 依存関係
- 親タスク: BACK-DB-001
- BACK-DB-001.1: ユーザー・メンバー管理テーブルの設計と実装
- BACK-DB-001.2: パート・練習内容テーブルの設計と実装

## 参照ファイル
- [設計書/10_データモデル_1_概要と主要エンティティ.md](../../../../設計書/10_データモデル_1_概要と主要エンティティ.md)
- [設計書/09_アルゴリズム詳細_1_スケジュール生成.md](../../../../設計書/09_アルゴリズム詳細_1_スケジュール生成.md)

## 成果物
- スケジュール管理テーブル定義SQL
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
1. **schedule_plans**
   - plan_id: UUID PRIMARY KEY
   - plan_name: TEXT NOT NULL
   - description: TEXT
   - start_date: DATE NOT NULL
   - end_date: DATE NOT NULL
   - created_by: UUID REFERENCES member_profiles(member_id)
   - is_active: BOOLEAN DEFAULT TRUE
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

2. **schedule_versions**
   - version_id: UUID PRIMARY KEY
   - plan_id: UUID REFERENCES schedule_plans(plan_id)
   - version_number: INTEGER NOT NULL
   - version_name: TEXT
   - status: TEXT NOT NULL
   - generated_by: UUID REFERENCES member_profiles(member_id)
   - generation_method: TEXT
   - algorithm_parameters: JSONB
   - creation_date: TIMESTAMP
   - published_date: TIMESTAMP
   - notes: TEXT

3. **practice_sessions**
   - session_id: UUID PRIMARY KEY
   - version_id: UUID REFERENCES schedule_versions(version_id)
   - session_date: DATE NOT NULL
   - start_time: TIME NOT NULL
   - end_time: TIME NOT NULL
   - part_id: INTEGER REFERENCES parts(part_id)
   - venue_id: UUID REFERENCES venues(venue_id)
   - template_id: UUID REFERENCES practice_templates(template_id)
   - custom_content: TEXT
   - status: TEXT NOT NULL
   - min_participants: INTEGER
   - max_participants: INTEGER
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

4. **session_supervisors**
   - supervisor_assignment_id: UUID PRIMARY KEY
   - session_id: UUID REFERENCES practice_sessions(session_id)
   - member_id: UUID REFERENCES member_profiles(member_id)
   - assignment_type: TEXT
   - assigned_by: UUID REFERENCES member_profiles(member_id)
   - assigned_at: TIMESTAMP
   - status: TEXT
   - notes: TEXT

5. **session_participants**
   - participant_id: UUID PRIMARY KEY
   - session_id: UUID REFERENCES practice_sessions(session_id)
   - member_id: UUID REFERENCES member_profiles(member_id)
   - attendance_status: TEXT
   - registration_time: TIMESTAMP
   - feedback: TEXT
   - notes: TEXT

6. **schedule_publications**
   - publication_id: UUID PRIMARY KEY
   - version_id: UUID REFERENCES schedule_versions(version_id)
   - publication_type: TEXT NOT NULL
   - published_by: UUID REFERENCES member_profiles(member_id)
   - published_at: TIMESTAMP
   - recipients: JSONB
   - message: TEXT
   - publication_url: TEXT
   - status: TEXT

## RLSポリシー
1. **schedule_plans, schedule_versions テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成担当者と管理者のみが作成・編集可能
   - 管理者のみが削除可能

2. **practice_sessions テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成担当者と管理者のみが作成・編集可能
   - 管理者のみが削除可能

3. **session_supervisors テーブル**
   - すべてのログインユーザーが読み取り可能
   - 部長と管理者のみが作成・編集可能
   - 管理者のみが削除可能

4. **session_participants テーブル**
   - すべてのログインユーザーが読み取り可能
   - ユーザー自身の参加登録のみ編集可能
   - 部長と管理者は全員分を編集可能
   - 管理者のみが削除可能

5. **schedule_publications テーブル**
   - すべてのログインユーザーが読み取り可能
   - 作成担当者と管理者のみが作成・編集可能
   - 管理者のみが削除可能

## 主要ファイル
- `migrations/008_schedule_plans_versions.sql` - スケジュール計画とバージョン管理テーブル定義
- `migrations/009_practice_sessions.sql` - 練習セッションテーブル定義
- `migrations/010_supervisors_participants.sql` - 監督者と参加者テーブル定義
- `migrations/011_schedule_publications.sql` - スケジュール公開管理テーブル定義
- `rls/003_schedule_policies.sql` - RLSポリシー定義
- `functions/generate_session_participants.sql` - セッション参加者自動生成関数 