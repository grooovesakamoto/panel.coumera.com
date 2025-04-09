This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Coumera Panel

Cloud Runにデプロイするためのコントロールパネルアプリケーション

## セキュリティに関する注意

**重要**: このリポジトリにはサービスアカウントキー（`service-account-key.json`）が含まれています。これは本番環境では使用せず、適切な方法でシークレットを管理してください。以下の方法をお勧めします：

1. サービスアカウントキーをGitリポジトリから削除し、.gitignoreに追加する
2. Google Cloud Secret Managerを使用してシークレットを管理する
3. Cloud Runにデプロイする際はWorkload Identityを使用する

## デプロイ方法

アプリケーションをデプロイするには、以下の手順に従ってください：

1. 必要な環境変数を`.env`ファイルに設定します
   - データベース接続情報（`DB_PASSWORD`など）
   - `GOOGLE_CLOUD_STORAGE_BUCKET`の設定
   - `NEXTAUTH_SECRET`と`NEXTAUTH_URL`の設定

2. デプロイスクリプトを実行します
   ```bash
   ./deploy.sh
   ```

3. デプロイ後、データベースマイグレーションを実行します
   ```bash
   ./init-db.sh
   ```

## 環境変数

アプリケーションの実行に必要な主な環境変数：

- `DATABASE_URL`: Cloud SQLデータベースへの接続文字列
- `GOOGLE_CLOUD_STORAGE_BUCKET`: 画像を保存するGCS（Google Cloud Storage）バケット名
- `NEXTAUTH_SECRET`: NextAuth.jsで使用する秘密鍵
- `NEXTAUTH_URL`: アプリケーションのベースURL
