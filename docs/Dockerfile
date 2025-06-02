FROM node:18.16-bullseye

WORKDIR /app

# ドキュメントディレクトリに移動
WORKDIR /app/docs

# パッケージファイルをコピー
COPY ./docs/package.json ./docs/yarn.lock ./

# 依存関係のインストール
RUN yarn install

# アプリケーションコードをコピー
COPY ./docs .

# ポート5001を公開
EXPOSE 5001

# アプリを起動
CMD ["yarn", "start"] 