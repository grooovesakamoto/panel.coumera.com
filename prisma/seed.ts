import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // デフォルト管理者ユーザーの作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'システム管理者',
      password: await hash('Admin123456', 10),
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('デフォルト管理者ユーザーを作成しました:', adminUser);

  // サンプルクライアントの作成
  const sampleClient = await prisma.client.upsert({
    where: { code: 'SAMPLE001' },
    update: {},
    create: {
      name: 'サンプル株式会社',
      code: 'SAMPLE001',
      description: 'システムのデモンストレーション用サンプルクライアント',
      email: 'contact@sample.example.com',
      phoneNumber: '03-1234-5678',
      address: '東京都千代田区サンプル1-1-1',
      website: 'https://sample.example.com',
      isActive: true,
      settings: {},
      contractStart: new Date(),
      contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  console.log('サンプルクライアントを作成しました:', sampleClient);

  // クライアント管理者の作成
  const clientAdminUser = await prisma.user.upsert({
    where: { email: 'client-admin@example.com' },
    update: {},
    create: {
      email: 'client-admin@example.com',
      name: 'クライアント管理者',
      password: await hash('ClientAdmin123', 10),
      role: 'CLIENT_ADMIN',
      isActive: true,
      clientId: sampleClient.id,
    },
  });

  console.log('クライアント管理者ユーザーを作成しました:', clientAdminUser);

  // 一般ユーザーの作成
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '一般ユーザー',
      password: await hash('User123456', 10),
      role: 'USER',
      isActive: true,
      clientId: sampleClient.id,
    },
  });

  console.log('一般ユーザーを作成しました:', normalUser);

  // サンプルデバイスの作成
  const sampleDevice = await prisma.device.upsert({
    where: { serialNumber: 'DEV123456' },
    update: {},
    create: {
      name: 'サンプルカメラ',
      type: 'CAMERA',
      serialNumber: 'DEV123456',
      status: 'ONLINE',
      location: '東京オフィス 1階入口',
      ipAddress: '192.168.1.100',
      isActive: true,
      settings: {},
      clientId: sampleClient.id,
    },
  });

  console.log('サンプルデバイスを作成しました:', sampleDevice);

  // サンプルプロジェクトの作成
  const sampleProject = await prisma.project.create({
    data: {
      name: 'サンプルプロジェクト',
      description: 'これはデモンストレーション用のサンプルプロジェクトです',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      clientId: sampleClient.id,
    },
  });

  console.log('サンプルプロジェクトを作成しました:', sampleProject);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 