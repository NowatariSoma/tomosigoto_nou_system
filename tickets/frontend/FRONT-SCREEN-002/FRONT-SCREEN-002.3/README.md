# FRONT-SCREEN-002.3: 詳細表示・編集モーダル実装

## 概要
練習表自動生成システムのフロントエンドにおいて、練習セッションの詳細情報を表示・編集するためのモーダルコンポーネントを実装します。セッションの詳細情報、参加者リスト、監督者情報などを閲覧でき、権限に応じて編集できる機能を開発します。

## 詳細
- 練習セッション詳細表示モーダルの実装
- 練習内容の閲覧・編集機能
- 監督者情報の表示と変更リクエスト機能
- 変更履歴の表示機能
- コメント・通知機能の実装

## 依存関係
- 親タスク: FRONT-SCREEN-002
- FRONT-SCREEN-002.1: カレンダー表示コンポーネント実装
- FRONT-ARCH-001: フロントエンドアーキテクチャ設計
- BACK-API-001: 認証・認可システム実装

## 参照ファイル
- [設計書/04_画面設計_2_スケジュール表示画面.md](../../../../設計書/04_画面設計_2_スケジュール表示画面.md)
- [設計書/06_UIコンポーネント仕様.md](../../../../設計書/06_UIコンポーネント仕様.md)
- [設計書/05_API仕様.md](../../../../設計書/05_API仕様.md)

## 成果物
- 詳細表示モーダルコンポーネント
- 練習内容編集フォーム
- 監督者情報表示・変更コンポーネント
- 変更履歴表示機能
- コメント・通知コンポーネント
- 単体テスト

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **詳細情報表示**
   - セッション基本情報（日時、会場、パートなど）
   - 練習内容の詳細表示
   - 参加者リスト
   - 関連リソースへのリンク
   - ステータスインジケーター

2. **編集機能**
   - インライン編集機能
   - 権限に基づいた編集可能フィールド制御
   - フォーム検証とエラー表示
   - 変更の保存と取り消し
   - ロック機能（同時編集防止）

3. **監督者管理**
   - 現在の監督者情報表示
   - 監督変更リクエスト機能
   - 代替監督者の推薦
   - 監督確認ステータス表示
   - 監督者へのメッセージ送信

4. **変更履歴**
   - セッション情報の変更履歴
   - 変更者と変更日時の表示
   - 変更内容の差分表示
   - 変更理由の記録
   - 特定バージョンへの復元オプション

5. **コメント・通知**
   - セッションに対するコメント機能
   - @メンションによるユーザー通知
   - コメントスレッド表示
   - 通知設定管理
   - 未読/既読ステータス

## 実装アプローチ
### コンポーネント構成
1. **親コンポーネント**
   - `PracticeDetailsModal`: モーダル全体のコンテナ
   - タブナビゲーション管理
   - データフェッチングと保存
   - 権限チェック

2. **子コンポーネント**
   - `SessionInfoTab`: 基本情報タブ
   - `PracticeContentTab`: 練習内容タブ
   - `ParticipantsTab`: 参加者タブ
   - `SupervisorTab`: 監督者タブ
   - `HistoryTab`: 変更履歴タブ
   - `CommentsTab`: コメントタブ

3. **フォームコンポーネント**
   - `SessionEditForm`: セッション編集フォーム
   - `SupervisorChangeForm`: 監督変更フォーム
   - `CommentForm`: コメント投稿フォーム

## 技術選定
- **UIライブラリ**: Material-UI Dialog, Tabs, Form コンポーネント
- **フォーム管理**: React Hook Form または Formik
- **バリデーション**: Yup または Zod
- **状態管理**: React Context + useReducer
- **APIクライアント**: React Query または SWR

## 主要ファイル
- `src/components/schedule/PracticeDetailsModal.tsx` - メインモーダル
- `src/components/schedule/details/SessionInfoTab.tsx` - 基本情報タブ
- `src/components/schedule/details/PracticeContentTab.tsx` - 練習内容タブ
- `src/components/schedule/details/ParticipantsTab.tsx` - 参加者タブ
- `src/components/schedule/details/SupervisorTab.tsx` - 監督者タブ
- `src/components/schedule/details/HistoryTab.tsx` - 変更履歴タブ
- `src/components/schedule/details/CommentsTab.tsx` - コメントタブ
- `src/components/schedule/forms/SessionEditForm.tsx` - セッション編集フォーム
- `src/hooks/useSessionDetails.ts` - セッション詳細フック
- `src/hooks/useSessionMutation.ts` - セッション更新フック
- `src/styles/detailsModal.module.css` - モーダルスタイル 