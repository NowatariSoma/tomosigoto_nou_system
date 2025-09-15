# ML-Engine Docker セットアップガイド

## 概要
ML-EngineをDockerで起動・管理するためのガイドです。

## 前提条件
- Docker
- Docker Compose
- プロジェクトルートの `.env` ファイル

## 起動方法

### 1. 全体サービス起動（推奨）
プロジェクトルートから実行：
```bash
# 全サービス（backend, frontend, ml-engine）を起動
docker-compose up -d

# ログを確認
docker-compose logs -f ml-engine
```

### 2. ML-Engine単体起動
```bash
# ML-Engineのみ起動
docker-compose up -d ml-engine

# ログを確認
docker-compose logs -f ml-engine
```

### 3. 開発モード起動
```bash
# 開発用設定で起動（ホットリロード有効）
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d ml-engine
```

## アクセス

### API エンドポイント
- **ML-Engine**: http://127.0.0.1:8001
- **API ドキュメント**: http://127.0.0.1:8001/docs
- **ヘルスチェック**: http://127.0.0.1:8001/health

### サービス間通信
- **バックエンド → ML-Engine**: http://ml-engine:8001
- **フロントエンド → バックエンド**: http://backend:8000

## 環境変数

### 必須環境変数
```bash
# .env ファイルに設定
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_anon_key
ENVIRONMENT=development
```

### ML-Engine固有の環境変数
```bash
# ML-Engine設定
ML_DEBUG=true
ML_LOG_LEVEL=DEBUG
PYTHONPATH=/app/src
```

## ボリュームマウント

### 永続化されるデータ
- `./ml-engine/models` → `/app/models` (学習済みモデル)
- `./ml-engine/outputs` → `/app/outputs` (生成されたファイル)
- `./ml-engine/logs` → `/app/logs` (ログファイル)
- `./ml-engine/result` → `/app/result` (結果ファイル)

### 開発時の追加マウント
- `./src` → `/app/src` (ソースコード)
- `./configs` → `/app/configs` (設定ファイル)
- `./scripts` → `/app/scripts` (スクリプト)

## よく使用するコマンド

### コンテナ管理
```bash
# サービス起動
docker-compose up -d

# サービス停止
docker-compose down

# サービス再起動
docker-compose restart ml-engine

# ログ確認
docker-compose logs -f ml-engine

# コンテナ内でシェル実行
docker-compose exec ml-engine bash
```

### 開発・デバッグ
```bash
# 開発モードで起動
docker-compose -f docker-compose.yml -f docker-compose.override.yml up ml-engine

# コンテナを再ビルド
docker-compose build ml-engine

# ボリュームも含めて完全リセット
docker-compose down -v
docker-compose up -d --build
```

### ログ・監視
```bash
# リアルタイムログ
docker-compose logs -f ml-engine

# 特定のログレベル
docker-compose logs --tail=100 ml-engine

# ヘルスチェック
curl http://127.0.0.1:8001/health
```

## トラブルシューティング

### よくある問題

#### 1. ポート競合
```bash
# ポート8001が使用中の場合
Error: bind: address already in use

# 解決方法
sudo lsof -i :8001
sudo kill -9 <PID>
```

#### 2. モデルファイルが見つからない
```bash
# モデルディレクトリの確認
ls -la ml-engine/models/

# 必要なディレクトリを作成
mkdir -p ml-engine/models/scene_based_system/best
```

#### 3. 権限エラー
```bash
# ファイル権限を修正
sudo chown -R $USER:$USER ml-engine/
chmod -R 755 ml-engine/
```

#### 4. メモリ不足
```bash
# Docker のメモリ制限を確認
docker stats ml-engine

# docker-compose.yml でメモリ制限を設定
deploy:
  resources:
    limits:
      memory: 4G
```

### ログの確認
```bash
# アプリケーションログ
docker-compose logs ml-engine

# システムログ
docker-compose exec ml-engine cat /var/log/syslog

# プロセス確認
docker-compose exec ml-engine ps aux
```

## 本番環境での注意点

### セキュリティ
- 環境変数に機密情報を含めない
- 不要なポートを公開しない
- 適切なネットワーク設定を行う

### パフォーマンス
- ワーカー数を適切に設定
- メモリ制限を設定
- ログローテーションを設定

### 監視
- ヘルスチェックを設定
- ログ監視を設定
- メトリクス収集を設定

## 参考リンク
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [FastAPI Docker設定](https://fastapi.tiangolo.com/deployment/docker/)
- [ML-Engine API ドキュメント](./API_ENDPOINTS.md)
