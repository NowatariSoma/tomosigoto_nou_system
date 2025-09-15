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

# 非rootユーザーを作成（ホームディレクトリ付き）
RUN groupadd -r mluser && useradd -r -g mluser -m mluser

# requirements.txtをコピー（rootユーザーで実行）
COPY requirements.txt .

# 必要なディレクトリを作成
RUN mkdir -p models/scene_based_system/best \
    && mkdir -p outputs/assignments \
    && mkdir -p outputs/visualizations \
    && mkdir -p logs \
    && mkdir -p result \
    && chown -R mluser:mluser /app

# 仮想環境を作成（rootユーザーで実行）
RUN python -m venv /opt/venv && \
    chown -R mluser:mluser /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 非rootユーザーに切り替え
USER mluser

# pipの警告を抑制する環境変数を設定
ENV PIP_NO_WARN_SCRIPT_LOCATION=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Python依存関係のインストール（仮想環境内で実行）
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルをコピー（非rootユーザーで実行）
COPY --chown=mluser:mluser . .

# ポート8001を公開
EXPOSE 8001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# アプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
