# OR-Tools最適化モジュール

練習スケジュールの自動最適化機能を提供するモジュールです。

## 概要

このモジュールは、Google OR-Toolsを使用して練習スケジュールの最適化を行います。制約条件を満たしながら、指導者の負荷を均等に分散し、プレイヤーの重複を最小化するスケジュールを自動生成します。

## アーキテクチャ

```
optimization/
├── __init__.py          # モジュール初期化
├── models.py            # データモデル定義
├── optimizer.py         # 最適化エンジン
├── constraints.py       # 制約条件定義
├── objectives.py        # 目的関数定義
├── constants.py         # 定数定義
├── adapters.py          # DB ↔ OR-Tools変換
└── README.md           # このファイル
```

## 主要コンポーネント

### 1. データモデル (`models.py`)

- **SchedulingProblem**: 最適化問題の全体設定
- **Player**: プレイヤー（指導者・一般メンバー）
- **Room**: 練習室
- **TimeSlot**: 時間コマ
- **PartType**: パートの種類（A-I）
- **PracticeSession**: 練習セッション
- **SchedulingSolution**: 最適化結果

### 2. 最適化エンジン (`optimizer.py`)

- **SchedulingOptimizer**: メインの最適化クラス
- 制約条件の設定
- 目的関数の設定
- ソルバーの実行
- 解の抽出

### 3. 制約条件 (`constraints.py`)

- **SchedulingConstraints**: 制約条件管理クラス
- 基本制約（各パートは1日1回、各部屋は各時間1セッション）
- 指導者制約（同時指導不可）
- 均等割り振り制約

### 4. 目的関数 (`objectives.py`)

- **SchedulingObjectives**: 目的関数管理クラス
- 均等割り振り（指導者の負荷分散）
- プレイヤー制約違反ペナルティ（重複最小化）

### 5. データアダプター (`adapters.py`)

- **SchedulingDataAdapter**: DB ↔ OR-Tools変換
- `db_to_scheduling_problem()`: DBデータ → OR-Tools形式
- `solution_to_db_sessions()`: OR-Tools解 → DBセッション形式
- データ検証機能

## 使用方法

### 基本的な使用例

```python
from app.optimization.optimizer import SchedulingOptimizer, create_sample_problem

# サンプル問題を作成
problem = create_sample_problem()

# 最適化を実行
optimizer = SchedulingOptimizer(problem)
solution = optimizer.solve(time_limit_seconds=60)

if solution:
    print(f"セッション数: {len(solution.sessions)}")
    print(f"目的関数値: {solution.objective_value}")
    print(f"最適解: {solution.is_optimal}")
```

### サービス層での使用

```python
from app.services.scheduling_optimization_service import SchedulingOptimizationService

# サービスインスタンスの作成（依存性注入）
service = SchedulingOptimizationService(...)

# スケジュール最適化
result = await service.optimize_schedule(
    schedule_id=schedule_id,
    optimization_params={
        "time_limit_seconds": 60,
        "equality_weight": 100
    }
)
```

## 制約条件

### 基本制約

1. **パート制約**: 各パートは1日に1回だけ練習する
2. **部屋制約**: 各部屋は各時間コマに最大1つのセッション
3. **指導者制約**: 指導者は同時に複数のパートを指導できない

### 最適化目標

1. **均等割り振り**: 指導者のセッション数を均等に分散
2. **重複最小化**: プレイヤーの重複参加を最小化（個人別優先度考慮）

## パラメータ

### 最適化パラメータ

- `time_limit_seconds`: 時間制限（デフォルト: 30秒）
- `equality_weight`: 均等性重み（デフォルト: 100）
- `allow_overlap`: 重複許可（デフォルト: False）
- `max_iterations`: 最大反復回数（デフォルト: 1000）
- `solution_limit`: 解の上限（デフォルト: 10）

### プレイヤー優先度

- `overlap_priority`: 個人の重複優先度（0-100）
  - 0: 制限なし
  - 50: 中程度（デフォルト）
  - 100: 厳格

## エラーハンドリング

### 主要なエラー

- `NO_SOLUTION_FOUND`: 解が見つからない
- `INVALID_SCHEDULE_ID`: 無効なスケジュールID
- `SCHEDULE_NOT_FOUND`: スケジュールが見つからない
- `OPTIMIZATION_FAILED`: 最適化処理失敗
- `INSUFFICIENT_DATA`: データ不足
- `CONSTRAINT_VIOLATION`: 制約条件違反

### 対処法

1. **解が見つからない場合**
   - 制約条件を緩和
   - 時間制限を延長
   - パラメータを調整

2. **データ不足の場合**
   - 必要なデータが揃っているか確認
   - スケジュール、会場、パート、ユーザー、割り当てデータの存在確認

## テスト

```bash
# ユニットテストの実行
pytest backend/tests/test_scheduling_optimization.py -v

# カバレッジ付きテスト
pytest backend/tests/test_scheduling_optimization.py --cov=app.optimization
```

## パフォーマンス

### 推奨設定

- **小規模** (5-10パート): time_limit_seconds=30
- **中規模** (10-20パート): time_limit_seconds=60
- **大規模** (20+パート): time_limit_seconds=120

### 最適化のヒント

1. 制約条件を必要最小限に設定
2. 適切な時間制限を設定
3. データの整合性を事前に確認
4. 定期的にパラメータを調整

## 将来の拡張

- バックグラウンドジョブ対応
- より高度な制約条件
- 機械学習によるパラメータ自動調整
- リアルタイム最適化
- 複数日スケジュール対応
