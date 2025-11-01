# ================================
# 依存関係ステージ
# ================================
FROM node:18-alpine AS deps

# libc6-compat は一部のnpmパッケージで必要
RUN apk add --no-cache libc6-compat

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json* ./

# 依存関係をインストール
RUN npm ci

# ================================
# ビルドステージ
# ================================
FROM node:18-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# アプリケーションのソースコードをコピー
COPY . .

# 環境変数（ビルド時に必要な場合）
ARG NODE_ENV=production
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL

ENV NODE_ENV=${NODE_ENV}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Next.jsをビルド
RUN npm run build

# ================================
# 開発ステージ
# ================================
FROM node:18-alpine AS development

WORKDIR /app

# 開発用の依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules

# アプリケーションのソースコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]

# ================================
# 本番ステージ
# ================================
FROM node:18-alpine AS production

WORKDIR /app

# 環境変数設定
ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 非rootユーザーに切り替え
USER nextjs

# ポート3000を公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 本番サーバーを起動
CMD ["npm", "start"] 