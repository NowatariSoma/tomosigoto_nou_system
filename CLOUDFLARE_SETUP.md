# Cloudflare Tunnelセットアップガイド

Cloudflare Tunnelを使用することで、サーバー側でポートを開放することなく、安全にアプリケーションを公開できます。

## セットアップ手順

### 1. Cloudflareアカウントの準備

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)にログイン
2. ドメイン`fullweak.com`がCloudflareに追加されていることを確認

### 2. Cloudflare Tunnelの作成

#### 方法1: Cloudflareダッシュボードから作成（推奨）

1. Cloudflareダッシュボードにログイン
2. 左メニューから「Zero Trust」→「Access」→「Tunnels」を選択
3. 「Create a tunnel」をクリック
4. トンネル名を入力（例: `tomosigoto-tunnel`）
5. 作成されたトークンをコピー

#### 方法2: CLIから作成

```bash
# Cloudflared CLIをインストール
brew install cloudflare/cloudflare/cloudflared  # macOS
# または
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb  # Ubuntu/Debian

# ログイン
cloudflared tunnel login

# トンネルを作成
cloudflared tunnel create tomosigoto-tunnel

# トークンを取得
cloudflared tunnel token tomosigoto-tunnel
```

### 3. トンネル設定

Cloudflareダッシュボードで、作成したトンネルの「Configure」をクリックし、以下の設定を追加：

**Public hostname設定:**
- Subdomain: `nou`
- Domain: `fullweak.com`
- Service Type: `HTTP`
- URL: `nginx:80`

### 4. 環境変数の設定

`.env.production`ファイルにトークンを設定：

```bash
# .env.productionを編集してCLOUDFLARE_TUNNEL_TOKENを設定
nano .env.production
# CLOUDFLARE_TUNNEL_TOKEN=your-actual-token-here
```

### 5. アプリケーションの起動

```bash
# 本番環境を起動
docker-compose -f docker-compose.prod.yml up -d

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f cloudflared
```

### 6. 動作確認

1. ブラウザで https://nou.fullweak.com にアクセス
2. アプリケーションが表示されることを確認

## トンネルの管理

### ステータス確認

Cloudflareダッシュボードの「Zero Trust」→「Access」→「Tunnels」でトンネルの状態を確認できます。

### ログの確認

```bash
# Cloudflaredコンテナのログ
docker-compose -f docker-compose.prod.yml logs cloudflared

# 全サービスのログ
docker-compose -f docker-compose.prod.yml logs
```

### トンネルの停止と起動

```bash
# 停止
docker-compose -f docker-compose.prod.yml down

# 起動
docker-compose -f docker-compose.prod.yml up -d
```

## セキュリティ設定（オプション）

### Cloudflare Access設定

特定のユーザーのみアクセスを許可する場合：

1. Cloudflareダッシュボード→「Zero Trust」→「Access」→「Applications」
2. 「Add an application」をクリック
3. 「Self-hosted」を選択
4. アプリケーション名とドメインを設定
5. アクセスポリシーを設定（例: メールアドレスベースの認証）

## トラブルシューティング

### トンネルが接続できない場合

1. トークンが正しいか確認
```bash
grep CLOUDFLARE_TUNNEL_TOKEN .env.production
```

2. コンテナのログを確認
```bash
docker-compose -f docker-compose.prod.yml logs cloudflared
```

3. ネットワーク接続を確認
```bash
docker-compose -f docker-compose.prod.yml exec cloudflared ping cloudflare.com
```

### アプリケーションにアクセスできない場合

1. Nginxが正常に動作しているか確認
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs nginx
```

2. Cloudflareダッシュボードでトンネルの設定を確認
   - Public hostnameが正しく設定されているか
   - Serviceが`nginx:80`に設定されているか

## 本番環境と開発環境の使い分け

```bash
# 開発環境（ローカル）
docker-compose up -d

# 本番環境（Cloudflare Tunnel経由）
docker-compose -f docker-compose.prod.yml up -d
```

## メリット

- **ポート開放不要**: ファイアウォールでポート80/443を開放する必要がない
- **DDoS対策**: CloudflareのDDoS対策が自動的に適用される
- **SSL/TLS**: Cloudflareが自動的にSSL証明書を管理
- **CDN**: Cloudflareの世界中のエッジサーバーを活用
- **アクセス制御**: Cloudflare Accessで細かいアクセス制御が可能