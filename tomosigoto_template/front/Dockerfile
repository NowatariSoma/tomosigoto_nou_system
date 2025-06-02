FROM node:18.16-bullseye

WORKDIR /app

# パッケージディレクトリをコピー
COPY ./packages /app/packages

# フロントエンドディレクトリに移動
WORKDIR /app/front

# パッケージファイルをコピー
COPY ./front/package.json ./
COPY ./front/yarn.lock ./

# 依存関係のインストール
RUN yarn install --network-timeout 600000

# アプリケーションコードをコピー
COPY ./front .

# 環境変数を設定
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true 
ENV DISABLE_ESLINT_PLUGIN=true
ENV REACT_APP_DISABLE_TELEMETRY=true

# ポート3000を公開
EXPOSE 3000

# アプリを起動
CMD ["yarn", "start"] 