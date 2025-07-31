# FRONT-SCREEN-002.2: フィルタリング・ソート機能実装

## 概要
練習表自動生成システムのフロントエンドにおいて、スケジュール表示のフィルタリングとソート機能を実装します。パート、会場、監督者、日付範囲などによる絞り込みと、様々な条件によるソート機能を提供し、ユーザーが必要な練習セッションを素早く見つけられるようにします。

## 詳細
- フィルタリングUIパネルの実装
- 複数条件の組み合わせによるフィルタリング機能
- リアルタイムフィルタリング処理の最適化
- ソート機能（日付、パート、会場、監督者など）
- フィルター設定の保存と読み込み機能

## 依存関係
- 親タスク: FRONT-SCREEN-002
- FRONT-SCREEN-002.1: カレンダー表示コンポーネント実装
- FRONT-ARCH-001: フロントエンドアーキテクチャ設計

## 参照ファイル
- [設計書/04_画面設計_2_スケジュール表示画面.md](../../../../設計書/04_画面設計_2_スケジュール表示画面.md)
- [設計書/06_UIコンポーネント仕様.md](../../../../設計書/06_UIコンポーネント仕様.md)

## 成果物
- フィルタリングパネルコンポーネント
- フィルタリングロジック実装
- ソート機能実装
- フィルター状態管理システム
- フィルター設定保存機能
- 単体テスト

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **フィルターパネル**
   - 折りたたみ可能なフィルターセクション
   - 複数選択可能なチェックボックス
   - 日付範囲選択
   - クイックフィルタープリセット
   - フィルタークリア機能

2. **パートフィルター**
   - パート別の選択UI
   - パートグループのツリー表示
   - パート階層による絞り込み
   - カラーコード表示

3. **会場・監督者フィルター**
   - 会場リストからの選択
   - 監督者リストからの選択
   - 検索機能付きドロップダウン
   - 複数選択とOR/AND条件切替

4. **ソート機能**
   - 複数条件によるソート
   - 昇順/降順切替
   - ドラッグ可能なソート優先順位
   - カスタムソート保存

5. **フィルター状態管理**
   - URLパラメータとの同期
   - ローカルストレージへの保存
   - ユーザー設定としての永続化
   - フィルター履歴管理

## 実装アプローチ
### コンポーネント構成
1. **親コンポーネント**
   - `ScheduleFilters`: フィルター全体のコンテナ
   - フィルター状態管理
   - フィルター適用ロジック
   - フィルター設定のシリアライズ/デシリアライズ

2. **子コンポーネント**
   - `PartFilter`: パートフィルタリング
   - `VenueFilter`: 会場フィルタリング
   - `SupervisorFilter`: 監督者フィルタリング
   - `DateRangeFilter`: 日付範囲フィルタリング
   - `SortControls`: ソートコントロール

3. **ユーティリティ**
   - `filterUtils`: フィルタリング関数
   - `sortUtils`: ソート関数
   - `serializationUtils`: フィルター設定の保存/読み込み

## 技術選定
- **UIライブラリ**: Material-UI Accordion, Checkbox, Select コンポーネント
- **日付ピッカー**: Material-UI DatePicker
- **状態管理**: React Context + useReducer または Redux Toolkit
- **URLパラメータ管理**: react-router query parameters または use-query-params
- **永続化**: localStorage および Supabase ユーザー設定

## 主要ファイル
- `src/components/schedule/ScheduleFilters.tsx` - メインフィルターコンポーネント
- `src/components/schedule/filters/PartFilter.tsx` - パートフィルター
- `src/components/schedule/filters/VenueFilter.tsx` - 会場フィルター
- `src/components/schedule/filters/SupervisorFilter.tsx` - 監督者フィルター
- `src/components/schedule/filters/DateRangeFilter.tsx` - 日付範囲フィルター
- `src/components/schedule/filters/SortControls.tsx` - ソートコントロール
- `src/hooks/useScheduleFilters.ts` - フィルターフック
- `src/utils/filterUtils.ts` - フィルタリングユーティリティ
- `src/utils/sortUtils.ts` - ソートユーティリティ
- `src/styles/filters.module.css` - フィルタースタイル 