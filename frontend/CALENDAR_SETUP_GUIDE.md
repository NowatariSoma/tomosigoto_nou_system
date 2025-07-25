# カレンダーシステム セットアップガイド

## 概要

このガイドは、Issue #43「月間・週間カレンダービュー実装と日付範囲選択機能」の完了手順を説明します。

## 🎯 実装済み機能

### ✅ 完了済み
- 月間・週間カレンダービューの実装
- 日付範囲選択UIとナビゲーション
- 当日・選択日のハイライト表示
- 練習セッションの視覚的表示
- レスポンシブデザイン対応
- TDD方式による包括的なテストスイート
- API統合準備（フォールバック機能付き）
- アクセシビリティ対応（キーボードナビゲーション、スクリーンリーダー対応）

## 📋 残りのタスク完了手順

### 1. フロントエンド動作確認

#### 依存関係のインストール
```bash
cd frontend
npm install
```

これにより以下のJest関連依存関係がインストールされます：
- jest@^29.7.0
- jest-environment-jsdom@^29.7.0
- @testing-library/react@^14.0.0
- @testing-library/jest-dom@^6.1.4
- @testing-library/user-event@^14.5.1

#### テストの実行
```bash
# 全テスト実行
npm test

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジ付きテスト実行
npm run test:coverage
```

#### 開発サーバーでの動作確認
```bash
npm run dev
```

その後、`http://localhost:3000/calendar-test` にアクセスしてカレンダーの動作を確認。

### 2. APIエンドポイントとの結合テスト

#### 統合テストの実行
既に `scheduleApi.integration.test.ts` が作成済みです。

```bash
# 統合テストのみ実行
npm test -- scheduleApi.integration.test.ts
```

#### API統合の設定
`useCalendarData.ts` は既に実際のAPI呼び出しをサポートしています：

1. **環境変数の設定**
   ```bash
   # .env.local ファイルに追加
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   ```

2. **APIエンドポイントの実装**
   バックエンドで以下のエンドポイントを実装してください：
   - `GET /api/schedules/range` - 日付範囲でスケジュール取得
   - `POST /api/schedules` - スケジュール作成
   - `PUT /api/schedules/:id` - スケジュール更新
   - `DELETE /api/schedules/:id` - スケジュール削除
   - `GET /api/health` - ヘルスチェック

3. **フォールバック機能**
   API呼び出しが失敗した場合、自動的にモックデータにフォールバックします。

### 3. ユーザーインターフェースの最終確認

#### アクセシビリティチェック
- キーボードナビゲーション（←→ 移動、M/W ビュー切り替え、Home 今日へ移動）
- スクリーンリーダー対応（aria-label、role属性）
- フォーカス表示の確認

#### レスポンシブデザインチェック
- スマートフォン表示（320px〜）
- タブレット表示（768px〜）
- デスクトップ表示（1024px〜）

#### パフォーマンスチェック
```bash
npm run build
npm run start
```

## 🔧 設定ファイル

### Jest設定（jest.config.js）
- Next.js統合設定
- TypeScript対応
- パスマッピング設定
- カバレッジ設定

### テストセットアップ（jest.setup.js）
- @testing-library/jest-dom設定
- date-fns/localeモック
- IntersectionObserver/ResizeObserverモック

## 📁 ファイル構造

```
frontend/
├── src/features/schedule/
│   ├── components/
│   │   ├── MonthCalendar.tsx          # 月間カレンダー
│   │   ├── WeekCalendar.tsx           # 週間カレンダー
│   │   └── __tests__/                 # コンポーネントテスト
│   ├── hooks/
│   │   ├── useCalendarData.ts         # データ取得フック
│   │   └── __tests__/                 # フックテスト
│   ├── services/
│   │   ├── scheduleApi.ts             # API統合サービス
│   │   └── __tests__/                 # API統合テスト
│   ├── utils/
│   │   ├── dateUtils.ts               # 日付ユーティリティ
│   │   └── __tests__/                 # ユーティリティテスト
│   └── views/
│       ├── CalendarView.tsx           # メインビューコンポーネント
│       └── __tests__/                 # ビューテスト
├── app/calendar-test/
│   └── page.tsx                       # テストページ
├── types/
│   └── schedule.ts                    # 型定義
├── jest.config.js                     # Jest設定
├── jest.setup.js                      # テストセットアップ
└── package.json                       # 依存関係（Jest追加済み）
```

## 🚀 完了確認チェックリスト

### フロントエンド動作確認
- [ ] `npm install` でJest依存関係をインストール
- [ ] `npm test` で全テストが通過することを確認
- [ ] `npm run dev` で開発サーバーを起動
- [ ] `/calendar-test` ページでカレンダーが正しく表示されることを確認
- [ ] 月間/週間ビューの切り替えが動作することを確認
- [ ] キーボードナビゲーション（←→、M、W、Home）が動作することを確認

### APIエンドポイントとの結合テスト
- [ ] 環境変数 `NEXT_PUBLIC_API_BASE_URL` を設定
- [ ] バックエンドAPIサーバーを起動（利用可能な場合）
- [ ] `npm test -- scheduleApi.integration.test.ts` で統合テストを実行
- [ ] API呼び出し失敗時にモックデータにフォールバックすることを確認

### ユーザーインターフェースの改善
- [ ] スマートフォンでの表示を確認
- [ ] タブレットでの表示を確認
- [ ] デスクトップでの表示を確認
- [ ] アクセシビリティ機能（キーボードナビゲーション）を確認
- [ ] `npm run build` で本番ビルドが成功することを確認

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **依存関係の問題**: `rm -rf node_modules package-lock.json && npm install`
2. **型エラー**: TypeScriptの設定とパスマッピングを確認
3. **テスト失敗**: モックデータとAPI統合の設定を確認
4. **ビルド失敗**: Next.js設定とTailwind CSS設定を確認

## 🎉 完了後

全ての確認が完了したら、PRの説明にある3つのチェックボックスを更新してください：

- ✅ フロントエンド動作確認
- ✅ APIエンドポイントとの結合テスト
- ✅ ユーザーインターフェースの改善

これでIssue #43の実装が完全に完了します！