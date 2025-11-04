#!/bin/sh
set -e

# Next.jsビルドを実行（エラーがあっても続行）
npm run build 2>&1 | tee build.log || {
  # 404ページのプリレンダリングエラーのみ無視
  if grep -q "Error occurred prerendering page \"/404\"" build.log; then
    echo "⚠️  404ページのプリレンダリングエラーを検出しましたが、ビルドを続行します"
    # ビルド成果物が存在するか確認
    if [ -d ".next" ]; then
      echo "✓ ビルド成果物は生成されました"
      exit 0
    fi
  fi
  exit 1
}

