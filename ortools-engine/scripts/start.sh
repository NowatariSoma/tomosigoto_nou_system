#!/bin/bash

# OR-Tools最適化エンジン 起動スクリプト

set -e

echo "OR-Tools最適化エンジンを起動中..."

# 環境変数の設定
export DEBUG=${DEBUG:-false}
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-8001}
export MAX_ROOMS=${MAX_ROOMS:-10}
export MAX_SCENES=${MAX_SCENES:-20}
export MAX_TIMESLOTS=${MAX_TIMESLOTS:-4}
export MAX_PEOPLE=${MAX_PEOPLE:-60}
export OPTIMIZATION_TIMEOUT=${OPTIMIZATION_TIMEOUT:-30}

# 依存関係のインストール
echo "依存関係をインストール中..."
pip install -r requirements.txt

# アプリケーション起動
echo "最適化エンジンを起動中..."
exec uvicorn app.main:app --host $HOST --port $PORT --log-level $LOG_LEVEL
