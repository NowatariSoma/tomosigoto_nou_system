# ================================
# ベースステージ - 共通の依存関係
# ================================
FROM python:3.11-slim as base

# 環境変数設定
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係ファイルをコピー
COPY requirements.txt .

# Pythonの依存関係をインストール
RUN pip install --no-cache-dir -r requirements.txt

# ================================
# 開発ステージ
# ================================
FROM base as development

# 開発用の追加ツールをインストール（必要に応じて）
# RUN pip install --no-cache-dir debugpy pytest

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# FastAPIアプリケーションを起動（ホットリロード有効）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ================================
# 本番ステージ
# ================================
FROM base as production

# 非rootユーザーを作成
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# アプリケーションコードをコピー
COPY --chown=appuser:appuser . .

# 非rootユーザーに切り替え
USER appuser

# ポート8000を公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# FastAPIアプリケーションを起動（本番用：複数ワーカー）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"] 