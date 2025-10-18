# OR-Tools最適化エンジン

## 概要

能の練習表作成システム用のOR-Toolsベース最適化エンジンです。強化学習ベースのml-engineを置き換え、制約プログラミングと線形最適化を使用して効率的なスケジュール生成を行います。

## 特徴

- **高速最適化**: 決定論的アルゴリズムによる高速処理
- **制約の明確化**: 場面割り当ての制約を明確に定義
- **API互換性**: 既存のAPIインターフェースを維持
- **スケーラビリティ**: 大規模なスケジューリング問題に対応

## 技術スタック

- **Python 3.8+**
- **OR-Tools**: Googleの最適化ライブラリ
- **FastAPI**: REST API フレームワーク
- **Pydantic**: データバリデーション

## プロジェクト構成

```
ortools-engine/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーション
│   ├── models/                 # データモデル
│   │   ├── __init__.py
│   │   ├── schedule.py         # スケジュール関連モデル
│   │   └── optimization.py     # 最適化関連モデル
│   ├── services/               # ビジネスロジック
│   │   ├── __init__.py
│   │   ├── optimizer.py        # OR-Tools最適化エンジン
│   │   └── validator.py        # 制約検証
│   └── utils/                  # ユーティリティ
│       ├── __init__.py
│       └── helpers.py
├── config/                     # 設定ファイル
│   ├── __init__.py
│   └── settings.py
├── tests/                      # テスト
│   ├── __init__.py
│   ├── test_optimizer.py
│   └── test_api.py
├── requirements.txt            # 依存パッケージ
├── Dockerfile                  # Docker設定
└── README.md
```

## 最適化アルゴリズム

### 制約プログラミング (CP-SAT)

場面の割り当て問題を制約プログラミングとして定式化：

1. **変数定義**
   - `x[scene, room, timeslot]`: 場面を部屋・時間帯に割り当てるかどうか

2. **制約**
   - 各場面は必ず1つの部屋・時間帯に割り当てられる
   - 各部屋・時間帯には最大1つの場面
   - 部屋の容量制約
   - 場面の優先度制約

3. **目標関数**
   - 場面の優先度の最大化
   - 部屋利用率の最大化
   - 時間効率の最大化

## API エンドポイント

既存のml-engineと互換性のあるAPIを提供：

- `POST /api/v1/ml/predict/schedule-optimization`: スケジュール最適化
- `GET /api/v1/ml/models/status`: モデル状態確認
- `GET /api/v1/ml/health`: ヘルスチェック

## 使用方法

### ローカル実行

```bash
# 依存関係のインストール
pip install -r requirements.txt

# サーバー起動
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Docker実行

```bash
# イメージビルド
docker build -t ortools-engine .

# コンテナ実行
docker run -p 8001:8001 ortools-engine
```

## 設定

環境変数または設定ファイルで以下の項目を設定可能：

- `MAX_ROOMS`: 最大部屋数 (デフォルト: 10)
- `MAX_SCENES`: 最大場面数 (デフォルト: 20)
- `MAX_TIMESLOTS`: 最大時間帯数 (デフォルト: 4)
- `OPTIMIZATION_TIMEOUT`: 最適化タイムアウト (秒) (デフォルト: 30)

## パフォーマンス

- **処理時間**: 平均2-5秒（20場面、8部屋、4時間帯）
- **メモリ使用量**: 約50-100MB
- **スケーラビリティ**: 最大50場面、20部屋まで対応

## 開発

### テスト実行

```bash
pytest tests/
```

### コードフォーマット

```bash
black app/
isort app/
```

### 型チェック

```bash
mypy app/
```
