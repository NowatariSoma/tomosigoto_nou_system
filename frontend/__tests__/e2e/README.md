# スケジュールカレンダー E2Eテスト

## 概要

このディレクトリには、スケジュールカレンダーの日付表示機能をテストするE2Eテストが含まれています。

## テストの目的

カレンダーで日付をクリックした時に表示されるボトムシートの日付が、クリックした日付と正確に一致することを確認します。

## テストファイル

- `schedule-calendar.spec.ts` - 完全版テスト（すべてのシナリオ）
- `schedule-calendar-simple.spec.ts` - 簡略版テスト（基本機能のみ）

## セットアップ

### 1. Playwrightブラウザをインストール

```bash
npx playwright install chromium
```

### 2. 開発サーバーを起動

別のターミナルで：

```bash
npm run dev
```

サーバーが `http://localhost:3000` で起動していることを確認してください。

### 3. 認証について

テストは自動的にログインします。認証情報は環境変数から読み込まれます（`e2e/auth.setup.ts` を参照）。

テスト実行前に、以下の環境変数を設定してください：

```bash
export E2E_USER_EMAIL="<テスト用ユーザーのメールアドレス>"
export E2E_USER_PASSWORD="<テスト用ユーザーのパスワード>"
```

`frontend/.env.local` に記載しておくこともできます（このファイルはGit管理対象外です）：

```env
E2E_USER_EMAIL=<テスト用ユーザーのメールアドレス>
E2E_USER_PASSWORD=<テスト用ユーザーのパスワード>
```

初回実行時に自動的にログインし、認証状態を `__tests__/.auth/user.json` に保存します。
このファイルはセッショントークンを含むため、Git管理対象外（`.gitignore` の `**/.auth/`）です。

## テストの実行方法

### 簡略版テスト（推奨 - 最も速い）

```bash
npm run test:e2e:simple
```

### 完全版テスト

```bash
npm run test:e2e
```

### UIモードでテスト（デバッグ用）

```bash
npm run test:e2e:ui
```

UIモードでは、テストの実行を視覚的に確認できます。

## テストシナリオ

### 簡略版テスト

1. カレンダーで12日をクリック → ボトムシートに12日が表示される
2. ボトムシートで翌日ボタン → 13日に変わる
3. ボトムシートで前日ボタン → 11日に変わる

### 完全版テスト

1. カレンダーで日付をクリックすると、正しい日付のボトムシートが表示される
2. ボトムシートで翌日ボタンをクリックすると、13日に移動する
3. ボトムシートで前日ボタンをクリックすると、11日に移動する
4. 月末の日付から翌日に移動すると、翌月1日になる
5. 直接URLで日付を指定すると、正しい日付のボトムシートが表示される
6. カレンダーの異なる日付をクリックすると、それぞれ正しい日付が表示される

## トラブルシューティング

### エラー: `browserType.launch: Executable doesn't exist`

Playwrightブラウザがインストールされていません：

```bash
npx playwright install chromium
```

### エラー: `page.goto: net::ERR_CONNECTION_REFUSED`

開発サーバーが起動していません：

```bash
npm run dev
```

### テストが失敗する場合

1. スクリーンショットを確認：`playwright-report/` ディレクトリ
2. トレースを確認：`npx playwright show-trace trace.zip`
3. UIモードでデバッグ：`npm run test:e2e:ui`

## 期待される結果

すべてのテストが通過すれば、カレンダーとボトムシートの日付が正しく一致しています。

テストが失敗する場合は、`formatDateToYYYYMMDD`関数の使用箇所を確認してください：

- `frontend/features/schedule/components/view/month/month-view.tsx:124, 131`
- `frontend/features/schedule/components/bottom-sheet-schedule.tsx:50, 58`
