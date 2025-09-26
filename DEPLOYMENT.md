# デプロイメントガイド

## 開発環境と本番環境の使い分け

### 開発環境
```bash
# 開発環境の起動
docker-compose up -d

# 開発環境の停止
docker-compose down
```

### 本番環境（Cloudflare Tunnel経由）
```bash
# 本番環境の起動
docker-compose -f docker-compose.prod.yml up -d

# 本番環境の停止
docker-compose -f docker-compose.prod.yml down
```

## 本番環境のセットアップ手順（Cloudflare Tunnel）

### 1. Cloudflare Tunnelの設定

詳細は[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)を参照してください。

### 2. 環境変数の設定

```bash
# .env.productionを編集してCloudflare Tunnel Tokenを設定
nano .env.production
# CLOUDFLARE_TUNNEL_TOKEN=your-actual-token-here
```

### 3. 本番環境の起動

```bash
# ビルドして起動
docker-compose -f docker-compose.prod.yml up -d --build

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. 動作確認

ブラウザで以下のURLにアクセス：
- https://

※Cloudflare Tunnelを使用するため、SSL証明書の手動取得は不要です。

## 環境変数について

- **開発環境**: `.env` ファイルを使用
- **本番環境**: `.env.production` ファイルを使用
- データベース（Supabase）は両環境で同じものを使用

## よく使うコマンド

### ログの確認
```bash
# 全サービスのログ
docker-compose -f docker-compose.prod.yml logs

# 特定サービスのログ
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### コンテナの再起動
```bash
# 全サービスを再起動
docker-compose -f docker-compose.prod.yml restart

# 特定のサービスを再起動
docker-compose -f docker-compose.prod.yml restart nginx
```

### イメージの再ビルド
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```


## トラブルシューティング

### Cloudflare Tunnelが接続できない場合
1. トークンが正しく設定されているか確認
2. Cloudflareダッシュボードでトンネルのステータスを確認
3. 詳細は[CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)のトラブルシューティングセクションを参照

### コンテナが起動しない場合
```bash
# エラーログを確認
docker-compose -f docker-compose.prod.yml logs

# コンテナの状態を確認
docker-compose -f docker-compose.prod.yml ps
```