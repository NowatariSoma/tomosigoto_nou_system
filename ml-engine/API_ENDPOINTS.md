# ML-Engine API エンドポイント一覧

## 概要
練習表自動生成システム用のML-Engine（ポート8001）のAPIエンドポイント一覧です。

## ベースURL
```
http://127.0.0.1:8001/api/v1/ml
```

## エンドポイント一覧

### 1. スケジュール最適化（メイン機能）
**POST** `/predict/schedule-optimization`

練習表の自動生成を行うメイン機能です。

#### リクエスト
```json
{
  "schedule_data": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "practice_days": ["monday", "wednesday", "friday"]
  },
  "members": [
    {
      "id": "member_1",
      "name": "田中太郎",
      "part": "謡",
      "skill_level": "上級",
      "availability": ["monday", "wednesday"]
    }
  ],
  "venues": [
    {
      "id": "venue_1",
      "name": "練習場A",
      "capacity": 20,
      "available_times": ["09:00-12:00", "14:00-17:00"]
    }
  ],
  "constraints": {
    "max_practice_hours_per_week": 10,
    "min_members_per_session": 3
  }
}
```

#### レスポンス
```json
{
  "optimized_schedule": {
    "sessions": [
      {
        "date": "2024-01-01",
        "time": "09:00-12:00",
        "venue": "練習場A",
        "members": ["member_1", "member_2"],
        "part": "謡"
      }
    ]
  },
  "reward": 0.85,
  "assignments": {
    "member_1": ["session_1", "session_3"],
    "member_2": ["session_1", "session_2"]
  },
  "processing_time": 2.5,
  "model_version": "latest"
}
```

### 2. モデル状態確認
**GET** `/models/status`

システムの稼働状況を確認します。

#### レスポンス
```json
{
  "model_name": "scene_based_system",
  "version": "latest",
  "status": "loaded",
  "last_updated": "2024-01-15T10:30:00Z",
  "performance_metrics": {
    "model_loaded": true,
    "environment_ready": true,
    "trainer_ready": true
  }
}
```

### 3. ヘルスチェック
**GET** `/health`

サービス稼働状況の確認です。

#### レスポンス
```json
{
  "status": "healthy",
  "service": "ml-engine",
  "port": 8001,
  "endpoints": [
    "POST /api/v1/ml/predict/schedule-optimization",
    "GET /api/v1/ml/models/status",
    "GET /api/v1/ml/health"
  ]
}
```

## エラーレスポンス

### エラー形式
```json
{
  "error": "エラーメッセージ",
  "details": {
    "additional_info": "詳細情報"
  }
}
```

### ステータスコード
- `200`: 成功
- `400`: リクエストエラー
- `500`: サーバーエラー

## 使用例

### cURLでのアクセス例

#### スケジュール最適化
```bash
curl -X POST http://127.0.0.1:8001/api/v1/ml/predict/schedule-optimization \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_data": {"start_date": "2024-01-01", "end_date": "2024-01-31"},
    "members": [{"id": "member_1", "name": "田中太郎", "part": "謡"}],
    "venues": [{"id": "venue_1", "name": "練習場A", "capacity": 20}]
  }'
```

#### モデル状態確認
```bash
curl http://127.0.0.1:8001/api/v1/ml/models/status
```

#### ヘルスチェック
```bash
curl http://127.0.0.1:8001/api/v1/ml/health
```

## 注意事項

1. **認証**: 現在は認証なしでアクセス可能
2. **レート制限**: 現在は制限なし
3. **タイムアウト**: デフォルト30秒
4. **データ形式**: JSON形式のみ対応
5. **文字エンコーディング**: UTF-8

## 開発・テスト用

### API ドキュメント
- Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc: `http://127.0.0.1:8001/redoc`

### ローカル起動
```bash
cd ml-engine
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
