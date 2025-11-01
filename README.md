# トモシゴト能システム

## 使い方

### 1. 環境変数の設定
```bash
cp env.example .env
# .envファイルを適切に編集してください
```

### 2. Docker起動
```bash
docker compose up -d
```

### 3. アクセス
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

### 4. Docker停止
```bash
docker compose down
```
### 5. 本番環境

#### 1. 本番環境でのビルド
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache
```

#### 2. 本番環境での起動
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```
#### 3. 本番環境での停止
```bash
docker compose -f docker-compose.prod.yml down
```
#### 4. 本番環境でのログ確認
```bash
docker compose -f docker-compose.prod.yml logs -f
```
#### 5. 本番環境での特定サービスのログ確認
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend