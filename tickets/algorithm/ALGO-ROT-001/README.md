# ALGO-ROT-001: 監督者ローテーション基本アルゴリズム

## 概要
練習表自動生成システムにおける監督者の公平なローテーションを実現するアルゴリズムを実装します。練習セッションごとに適切な監督者を割り当て、負荷の均等化と練習の質の確保を両立させます。

## 詳細
- 監督者資格要件の検証機能実装
- 監督者の基本割り当てアルゴリズム開発
- ルールベースの制約（連続担当回避など）の実装
- 監督負荷の計算と均等化機能の実装
- ローテーション最適化の性能チューニング

## 依存関係
- BACK-DB-001.1: ユーザー・メンバー管理テーブルの設計と実装
- BACK-DB-001.2: パート・練習内容テーブルの設計と実装
- BACK-DB-001.3: スケジュール管理テーブルの設計と実装

## 参照ファイル
- [設計書/09_アルゴリズム詳細_2_ローテーション最適化_1.md](../../設計書/09_アルゴリズム詳細_2_ローテーション最適化_1.md)

## 成果物
- ローテーションアルゴリズム実装コード
- テストケース
- ローテーション品質評価指標
- ユーザーガイド

## ステータス
- [ ] 未開始
- [ ] 進行中
- [ ] レビュー中
- [ ] 完了

## 担当者
未割り当て

## 主要機能
1. **監督者資格検証**
   - 資格要件の定義と検証
   - パートと監督者の適合性評価
   - 必要なスキルと経験の確認
   - 資格情報の維持管理

2. **基本割り当てアルゴリズム**
   - 初期割り当てロジック
   - パート別の監督者候補者リスト生成
   - 優先順位付けと選定ロジック
   - 手動割り当てとの統合

3. **ルールベース制約**
   - 連続監督の回避ルール
   - パート間のバランスルール
   - 特殊条件（特定曜日など）の考慮
   - カスタム制約の適用

4. **監督負荷計算**
   - 監督セッション数のカウント
   - パートごとの負荷係数の適用
   - 時間帯による負荷調整
   - 長期的な負荷均等化

## 主要ファイル
### アルゴリズム実装
- `src/algorithm/rotation/supervisorValidator.ts` - 監督者資格検証
- `src/algorithm/rotation/baseRotationEngine.ts` - 基本ローテーションエンジン
- `src/algorithm/rotation/rotationRuleEnforcer.ts` - ルール適用処理
- `src/algorithm/rotation/loadCalculator.ts` - 負荷計算ロジック

### テスト
- `tests/unit/algorithm/rotation/supervisorValidator.test.ts` - 資格検証テスト
- `tests/integration/algorithm/rotation/rotationIntegration.test.ts` - 統合テスト
- `tests/performance/rotation/rotationPerformance.test.ts` - 性能テスト

### ドキュメント
- `docs/algorithm/rotation_overview.md` - アルゴリズム概要
- `docs/algorithm/supervisor_rules.md` - 監督者ルール説明
- `docs/algorithm/fairness_metrics.md` - 公平性指標の定義 