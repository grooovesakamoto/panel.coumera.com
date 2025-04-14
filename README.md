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

## 開発環境のセットアップ

### データベースのセットアップ
1. PostgreSQLをDockerで起動する
```bash
docker compose up -d
```

2. マイグレーションを実行してスキーマを作成する
```bash
npx prisma migrate dev --name initial_migration
```

3. シードデータを投入する（開発用アカウント作成）
```bash
npm run prisma:seed
```

4. Prismaクライアントを生成する
```bash
npx prisma generate
```

### 開発サーバーの起動
```bash
npm run dev
```

### テスト用アカウント
- 管理者: admin@coumera.com / admin123
- クライアント管理者: clientadmin@example.com / demo123
- 開発者: developer@example.com / developer123
- 閲覧者: viewer@example.com / viewer123

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

# 開発メモ

## 実装予定機能リスト

### クライアント・ユーザー管理機能

#### 1. クライアント・ユーザー登録
- [x] データベーススキーマ設計（クライアント・ユーザーテーブル、関連テーブル）
- [x] ロールの定義（ADMIN, CLIENT_ADMIN, DEVELOPER, VIEWER）
- [ ] 登録フォームとバリデーション機能
- [ ] メール認証システム
- [ ] パスワード管理（初期発行・リセット機能）

#### 2. クライアント・ユーザー管理
- [x] ユーザー管理API（一覧、作成、更新、削除）
- [ ] 一覧表示・検索・フィルタリング機能
- [ ] 詳細情報編集インターフェース
- [x] アクセス権限・ロール設定管理
- [ ] アカウント状態管理（有効/無効/停止など）

#### 3. 権限管理と表示制限
- [x] ロールベースのアクセス制御（RBAC）実装
- [ ] 権限レベル設定（管理者/一般ユーザー/閲覧専用など）
- [ ] 権限に基づくUI要素の条件付き表示
- [ ] デバイスアクセス権限の管理

### ユーザー専用トップページ拡充

#### 1. 計測データダッシュボード
- [ ] データ集計・可視化コンポーネント
- [ ] グラフ・チャートライブラリ導入
- [ ] リアルタイムデータ更新機能
- [ ] カスタマイズ可能なダッシュボードレイアウト

#### 2. 機器設定機能
- [ ] Actcast API連携拡張
- [ ] 設定項目のカテゴリ分け
- [ ] 設定変更履歴の記録・表示
- [ ] 一括設定変更機能

### 技術的検討事項

#### 認証・認可システム
- [ ] 現在のセッション管理との統合
- [ ] JWTベースの認証システム検討
- [ ] クロスクライアント間のアクセス制御

#### データベース設計
- [ ] クライアント-ユーザー間の関係モデル
- [ ] デバイスアクセス権限の効率的な管理

#### UI/UX設計
- [ ] ユーザー種別に応じた画面フロー設計
- [ ] 権限に応じた機能制限の自然な表現

#### データ処理パイプライン
- [ ] デバイスからのデータ取得・加工・保存の効率化
- [ ] 大量データの効率的な可視化手法

## 次回の開発タスク
- Wi-Fi設定機能の実装
  - デバイスのWi-Fi追加機能
  - デバイスのWi-Fi削除機能
  - Wi-Fi設定状態の表示
  - エラーハンドリングの実装

## 開発履歴
- 2024-06-09: Wi-Fi設定更新APIエンドポイントとリクエスト形式を修正
  - エンドポイントが `/devices/{deviceId}` に変更
  - リクエスト形式が `{ access_points: [...] }` に変更
  - HTTPメソッドが `PATCH` に変更
- 2024-03-27: GitHubリポジトリの初期設定完了
  - .gitignoreの設定
  - 環境変数テンプレートの追加
  - セキュリティ関連ファイルの削除
