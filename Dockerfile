FROM --platform=linux/amd64 node:18-slim AS base

# Install dependencies only when needed
FROM --platform=linux/amd64 base AS deps
WORKDIR /app

# OpenSSLとその他の必要なパッケージをインストール
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy prisma schema first to prevent generate errors
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/seed-script.js ./prisma/seed-script.js

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# 依存関係をインストール
RUN npm ci

# Rebuild the source code only when needed
FROM --platform=linux/amd64 base AS builder
WORKDIR /app

# OpenSSLをインストール（Prisma用）
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time environment variables
ARG GOOGLE_CLOUD_STORAGE_BUCKET
ENV GOOGLE_CLOUD_STORAGE_BUCKET=$GOOGLE_CLOUD_STORAGE_BUCKET

# NextAuth.js環境変数
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# データベース接続情報
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# 画像最適化のためのSharpをインストール
RUN npm install sharp

# 環境変数の確認（デバッグ用）
RUN echo "DATABASE_URL: ${DATABASE_URL:-not set}" | sed 's/:[^:@]*@/:***@/g'

# Prisma関連のセットアップ
# この段階ではPrismaのスキーマのみを確認し、生成はスキップ
# 実際の生成はコンテナ起動時に実行されます
RUN echo "Checking Prisma schema..."
RUN npx prisma validate || echo "Warning: Prisma schema validation failed"

# シードスクリプトのパーミッション設定
RUN chmod +x prisma/seed-script.js || echo "Warning: Could not set executable permission on seed script"

# NextJSのビルド
RUN npm run build

# Production image, copy all the files and run next
FROM --platform=linux/amd64 base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

# NextAuth.jsのシークレットを設定
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# データベース接続情報
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# OpenSSLとSharpに必要なライブラリをインストール
RUN apt-get update -y && apt-get install -y openssl libssl-dev ca-certificates \
    dumb-init postgresql-client && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma関連のファイル
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Sharp for image optimization
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

# スタートアップスクリプトを追加
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# nextjsユーザーを使わず、rootで実行する
# USER nextjs

EXPOSE 8080

# ヘルスチェックのタイムアウトを延長
ENV NODE_OPTIONS="--max-old-space-size=4096"

# タイムアウト設定を追加
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV TIMEOUT=30000

# エントリーポイントの追加
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "/app/start.sh"] 