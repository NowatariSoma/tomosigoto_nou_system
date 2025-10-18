# OR-Tools最適化エンジン 使用方法

## 概要

既存のml-engineを置き換えるOR-Toolsベースの最適化エンジンです。制約プログラミングを使用して、より高速で信頼性の高いスケジュール最適化を提供します。

## 起動方法

### 1. 新しいOR-Toolsエンジンのみ起動

```bash
# OR-Toolsエンジンのみ起動
docker-compose up ortools-engine

# バックグラウンドで起動
docker-compose up -d ortools-engine
```

### 2. 全システム起動（OR-Toolsエンジン使用）

```bash
# 全システム起動（OR-Toolsエンジンを使用）
docker-compose up

# バックグラウンドで起動
docker-compose up -d
```

### 3. レガシーシステム（強化学習）と併用

```bash
# レガシーシステムも含めて起動
docker-compose --profile legacy up

# バックグラウンドで起動
docker-compose --profile legacy up -d
```

## アクセス方法

### OR-Toolsエンジン
- **URL**: http://localhost:8002
- **API**: http://localhost:8002/api/v1/ml/
- **ヘルスチェック**: http://localhost:8002/api/v1/ml/health
- **API文書**: http://localhost:8002/docs

### レガシーML-Engine（プロファイル使用時）
- **URL**: http://localhost:8001
- **API**: http://localhost:8001/api/v1/ml/

## 環境変数

以下の環境変数でOR-Toolsエンジンの動作を調整できます：

```bash
# .envファイルに追加
DEBUG=false
LOG_LEVEL=INFO
MAX_ROOMS=10
MAX_SCENES=20
MAX_TIMESLOTS=4
MAX_PEOPLE=60
OPTIMIZATION_TIMEOUT=30
```

## API使用例

### スケジュール最適化

```bash
curl -X POST http://localhost:8002/api/v1/ml/predict/schedule-optimization \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_data": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "practice_days": ["monday", "wednesday", "friday"]
    },
    "members": [
      {
        "id": "member_1",
        "name": "田中太郎",
        "part": "シテ",
        "skill_level": "上級",
        "availability": ["monday", "wednesday"]
      }
    ],
    "venues": [
      {
        "id": "venue_1",
        "name": "大ホール",
        "capacity": 30,
        "available_times": ["09:00-12:00", "14:00-17:00"]
      }
    ]
  }'
```

### ヘルスチェック

```bash
curl http://localhost:8002/api/v1/ml/health
```

### モデル状態確認

```bash
curl http://localhost:8002/api/v1/ml/models/status
```

## 開発モード

開発時にソースコードの変更をリアルタイムで反映する場合：

```bash
# デバッグモードで起動
DEBUG=true docker-compose up ortools-engine
```

## ログ確認

```bash
# OR-Toolsエンジンのログを確認
docker-compose logs -f ortools-engine

# 特定の時間範囲のログ
docker-compose logs --since="2024-01-01T00:00:00" ortools-engine
```

## トラブルシューティング

### ポート競合

- OR-Toolsエンジン: ポート8002
- レガシーML-Engine: ポート8001
- バックエンド: ポート8000
- フロントエンド: ポート3000

### ヘルスチェック失敗

```bash
# コンテナの状態確認
docker-compose ps

# ログでエラー確認
docker-compose logs ortools-engine

# コンテナ内で直接確認
docker-compose exec ortools-engine curl http://localhost:8001/api/v1/ml/health
```

### 最適化タイムアウト

環境変数`OPTIMIZATION_TIMEOUT`を増やしてください：

```bash
OPTIMIZATION_TIMEOUT=60 docker-compose up ortools-engine
```

## パフォーマンス比較

| 項目 | レガシーML-Engine | OR-Toolsエンジン |
|------|------------------|------------------|
| 処理時間 | 数分〜数十分 | 2-5秒 |
| メモリ使用量 | 1-2GB | 50-100MB |
| 結果の一貫性 | 学習により変動 | 決定論的 |
| スケーラビリティ | 制限あり | 高 |

## 移行ガイド

### 1. 段階的移行

1. まずOR-Toolsエンジンでテスト
2. 既存システムと並行運用
3. 十分な検証後に完全移行

### 2. 設定変更

バックエンドの`ML_ENGINE_URL`を変更：

```bash
# 新しいOR-Toolsエンジンを使用
ML_ENGINE_URL=http://ortools-engine:8001

# レガシーシステムに戻す場合
ML_ENGINE_URL=http://ml-engine:8001
```

### 3. フロントエンド設定

フロントエンドの`NEXT_PUBLIC_ML_ENGINE_URL`を変更：

```bash
# 新しいOR-Toolsエンジンを使用
NEXT_PUBLIC_ML_ENGINE_URL=http://localhost:8002

# レガシーシステムに戻す場合
NEXT_PUBLIC_ML_ENGINE_URL=http://localhost:8001
```
