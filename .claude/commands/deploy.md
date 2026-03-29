本番環境へのデプロイを実行する。以下の手順を順番に実行すること。

## 手順

### 1. mainブランチに切り替え・最新化
```bash
git checkout main
git pull
```
ローカルに未コミットの変更がある場合は `git stash` してからpullする。

### 2. 本番Dockerイメージをビルド
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache
```
ビルドが正常に完了したことを確認する。

### 3. コンテナを起動
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

### 4. 起動確認
以下を確認する:
- `docker compose -f docker-compose.prod.yml ps` で全コンテナが起動していること
- `docker compose -f docker-compose.prod.yml logs --tail=20` でエラーがないこと
- backendのヘルスチェック (`/health`) が200を返していること

### 5. Cloudflareトンネル確認
```bash
sudo systemctl status cloudflared
```
active (running) であることを確認する。

## 停止・ログ確認
```bash
# 停止
docker compose -f docker-compose.prod.yml down

# ログ確認
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 構成
- nginx (172.23.0.4:80) - リバースプロキシ
- backend (172.23.0.2:8000) - FastAPI
- frontend (172.23.0.3:3000) - Next.js
- cloudflared - システムサービスとして稼働（Docker外）

トラフィック経路: Cloudflareトンネル → nginx → frontend/backend
