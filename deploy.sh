#!/bin/bash

# Exit on error
set -e

# Google Cloud Runサービス設定
PROJECT_ID="coumera"
REGION="asia-northeast1"
SERVICE_NAME="coumera-panel"
DB_USER="postgres"
DB_NAME="coumera"
CLOUD_SQL_CONNECTION_NAME="coumera:asia-northeast1:coumera-db"
GOOGLE_CLOUD_STORAGE_BUCKET="coumera-images"

# デプロイ用のイメージとタグ
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# 環境変数の設定
# .envファイルが存在するか確認
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  # 引用符を含む行を安全に処理するために一行ずつ読み込む
  set -a
  source .env
  set +a
else
  echo "WARNING: .env file not found, using default values"
fi

# 必要な環境変数の設定
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "NEXTAUTH_SECRET not defined, using a temporary value"
  NEXTAUTH_SECRET="temporary_nextauth_secret_for_testing"
fi

# アプリケーションのURL設定
APP_URL="https://${SERVICE_NAME}-417249016130.${REGION}.run.app"
if [ -z "$NEXTAUTH_URL" ]; then
  echo "NEXTAUTH_URL not defined, using ${APP_URL}"
  NEXTAUTH_URL="${APP_URL}"
fi

# データベース接続設定
# パスワードがない場合は空文字列を使用
if [ -z "$DB_PASSWORD" ]; then
  echo "DB_PASSWORD not defined, using empty password"
  DB_PASSWORD=""
fi

# Cloud SQLへの接続文字列を生成
# パスワードが空の場合は異なる接続文字列を使用
if [ -z "$DB_PASSWORD" ]; then
  # パスワードなしの接続文字列
  DATABASE_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_CONNECTION_NAME}"
else
  # パスワードありの接続文字列
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_CONNECTION_NAME}"
fi

# Google Cloud Storageバケットの設定
if [ -z "$GOOGLE_CLOUD_STORAGE_BUCKET" ]; then
  echo "Using default storage bucket: ${GOOGLE_CLOUD_STORAGE_BUCKET}"
fi

# 環境変数の表示（デバッグ用）
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service Name: ${SERVICE_NAME}"
echo "Database Name: ${DB_NAME}"
echo "Database User: ${DB_USER}"
echo "Cloud SQL Connection Name: ${CLOUD_SQL_CONNECTION_NAME}"
echo "Storage Bucket: ${GOOGLE_CLOUD_STORAGE_BUCKET}"
echo "Image Name: ${FULL_IMAGE_NAME}"
echo "App URL: ${APP_URL}"
echo "Database URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/g')"

# 環境変数をエスケープして引数に渡す
ESCAPED_DATABASE_URL=$(printf "%q" "$DATABASE_URL")
ESCAPED_NEXTAUTH_SECRET=$(printf "%q" "$NEXTAUTH_SECRET")

# 作成したJavaScriptのシードスクリプトをコピー
echo "Copying JS seed script to prisma directory..."
sed -i -e 's/\r$//' prisma/seed-script.js

# Docker イメージのビルドと Google Container Registry へのプッシュ
echo "Building and pushing Docker image: ${FULL_IMAGE_NAME}"
docker build \
  --build-arg NEXTAUTH_URL="${NEXTAUTH_URL}" \
  --build-arg NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
  --build-arg DATABASE_URL="${DATABASE_URL}" \
  --build-arg GOOGLE_CLOUD_STORAGE_BUCKET="${GOOGLE_CLOUD_STORAGE_BUCKET}" \
  -t "${FULL_IMAGE_NAME}" .

# GCRにイメージをプッシュ
docker push "${FULL_IMAGE_NAME}"

# Google Cloud Run サービスのデプロイ
echo "Deploying to Google Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${FULL_IMAGE_NAME}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --add-cloudsql-instances="${CLOUD_SQL_CONNECTION_NAME}" \
  --set-env-vars="DATABASE_URL=${ESCAPED_DATABASE_URL}" \
  --set-env-vars="NEXTAUTH_URL=${NEXTAUTH_URL}" \
  --set-env-vars="NEXTAUTH_SECRET=${ESCAPED_NEXTAUTH_SECRET}" \
  --set-env-vars="GOOGLE_CLOUD_STORAGE_BUCKET=${GOOGLE_CLOUD_STORAGE_BUCKET}" \
  --set-env-vars="INITIALIZE_DB=true" \
  --project="${PROJECT_ID}"

echo "Deployment completed successfully!"
echo "Your application is available at: ${APP_URL}"
echo ""
echo "アプリケーションはサービス起動時にデータベースを自動初期化します。"
echo "環境変数 INITIALIZE_DB=true を設定したので、最初の起動時にデータベースのマイグレーションとシードが実行されます。"
echo "ログインするには、以下の認証情報を使用してください："
echo "Email: admin@coumera.com"
echo "Password: admin123" 