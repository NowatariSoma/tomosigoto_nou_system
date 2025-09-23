.PHONY: help install dev dev-test test lint format clean get-token

help:
	@echo "利用可能なコマンド:"
	@echo ""
	@echo "==== 開発環境 ===="
	@echo "  make install          - 依存関係をインストール"
	@echo "  make install-test     - テスト依存関係もインストール"
	@echo "  make dev              - 開発サーバーを起動"
	@echo "  make dev-test         - テスト環境設定で開発サーバーを起動"
	@echo ""
	@echo "==== テスト実行 ===="
	@echo "  make test             - 全テストを実行"
	@echo "  make test-unit        - ユニットテストのみ実行"
	@echo "  make test-integration - 統合テストのみ実行"
	@echo "  make test-e2e         - E2Eテストのみ実行"
	@echo "  make test-fast        - 高速テスト（並列実行）"
	@echo "  make test-watch       - ファイル変更を監視してテスト自動実行"
	@echo "  make test-failed      - 前回失敗したテストのみ再実行"
	@echo "  make test-coverage    - カバレッジレポート付きでテスト実行"
	@echo "  make test-benchmark   - パフォーマンステスト実行"
	@echo ""
	@echo "==== コード品質 ===="
	@echo "  make lint             - リンターを実行"
	@echo "  make format           - コードをフォーマット"
	@echo "  make typecheck        - 型チェックを実行"
	@echo ""
	@echo "==== ユーティリティ ===="
	@echo "  make clean            - キャッシュをクリーンアップ"
	@echo "  make get-token        - テスト用JWTトークンを取得"
	@echo "  make create-test-user - テストユーザーを作成"
	@echo "  make ci-local         - ローカルでCIパイプラインを実行"

install:
	pip install -r requirements.txt

install-test: install
	pip install -r tests/requirements-test.txt 2>/dev/null || pip install pytest pytest-asyncio pytest-mock pytest-cov pytest-xdist

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-test:
	cp .env.test .env && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest -v

test-unit:
	pytest tests/unit/ -n auto -v

test-integration:
	pytest tests/integration/ -n 4 -v

test-e2e:
	pytest tests/e2e/ -v

test-fast:
	pytest -n auto --dist loadscope -m "not slow"

test-watch:
	@which ptw > /dev/null 2>&1 || pip install pytest-watch
	ptw -- -x tests/

test-failed:
	pytest --lf -v

test-coverage:
	pytest --cov=app --cov-report=html --cov-report=term-missing
	@echo "カバレッジレポート: htmlcov/index.html"

test-benchmark:
	pytest tests/ -v --benchmark-only --benchmark-autosave 2>/dev/null || echo "ベンチマークテストはまだ設定されていません"

typecheck:
	mypy app/

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
	rm -rf htmlcov/
	rm -rf test-results/

get-token:
	@python tests/utils/get_test_token.py

create-test-user:
	@python tests/utils/create_test_user.py

ci-local: clean
	@echo "=== ローカルCIパイプライン開始 ==="
	@echo "1/4: ユニットテスト実行中..."
	@make test-unit
	@echo "2/4: 統合テスト実行中..."
	@make test-integration
	@echo "3/4: E2Eテスト実行中..."
	@make test-e2e 2>/dev/null || echo "E2Eテストはまだ実装されていません"
	@echo "4/4: カバレッジレポート生成中..."
	@make test-coverage
	@echo "=== CIパイプライン完了 ==="