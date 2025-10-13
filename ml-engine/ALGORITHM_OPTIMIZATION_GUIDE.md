# アルゴリズムベース最適化ガイド

機械学習の代替として、従来のアルゴリズムベースの最適化を実装しました。

## 概要

機械学習モデルが利用できない場合や、より軽量な最適化が必要な場合に、以下のアルゴリズムを使用できます：

1. **貪欲法（Greedy Algorithm）** - デフォルト
2. **遺伝的アルゴリズム（Genetic Algorithm）** - より高度な最適化

## 設定方法

### 1. 設定ファイルでの変更

`ml-engine/app/core/config.py`で設定を変更：

```python
OPTIMIZATION: Dict[str, Any] = {
    "use_algorithm_fallback": True,  # 機械学習が失敗した場合のアルゴリズム代替
    "algorithm_type": "greedy",      # greedy または genetic
    "max_iterations": 1000,
    "timeout_seconds": 30
}
```

### 2. API経由での変更

#### 現在の設定を確認
```bash
curl http://localhost:8001/api/v1/ml/optimization/config
```

#### アルゴリズムを変更
```bash
# 貪欲法に変更
curl -X POST http://localhost:8001/api/v1/ml/optimization/config \
  -H "Content-Type: application/json" \
  -d '{"algorithm_type": "greedy"}'

# 遺伝的アルゴリズムに変更
curl -X POST http://localhost:8001/api/v1/ml/optimization/config \
  -H "Content-Type: application/json" \
  -d '{"algorithm_type": "genetic"}'
```

## アルゴリズムの詳細

### 1. 貪欲法（Greedy Algorithm）

**特徴：**
- 高速で軽量
- メンバーの優先度順にスケジュールを割り当て
- 各ステップで最適な選択を行う

**適用場面：**
- リアルタイム最適化が必要
- 計算リソースが限られている
- シンプルな最適化で十分

**パフォーマンス：**
- 実行時間: O(n²) （n = メンバー数）
- メモリ使用量: 低

### 2. 遺伝的アルゴリズム（Genetic Algorithm）

**特徴：**
- より高度な最適化
- 複数の解を並行して探索
- 局所最適解を回避しやすい

**適用場面：**
- 複雑な制約条件がある
- より良い解を求めたい
- 計算時間に余裕がある

**パラメータ：**
- 集団サイズ: 50
- 世代数: 100
- 突然変異率: 0.1

**パフォーマンス：**
- 実行時間: O(g × p × n) （g = 世代数, p = 集団サイズ, n = メンバー数）
- メモリ使用量: 中程度

## 制約条件

両方のアルゴリズムで以下の制約を考慮：

1. **時間重複制約**: 同じ時間帯に複数のセッションは不可
2. **会場重複制約**: 同じ会場に複数のセッションは不可
3. **メンバー制約**: メンバーの参加可能時間
4. **会場容量制約**: 会場の収容人数

## スコアリング

### 基本スコア
- セッション数 × 10点
- 完了率 × 50点

### ペナルティ
- 時間重複: -20点
- 会場重複: -20点

### ボーナス
- メンバー優先度: 優先度 × 10点
- 会場優先度: 会場優先度 × 5点
- 時間帯優先度: 午前 +10点、午後 +5点

## 使用例

### 基本的な使用方法

```python
# バックエンドから呼び出し
from app.services.ml_integration_service import MLIntegrationService

ml_service = MLIntegrationService()

# スケジュール最適化を実行
result = await ml_service.optimize_schedule(
    schedule_id=schedule_id,
    schedule_data=schedule_data,
    members=members,
    venues=venues,
    constraints=constraints
)
```

### フロントエンドからの呼び出し

```typescript
// スケジュール最適化APIを呼び出し
const response = await fetch('/api/v1/schedules/optimize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    schedule_id: 'your-schedule-id'
  })
});

const result = await response.json();
```

## トラブルシューティング

### よくある問題

1. **最適化結果が空**
   - 制約条件が厳しすぎる可能性
   - メンバー数と会場数のバランスを確認

2. **実行時間が長い**
   - 遺伝的アルゴリズムの世代数を減らす
   - 貪欲法に切り替える

3. **メモリ不足**
   - 遺伝的アルゴリズムの集団サイズを減らす
   - 貪欲法に切り替える

### デバッグ方法

1. **ログの確認**
   ```bash
   # ML-Engineのログを確認
   docker logs ml-engine
   ```

2. **設定の確認**
   ```bash
   curl http://localhost:8001/api/v1/ml/optimization/config
   ```

3. **ヘルスチェック**
   ```bash
   curl http://localhost:8001/api/v1/ml/health
   ```

## パフォーマンス比較

| アルゴリズム | 実行時間 | メモリ使用量 | 解の品質 | 適用場面 |
|-------------|----------|-------------|----------|----------|
| 貪欲法 | 高速 | 低 | 中程度 | リアルタイム |
| 遺伝的 | 中程度 | 中程度 | 高 | バッチ処理 |

## 今後の拡張

1. **シミulated Annealing（焼きなまし法）**の追加
2. **制約プログラミング**の統合
3. **並列処理**の最適化
4. **動的パラメータ調整**の実装

## 注意事項

- アルゴリズムベースの最適化は機械学習ほど柔軟ではありません
- 複雑な制約条件には遺伝的アルゴリズムが適しています
- リアルタイム性を重視する場合は貪欲法を推奨します
- 本番環境では十分なテストを行ってください
