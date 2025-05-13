# FRONT-SCREEN-002.4: 印刷・エクスポート機能実装

## 概要
練習表自動生成システムのフロントエンドにおいて、スケジュール情報を印刷やエクスポートするための機能を実装します。印刷に最適化されたレイアウト、PDF/Excel/iCalエクスポート、共有リンク生成など、スケジュール情報を様々な形式で出力・共有できる機能を開発します。

## 詳細
- 印刷用レイアウト最適化機能
- PDF出力機能の実装
- Excel/CSV出力機能の実装
- iCalendarフォーマットによるエクスポート機能
- 共有リンク生成とQRコード表示機能

## 依存関係
- 親タスク: FRONT-SCREEN-002
- FRONT-SCREEN-002.1: カレンダー表示コンポーネント実装
- FRONT-SCREEN-002.2: フィルタリング・ソート機能実装
- FRONT-ARCH-001: フロントエンドアーキテクチャ設計

## 参照ファイル
- [設計書/04_画面設計_2_スケジュール表示画面.md](../../../../設計書/04_画面設計_2_スケジュール表示画面.md)
- [設計書/06_UIコンポーネント仕様.md](../../../../設計書/06_UIコンポーネント仕様.md)
- [設計書/07_エクスポート仕様.md](../../../../設計書/07_エクスポート仕様.md)

## 成果物
- 印刷用レイアウトコンポーネント
- PDFエクスポート機能
- Excel/CSVエクスポート機能
- iCalendarエクスポート機能
- 共有リンク・QRコード生成機能
- 単体テスト

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **印刷最適化**
   - 印刷用CSSの実装
   - ページ分割と改ページ制御
   - ヘッダー・フッターの最適化
   - 印刷プレビュー機能
   - メディアクエリ対応

2. **PDFエクスポート**
   - PDFレンダリングエンジン統合
   - カスタムテンプレート選択
   - ヘッダー・フッターカスタマイズ
   - ファイル名・メタデータ設定
   - 解像度・品質オプション

3. **Excel/CSVエクスポート**
   - データのテーブル形式への変換
   - カスタム列選択機能
   - データ型の適切な保持
   - ヘッダーとフォーマット設定
   - 大量データの効率的処理

4. **iCalendarエクスポート**
   - iCalendar形式への変換
   - カレンダーイベント生成
   - アラーム・通知設定
   - Google/Outlook/Appleカレンダー連携
   - 更新・同期機能

5. **共有機能**
   - 共有用一時リンク生成
   - 権限設定（閲覧のみ/編集可能）
   - QRコード生成
   - メール共有機能
   - SNS共有ボタン

## 実装アプローチ
### コンポーネント構成
1. **親コンポーネント**
   - `ScheduleExport`: エクスポート機能のコンテナ
   - エクスポート形式選択UI
   - オプション設定パネル
   - エクスポート処理の実行管理
   - 結果のダウンロード・共有

2. **子コンポーネント**
   - `PrintLayout`: 印刷用レイアウト
   - `PdfExporter`: PDF出力コンポーネント
   - `ExcelExporter`: Excel出力コンポーネント
   - `ICalExporter`: iCalendar出力コンポーネント
   - `SharePanel`: 共有機能パネル

3. **ユーティリティ**
   - `printUtils`: 印刷機能ユーティリティ
   - `pdfGenerators`: PDF生成関数
   - `excelFormatters`: Excel/CSV変換関数
   - `iCalConverters`: iCal変換関数
   - `shareUtils`: 共有リンク生成関数

## 技術選定
- **PDF生成**: jsPDF または react-pdf
- **Excel生成**: xlsx または exceljs
- **iCal生成**: ical-generator
- **QRコード**: qrcode.react
- **印刷制御**: react-to-print
- **ファイル保存**: file-saver

## 主要ファイル
- `src/components/schedule/ScheduleExport.tsx` - メインエクスポートコンポーネント
- `src/components/schedule/export/PrintLayout.tsx` - 印刷用レイアウト
- `src/components/schedule/export/PdfExporter.tsx` - PDF出力コンポーネント
- `src/components/schedule/export/ExcelExporter.tsx` - Excel出力コンポーネント
- `src/components/schedule/export/ICalExporter.tsx` - iCal出力コンポーネント
- `src/components/schedule/export/SharePanel.tsx` - 共有パネル
- `src/utils/exportUtils.ts` - エクスポートユーティリティ
- `src/utils/printUtils.ts` - 印刷ユーティリティ
- `src/utils/pdfUtils.ts` - PDF生成ユーティリティ
- `src/styles/print.css` - 印刷用スタイル 