# BACK-API-001.3: Row Level Security (RLS)ポリシー設定

## 概要
練習表自動生成システムのデータベースセキュリティを強化するため、各テーブルに対するRow Level Security (RLS)ポリシーを設計・実装します。ユーザーの役割やアクセス権限に基づいて、データの読み取り・編集・削除を制御します。

## 詳細
- 各テーブルのRLSポリシー設計
- 役割（ロール）ベースのアクセス制御実装
- セキュリティ監査ログ設定
- 権限分離の実装
- RLSポリシーのテストと検証

## 依存関係
- 親タスク: BACK-API-001
- BACK-DB-001: データベース設計と実装（すべてのサブタスク）
- BACK-API-001.1: Supabase Auth設定と実装

## 参照ファイル
- [設計書/07_権限・ロール設計.md](../../../../設計書/07_権限・ロール設計.md)
- [設計書/10_データモデル_2_アクセス制御と監査.md](../../../../設計書/10_データモデル_2_アクセス制御と監査.md)
- [設計書/11g_実装指針_バックエンド.md](../../../../設計書/11g_実装指針_バックエンド.md)

## 成果物
- RLSポリシー定義スクリプト
- セキュリティテスト計画と結果
- ポリシー設計ドキュメント
- エラーハンドリング仕様
- 監査ログ設定

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **RLSポリシー設計**
   - テーブルごとのセキュリティ要件分析
   - 役割別アクセス権限マトリクス作成
   - 読み取り/書き込み/削除ポリシーの定義
   - 行フィルタリング条件の設計

2. **役割ベースのアクセス制御**
   - 権限階層の実装
   - JWT内のロール情報の活用
   - 部門/パート内のアクセス制限
   - 動的権限割り当て

3. **監査ログ設定**
   - データ変更の記録
   - セキュリティイベントのログ記録
   - ログレベルとフィルタリング
   - ログの保持と消去ポリシー

4. **権限分離の実装**
   - 職責による権限分離
   - 最小権限の原則の適用
   - 特権アクセスの制限と監視
   - 時間制限付き権限昇格

## テーブル別RLSポリシー
1. **ユーザー・メンバー管理テーブル**
   - `users`: 自身と管理者のみアクセス可能
   - `member_profiles`: 全ユーザー読み取り可、自身と管理者のみ編集可能
   - `roles`, `member_roles`: 読み取りは全員、編集は管理者のみ
   - `supervisor_qualifications`: 読み取りは全員、編集は部長と管理者のみ

2. **パート・練習内容テーブル**
   - `parts`, `part_equipment_needs`: 読み取りは全員、編集は管理者のみ
   - `member_parts`: 読み取りは全員、編集は部長と管理者のみ
   - `practice_templates`: 読み取りは全員、編集は作成者/部長/管理者
   - `template_dependencies`, `part_relationships`: 読み取りは全員、編集は管理者のみ

3. **スケジュール管理テーブル**
   - `schedule_plans`, `schedule_versions`: 読み取りは全員、編集は作成担当者と管理者
   - `practice_sessions`: 読み取りは全員、編集は作成担当者と管理者
   - `session_supervisors`: 読み取りは全員、編集は部長と管理者
   - `session_participants`: 読み取りは全員、自身の参加登録のみ編集可能

4. **会場・設備管理テーブル**
   - `venues`, `equipment`: 読み取りは全員、編集は管理者のみ
   - `venue_availability`, `venue_special_dates`: 読み取りは全員、編集は作成担当者と管理者
   - `venue_bookings`: 読み取りは全員、編集は作成担当者と管理者
   - `venue_usage_history`: 読み取りは全員、システムのみ作成可能

5. **欠席管理テーブル**
   - `absence_requests`: 自分の申請のみ作成・読み取り可能、部長は部内の申請を読み取り可能
   - `absence_approvals`: 自分の申請の承認を読み取り可能、部長は作成可能
   - `absence_impacts`, `absence_patterns`: 部長と作成担当者は読み取り可能

## 主要ファイル
- `migrations/rls/001_users_members_policies.sql` - ユーザー・メンバー管理RLSポリシー
- `migrations/rls/002_parts_templates_policies.sql` - パート・練習内容RLSポリシー
- `migrations/rls/003_schedule_policies.sql` - スケジュール管理RLSポリシー
- `migrations/rls/004_venues_policies.sql` - 会場・設備管理RLSポリシー
- `migrations/rls/005_absence_policies.sql` - 欠席管理RLSポリシー
- `tests/security/rls_tests.sql` - RLSポリシーテスト
- `docs/security/rls_policy_design.md` - ポリシー設計ドキュメント 