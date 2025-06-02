# Twenty CRM Docker セットアップガイド

このリポジトリには、Twenty CRMをすぐに起動できるDocker Compose設定が含まれています。

## 必要条件

- Docker と Docker Compose がインストールされていること
- 空いているポート: 3002, 3003, 8001, 5434

## クイックスタート

### 1. 環境の起動

```bash
# Makefileを使用する場合
make -f Makefile.twenty clean

# または手動で以下の手順を実行
docker-compose build
docker-compose up -d
sleep 10  # データベースの起動を待つ
docker-compose exec twenty-server yarn prisma:migrate
docker-compose exec twenty-server yarn prisma:seed
```

### 2. アプリケーションへのアクセス

- フロントエンド: http://localhost:3002
- バックエンドAPI: http://localhost:3003/graphql
- ドキュメント: http://localhost:8001

## コマンド一覧

```bash
# コンテナのビルド
make -f Makefile.twenty build

# コンテナの起動（バックグラウンド）
make -f Makefile.twenty up

# コンテナの起動（ログを表示）
make -f Makefile.twenty up-logs

# コンテナの停止
make -f Makefile.twenty down

# ログの確認
make -f Makefile.twenty logs

# サーバーのシェルに入る
make -f Makefile.twenty sh-server

# フロントエンドのシェルに入る
make -f Makefile.twenty sh-front

# データベースの初期化
make -f Makefile.twenty init-db

# データベースのリセット
make -f Makefile.twenty reset-db

# 全てクリーンにセットアップ
make -f Makefile.twenty clean
```

## 注意事項

- 初回起動時は、依存関係のダウンロードとビルドに時間がかかる場合があります
- ポート競合が発生した場合は、`docker-compose.yml`ファイルでポートマッピングを変更してください
- データは`twenty_postgres_data`ボリュームに保存されます

## トラブルシューティング

### ポートが既に使用されている場合

エラーメッセージ: `Error response from daemon: driver failed programming external connectivity on endpoint... Bind for 0.0.0.0:XXXX failed: port is already allocated`

解決策:
1. 使用中のポートを確認: `sudo lsof -i :XXXX`
2. 該当するプロセスを停止するか、`docker-compose.yml`でポートマッピングを変更

### コンテナが起動しない場合

1. ログを確認: `docker-compose logs`
2. 特定のサービスのログを確認: `docker-compose logs twenty-server`

### データベース接続エラー

1. 環境変数`PG_DATABASE_URL`が正しく設定されているか確認
2. PostgreSQLコンテナが起動しているか確認: `docker-compose ps` 