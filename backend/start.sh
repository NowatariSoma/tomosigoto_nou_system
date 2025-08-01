#!/bin/bash

# 開発環境起動スクリプト

echo "🚀 Starting FastAPI development server..."

# 環境変数ファイルが存在するかチェック
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please update it with your settings."
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# 仮想環境が有効かチェック
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not activated!"
    echo "Looking for venv..."
    if [ -d "venv" ]; then
        echo "Activating venv..."
        source venv/bin/activate
    else
        echo "Creating new virtual environment..."
        python -m venv venv
        source venv/bin/activate
        echo "Installing dependencies..."
        pip install -r requirements.txt
    fi
fi

# サーバー起動
echo "Starting server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000