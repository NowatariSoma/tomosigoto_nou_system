# トモシゴト能システム

## 使い方

### 1. 環境変数の設定
```bash
cp env.example .env
# .envファイルを適切に編集してください
```

### 2. Docker起動
```bash
docker-compose up -d
```

### 3. アクセス
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:8000
- API ドキュメント: http://localhost:8000/docs

### 4. Docker停止
```bash
docker-compose down
```

## トークンの取得方法
dockerを立ち上げた状態で
```
docker exec -it backend-backend-1 python tests/utils/get_test_token.py
```
をする。

したらtestユーザーでログインしたアクセストークンが生成されるため、それを使用する。
Swagger UIのAuthorizeとかで使用できる。