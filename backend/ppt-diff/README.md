# PowerPoint Diff API

GitHub風のPowerPoint比較APIサーバーです。2つのPowerPointファイルをアップロードして、詳細な差分を取得できます。

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. サーバーの起動

```bash
python run.py
```

サーバーが起動すると、以下のURLでアクセスできます：
- **API サーバー**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs
- **ヘルスチェック**: http://localhost:8000/api/v1/health

## 🐳 Docker での起動

```bash
# Docker Compose を使用
docker-compose up --build

# または Docker を直接使用
docker build -t ppt-diff-api .
docker run -p 8000:8000 ppt-diff-api
```

## 📡 API エンドポイント

### PowerPoint ファイル比較

```bash
POST /api/v1/compare
```

**パラメータ:**
- `file1`: 比較元のPowerPointファイル (.pptx)
- `file2`: 比較先のPowerPointファイル (.pptx)  
- `comparison_name`: 比較の名前 (オプション)

**レスポンス例:**
```json
{
  "comparison_id": "uuid-string",
  "file1": {
    "filename": "presentation_v1.pptx",
    "size": 1024000,
    "content_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  },
  "file2": {
    "filename": "presentation_v2.pptx", 
    "size": 1056000,
    "content_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  },
  "total_changes": 5,
  "slides": [
    {
      "slide_number": 1,
      "title": "Welcome Slide",
      "has_changes": true,
      "change_count": 2,
      "changes": [
        {
          "type": "text",
          "change_type": "modified",
          "old_value": "Version 1.0",
          "new_value": "Version 1.1", 
          "description": "Text content changed"
        }
      ]
    }
  ],
  "summary": {
    "added": 1,
    "removed": 0,
    "modified": 4
  },
  "processing_time": 1.23
}
```

### サポートされている形式の確認

```bash
GET /api/v1/formats
```

### ヘルスチェック

```bash
GET /api/v1/health
GET /api/v1/health/detailed
```

## 🧪 テスト

### cURL を使用したテスト

```bash
# ヘルスチェック
curl http://localhost:8000/api/v1/health

# ファイル比較
curl -X POST "http://localhost:8000/api/v1/compare" \
  -F "file1=@presentation_v1.pptx" \
  -F "file2=@presentation_v2.pptx" \
  -F "comparison_name=My Comparison"
```

### Python を使用したテスト

```python
import requests

# ファイル比較
with open('presentation_v1.pptx', 'rb') as f1, open('presentation_v2.pptx', 'rb') as f2:
    files = {
        'file1': f1,
        'file2': f2
    }
    data = {
        'comparison_name': 'API Test'
    }
    
    response = requests.post('http://localhost:8000/api/v1/compare', files=files, data=data)
    result = response.json()
    print(f"Found {result['total_changes']} changes")
```

## ⚙️ 設定

環境変数または `.env` ファイルで設定を変更できます：

```bash
# サーバー設定
HOST=0.0.0.0
PORT=8000
DEBUG=true

# ファイルアップロード設定
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR=/tmp/ppt_uploads
FILE_RETENTION_HOURS=24

# CORS設定
ALLOWED_HOSTS=*
```

## 🏗️ プロジェクト構造

```
backend/ppt-diff/
├── app/
│   ├── api/           # API エンドポイント
│   ├── core/          # 設定とコア機能
│   ├── schemas/       # Pydantic スキーマ
│   ├── models/        # データモデル (将来用)
│   └── utils/         # ユーティリティ
├── tests/             # テストファイル
├── requirements.txt   # Python依存関係
├── Dockerfile        # Docker設定
├── docker-compose.yml # Docker Compose設定
└── run.py            # サーバー起動スクリプト
```

## 🔧 開発

### 開発環境のセットアップ

```bash
# 仮想環境の作成
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows

# 依存関係のインストール
pip install -r requirements.txt

# 開発サーバーの起動 (ホットリロード有効)
python run.py
```

### 既存のPowerPointエンジンとの統合

このAPIは、親プロジェクトの `src/` ディレクトリにある既存のPowerPoint処理エンジンを使用します：

- `src/pptx_extractor.py` - PowerPointファイルの解析
- `src/diff.py` - 差分の生成

## 📚 次のステップ

1. **フロントエンド開発**: React/Next.js でGitHub風のUIを構築
2. **データベース統合**: PostgreSQL でファイル履歴とコメントを保存
3. **認証機能**: ユーザー管理とアクセス制御
4. **リアルタイム機能**: WebSocket でリアルタイム更新
5. **キャッシュ機能**: Redis で処理結果をキャッシュ

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します！ 