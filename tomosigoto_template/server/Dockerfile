FROM node:18.16-bullseye

WORKDIR /app

# パッケージディレクトリをコピー
COPY ./packages /app/packages

# サーバーディレクトリに移動
WORKDIR /app/server

# パッケージファイルをコピー
COPY ./server/package.json ./server/yarn.lock ./

# 依存関係のインストール
RUN yarn install

# アプリケーションコードをコピー
COPY ./server .

# Prismaの生成
RUN npx prisma generate

# ポート3001を公開
EXPOSE 3001

# アプリを起動
CMD ["yarn", "start:dev"] 