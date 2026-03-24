# k8s マニフェスト

## ファイル構成

```
k8s/
├── namespace.yaml          # プロジェクトの「部屋」
├── secret.yaml.example     # 環境変数の機密情報テンプレート
├── ingress.yaml            # ドメインルーティング (本番用)
├── postgres/
│   ├── pvc.yaml            # ストレージ要求
│   ├── statefulset.yaml    # PostgreSQL
│   └── service.yaml        # クラスター内DNS
├── backend/
│   ├── deployment.yaml     # FastAPI
│   └── service.yaml
├── frontend/
│   ├── deployment.yaml     # Next.js
│   └── service.yaml
├── nginx/
│   ├── deployment.yaml     # リバースプロキシ + ConfigMap
│   └── service.yaml        # NodePort (学習・動作確認用)
└── backup/
    └── cronjob.yaml        # 毎日 03:00 JST に pg_dump
```

## docker-compose との概念対応

| docker-compose | k8s |
|---|---|
| service | Deployment / StatefulSet |
| volumes | PersistentVolumeClaim |
| networks (サービス名でアクセス) | Service |
| environment | Secret / ConfigMap |
| depends_on | readinessProbe |
| restart: always | k8s がデフォルトで自動再起動 |
| ports | Service (NodePort / Ingress) |

## k3s セットアップ手順

### 1. VPS に k3s インストール

```bash
curl -sfL https://get.k3s.io | sh -
# → /usr/local/bin/k3s が入る
# → kubectl も使えるようになる

# 動作確認
kubectl get nodes
```

### 2. イメージをビルドして push

k8s はイメージを自分でビルドしないので、事前に push が必要。

```bash
# GitHub Container Registry を使う場合
docker build -t ghcr.io/YOUR_USERNAME/tomosigoto-backend:latest ./backend
docker push ghcr.io/YOUR_USERNAME/tomosigoto-backend:latest

docker build -t ghcr.io/YOUR_USERNAME/tomosigoto-frontend:latest ./frontend
docker push ghcr.io/YOUR_USERNAME/tomosigoto-frontend:latest
```

### 3. Secret を作成

```bash
cp k8s/secret.yaml.example k8s/secret.yaml
# secret.yaml を編集して実際の値を設定
kubectl apply -f k8s/secret.yaml
```

### 4. マニフェストを適用

```bash
# namespace から順番に適用
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/nginx/
kubectl apply -f k8s/backup/

# または全部まとめて
kubectl apply -R -f k8s/
```

### 5. 動作確認

```bash
# Pod の状態確認
kubectl get pods -n tomosigoto

# ログ確認
kubectl logs -n tomosigoto deployment/backend

# ブラウザでアクセス
# http://VPSのIP:30080
```

## よく使う kubectl コマンド

```bash
# Pod 一覧
kubectl get pods -n tomosigoto

# Pod の詳細 (エラー原因調査に使う)
kubectl describe pod <pod名> -n tomosigoto

# ログ確認
kubectl logs <pod名> -n tomosigoto

# Pod の中に入る (docker exec に相当)
kubectl exec -it <pod名> -n tomosigoto -- /bin/sh

# リソース削除
kubectl delete -f k8s/

# 全リソース確認
kubectl get all -n tomosigoto
```
