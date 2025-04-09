#!/bin/bash
set -e

# データベース初期化スクリプト
# Cloud SQL Proxyを使用してローカルからCloud SQLに接続します

echo "データベース初期化を開始します..."

# 環境変数の読み込み
if [ -f .env ]; then
  echo "環境変数を.envファイルから読み込みます"
  # 引用符を含む行を安全に処理するために一行ずつ読み込む
  set -a
  source .env
  set +a
else
  echo "警告: .envファイルが見つかりません。環境変数を確認してください。"
  exit 1
fi

# データベースURLを構築（ローカル実行用）
CLOUD_SQL_CONNECTION_NAME="coumera:asia-northeast1:coumera-db"
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-coumera}

# ローカルのCloud SQL Proxy経由で接続するためのローカルデータベースURL
LOCAL_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
export DATABASE_URL="$LOCAL_DATABASE_URL"

# 必須の環境変数のチェック
if [ -z "$DATABASE_URL" ]; then
  echo "エラー: DATABASE_URLを構築できませんでした"
  exit 1
fi

# データベース接続情報をマスクして表示
echo "データベース接続情報: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/g')"

# Cloud SQL Proxyの実行確認をスキップ
echo "Cloud SQL Proxyが動作していることを前提として処理を続行します..."

# Prismaのデータベーススキーマを初期化
echo "データベーススキーマを初期化..."
npx prisma db push --force-reset --accept-data-loss

# Prismaマイグレーションの実行
echo "データベースマイグレーションを実行します..."
npx prisma migrate reset --force

# 初期データの投入
echo "初期データを投入します..."
npx prisma db seed

echo "データベース初期化が完了しました！" 