# BACK-DB-001.5: 欠席管理テーブルの設計と実装

## 概要
練習表自動生成システムの欠席管理に関連するデータベーステーブルを設計・実装します。欠席申請情報、申請状態管理、承認履歴、影響分析データなどのエンティティを定義します。

## 詳細
- 欠席申請情報テーブルの設計と実装
- 申請状態管理テーブルの設計と実装
- 承認履歴テーブルの設計と実装
- 影響分析データテーブルの設計と実装
- 欠席パターン分析テーブルの設計と実装

## 依存関係
- 親タスク: BACK-DB-001
- BACK-DB-001.1: ユーザー・メンバー管理テーブルの設計と実装
- BACK-DB-001.3: スケジュール管理テーブルの設計と実装

## 参照ファイル
- [設計書/10_データモデル_1_概要と主要エンティティ.md](../../../../設計書/10_データモデル_1_概要と主要エンティティ.md)
- [設計書/10_データモデル_2_アクセス制御と監査.md](../../../../設計書/10_データモデル_2_アクセス制御と監査.md)

## 成果物
- 欠席管理テーブル定義SQL
- ER図（該当部分）
- RLSポリシー定義
- 承認ワークフロー設定
- テーブル間制約定義

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要テーブル
1. **absence_requests**
   - request_id: UUID PRIMARY KEY
   - member_id: UUID REFERENCES member_profiles(member_id)
   - request_date: DATE NOT NULL
   - absence_type: TEXT NOT NULL
   - start_date: DATE NOT NULL
   - end_date: DATE NOT NULL
   - reason: TEXT
   - status: TEXT NOT NULL
   - submitted_at: TIMESTAMP NOT NULL
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP

2. **absence_sessions**
   - absence_session_id: UUID PRIMARY KEY
   - request_id: UUID REFERENCES absence_requests(request_id)
   - session_id: UUID REFERENCES practice_sessions(session_id)
   - impact_level: TEXT
   - notes: TEXT
   - created_at: TIMESTAMP

3. **absence_approvals**
   - approval_id: UUID PRIMARY KEY
   - request_id: UUID REFERENCES absence_requests(request_id)
   - approved_by: UUID REFERENCES member_profiles(member_id)
   - approval_status: TEXT NOT NULL
   - approval_date: TIMESTAMP
   - comments: TEXT
   - created_at: TIMESTAMP

4. **absence_impacts**
   - impact_id: UUID PRIMARY KEY
   - request_id: UUID REFERENCES absence_requests(request_id)
   - session_id: UUID REFERENCES practice_sessions(session_id)
   - impact_type: TEXT NOT NULL
   - impact_details: JSONB
   - calculated_at: TIMESTAMP
   - created_at: TIMESTAMP

5. **absence_patterns**
   - pattern_id: UUID PRIMARY KEY
   - member_id: UUID REFERENCES member_profiles(member_id)
   - pattern_type: TEXT NOT NULL
   - frequency: INTEGER
   - average_duration: INTERVAL
   - common_reason: TEXT
   - first_detected: DATE
   - last_updated: DATE
   - confidence_score: DECIMAL
   - notes: TEXT

6. **absence_notifications**
   - notification_id: UUID PRIMARY KEY
   - request_id: UUID REFERENCES absence_requests(request_id)
   - notification_type: TEXT NOT NULL
   - recipient_id: UUID REFERENCES member_profiles(member_id)
   - sent_at: TIMESTAMP
   - read_at: TIMESTAMP
   - content: TEXT
   - status: TEXT

## RLSポリシー
1. **absence_requests テーブル**
   - メンバーは自分の欠席申請のみ読み取り・作成可能
   - 部長は自分のパートのメンバーの欠席申請を読み取り可能
   - 作成担当者と管理者はすべての欠席申請を読み取り可能
   - 管理者のみが削除可能

2. **absence_sessions テーブル**
   - メンバーは自分の欠席セッションのみ読み取り可能
   - 部長は自分のパートのメンバーの欠席セッションを読み取り可能
   - 作成担当者と管理者はすべての欠席セッションを読み取り可能
   - システムのみが作成・編集可能（自動生成）
   - 管理者のみが削除可能

3. **absence_approvals テーブル**
   - メンバーは自分の欠席申請に関する承認を読み取り可能
   - 部長は自分のパートのメンバーの承認を読み取り・作成可能
   - 管理者はすべての承認を読み取り・作成・編集可能
   - 管理者のみが削除可能

4. **absence_impacts, absence_patterns テーブル**
   - 部長と作成担当者は読み取り可能
   - 管理者は読み取り・編集可能
   - システムのみが作成可能（自動生成）
   - 管理者のみが削除可能

5. **absence_notifications テーブル**
   - メンバーは自分宛の通知のみ読み取り可能
   - システムのみが作成可能（自動生成）
   - 管理者のみが編集・削除可能

## 主要ファイル
- `migrations/017_absence_requests.sql` - 欠席申請テーブル定義
- `migrations/018_absence_sessions.sql` - 欠席セッションテーブル定義
- `migrations/019_absence_approvals.sql` - 欠席承認テーブル定義
- `migrations/020_absence_impacts.sql` - 欠席影響分析テーブル定義
- `migrations/021_absence_patterns.sql` - 欠席パターン分析テーブル定義
- `migrations/022_absence_notifications.sql` - 欠席通知テーブル定義
- `rls/005_absence_policies.sql` - RLSポリシー定義
- `functions/calculate_absence_impact.sql` - 欠席影響計算関数
- `functions/detect_absence_patterns.sql` - 欠席パターン検出関数 