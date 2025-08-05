.PHONY: help install dev dev-test test lint format clean get-token

help:
	@echo "利用可能なコマンド:"
	@echo "  make install   - 依存関係をインストール"
	@echo "  make dev       - 開発サーバーを起動"
	@echo "  make dev-test  - テスト環境設定で開発サーバーを起動"
	@echo "  make test      - テストを実行"
	@echo "  make lint      - リンターを実行"
	@echo "  make format    - コードをフォーマット"
	@echo "  make clean     - キャッシュをクリーンアップ"
	@echo "  make get-token - テスト用JWTトークンを取得"

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-test:
	cp .env.test .env && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest

test-unit:
	pytest tests/unit/

test-integration:
	pytest tests/integration/

lint:
	ruff check .
	mypy app/

format:
	ruff format .
	isort .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +

get-token:
	@python tests/utils/get_test_token.py

create-test-user:
	@python tests/utils/create_test_user.py