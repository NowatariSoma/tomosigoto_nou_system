# ML-Engine Dockerfile
FROM python:3.9-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルをコピー
COPY . .

# 必要なディレクトリを作成
RUN mkdir -p models/scene_based_system/best \
    && mkdir -p outputs/assignments \
    && mkdir -p outputs/visualizations \
    && mkdir -p logs \
    && mkdir -p result

# ポート8001を公開
EXPOSE 8001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# アプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
