import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

console.log('Starting seed script...');

// データベース接続情報の確認
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');

const prisma = new PrismaClient();

async function main() {
  console.log('データベースシード処理を開始...');

  // システム管理者作成
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@coumera.com' },
    update: {
      password: adminPassword,
      isActive: true,
      role: Role.ADMIN
    },
    create: {
      email: 'admin@coumera.com',
      name: 'システム管理者',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true
    },
  });
  
  console.log(`管理者ユーザー作成完了: ${admin.email} (ID: ${admin.id})`);
  
  // デモクライアント作成
  const demoClient = await prisma.client.upsert({
    where: { name: 'デモクライアント' },
    update: {
      contactPerson: 'デモ担当者',
      contactEmail: 'demo@example.com',
      description: 'デモ用のクライアントアカウント'
    },
    create: {
      name: 'デモクライアント',
      description: 'デモ用のクライアントアカウント',
      contactPerson: 'デモ担当者',
      contactEmail: 'demo@example.com',
      contactPhone: '03-1234-5678',
    },
  });
  
  console.log(`デモクライアント作成完了: ${demoClient.name} (ID: ${demoClient.id})`);
  
  // クライアント管理者作成
  const clientAdminPassword = await hash('demo123', 10);
  const clientAdmin = await prisma.user.upsert({
    where: { email: 'clientadmin@example.com' },
    update: {
      password: clientAdminPassword,
      role: Role.CLIENT_ADMIN,
      clientId: demoClient.id,
      isActive: true
    },
    create: {
      email: 'clientadmin@example.com',
      name: 'クライアント管理者',
      password: clientAdminPassword,
      role: Role.CLIENT_ADMIN,
      clientId: demoClient.id,
      isActive: true,
      createdBy: admin.id
    },
  });
  
  console.log(`クライアント管理者作成完了: ${clientAdmin.email} (ID: ${clientAdmin.id})`);

  // 開発者ユーザー作成
  const developerPassword = await hash('developer123', 10);
  const developer = await prisma.user.upsert({
    where: { email: 'developer@example.com' },
    update: {
      password: developerPassword,
      role: Role.DEVELOPER,
      clientId: demoClient.id,
      isActive: true
    },
    create: {
      email: 'developer@example.com',
      name: '開発者ユーザー',
      password: developerPassword,
      role: Role.DEVELOPER,
      clientId: demoClient.id,
      isActive: true,
      createdBy: clientAdmin.id
    },
  });
  
  console.log(`開発者ユーザー作成完了: ${developer.email} (ID: ${developer.id})`);

  // 閲覧ユーザー作成
  const viewerPassword = await hash('viewer123', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {
      password: viewerPassword,
      role: Role.VIEWER,
      clientId: demoClient.id,
      isActive: true
    },
    create: {
      email: 'viewer@example.com',
      name: '閲覧専用ユーザー',
      password: viewerPassword,
      role: Role.VIEWER,
      clientId: demoClient.id,
      isActive: true,
      createdBy: clientAdmin.id
    },
  });
  
  console.log(`閲覧ユーザー作成完了: ${viewer.email} (ID: ${viewer.id})`);

  console.log('データベースシード処理が完了しました');
}

main()
  .catch((e) => {
    console.error('シード処理でエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 