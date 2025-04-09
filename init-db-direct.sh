#!/bin/bash

# Exit on error
set -e

# Google Cloud Runサービス設定
PROJECT_ID="coumera" 
REGION="asia-northeast1"
CLOUD_SQL_CONNECTION_NAME="coumera:asia-northeast1:coumera-db"
DB_USER="postgres"
DB_NAME="coumera"

# .envファイルが存在するか確認
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  set -a
  source .env
  set +a
else
  echo "WARNING: .env file not found, using default values"
fi

# DB_PASSWORDが設定されていない場合は終了
if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: DB_PASSWORD is not set in .env file."
  exit 1
fi

# Cloud SQLプロキシを起動するための関数
start_proxy() {
  echo "Starting Cloud SQL Proxy..."
  cloud_sql_proxy --instances=${CLOUD_SQL_CONNECTION_NAME}=tcp:5432 > /dev/null 2>&1 &
  PROXY_PID=$!
  echo "Cloud SQL Proxy started with PID: ${PROXY_PID}"
  
  # プロキシが起動するまで待機
  echo "Waiting for proxy to initialize..."
  sleep 5
}

# Cloud SQLプロキシを停止するための関数
stop_proxy() {
  if [ ! -z "$PROXY_PID" ]; then
    echo "Stopping Cloud SQL Proxy (PID: ${PROXY_PID})..."
    kill $PROXY_PID
    wait $PROXY_PID 2>/dev/null || true
    echo "Cloud SQL Proxy stopped."
  fi
}

# スクリプト終了時にプロキシを停止
trap stop_proxy EXIT

# データベースURL設定
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
echo "Database URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/g')"

# Cloud SQLプロキシを起動
start_proxy

# 既存のテーブルを取得して一覧表示
echo "現在のデータベーステーブル情報を取得します..."
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c "\dt"

# テーブル所有者を変更
echo "テーブル所有者をpostgresに変更します..."
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c "
ALTER TABLE IF EXISTS \"Client\" OWNER TO postgres;
ALTER TABLE IF EXISTS \"Device\" OWNER TO postgres;
ALTER TABLE IF EXISTS \"User\" OWNER TO postgres;
ALTER TABLE IF EXISTS \"_prisma_migrations\" OWNER TO postgres;
"

# テーブル所有者の確認
echo "テーブル所有者を確認します..."
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c "\dt"

# Prismaスキーマを適用
echo "Prismaスキーマを適用します..."
npx prisma db push --skip-generate

# データベースシードを実行
echo "シードデータを投入します..."
node prisma/seed-script.js

echo "データベース初期化が完了しました！" 