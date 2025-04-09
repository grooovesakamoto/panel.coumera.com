import { PrismaClient } from '@prisma/client';

// PrismaClientのインスタンスをグローバルに保持
declare global {
  var prisma: PrismaClient | undefined;
}

// デバッグ情報の出力
console.log('Initializing Prisma client from lib/prisma.ts...');
const databaseUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL:', databaseUrl ? 'Set (hidden for security)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in lib/prisma.ts! Database operations will fail.');
}

// 開発環境では再ロードのたびに新しいPrismaClientが作成されないようにする
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} else {
  console.log('Running in production mode with Prisma client initialized from lib/prisma.ts');
}

// サーバー終了時にPrismaクライアントを切断
process.on('beforeExit', async () => {
  console.log('Disconnecting Prisma client...');
  await prisma.$disconnect();
});

// PrismaClientの作成関数
function createPrismaClient(): PrismaClient {
  try {
    console.log('Creating new PrismaClient instance');
    console.log(`DATABASE_URL: ${maskConnectionString(process.env.DATABASE_URL || '')}`);
    
    // PrismaClientの初期化
    const client = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // 接続テスト
    client.$connect().catch(err => {
      console.error('Error connecting to database:', err);
      console.log('Application will continue without database functionality');
    });
    
    return client;
  } catch (error) {
    console.error('Failed to create PrismaClient:', error);
    console.log('Creating dummy PrismaClient');
    
    // ダミーのPrismaClientを返す
    return createDummyPrismaClient();
  }
}

// データベース接続文字列をマスクする関数
function maskConnectionString(url: string): string {
  if (!url) return 'undefined';
  try {
    const maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    return maskedUrl;
  } catch (e) {
    return 'invalid-url';
  }
}

// ダミーのPrismaClient
function createDummyPrismaClient(): PrismaClient {
  const dummyClient: any = {};
  
  // PrismaClientのメソッドを模倣
  dummyClient.$connect = () => Promise.resolve();
  dummyClient.$disconnect = () => Promise.resolve();
  dummyClient.$on = () => {};
  dummyClient.$use = () => {};
  
  // モデル操作のダミーメソッド
  const models = [
    'user', 'client', 'device'
  ];
  
  // 各モデルにダミーメソッドを設定
  models.forEach(model => {
    dummyClient[model] = {
      findUnique: () => Promise.reject(new Error('No database connection')),
      findMany: () => Promise.reject(new Error('No database connection')),
      findFirst: () => Promise.reject(new Error('No database connection')),
      create: () => Promise.reject(new Error('No database connection')),
      update: () => Promise.reject(new Error('No database connection')),
      delete: () => Promise.reject(new Error('No database connection')),
      count: () => Promise.reject(new Error('No database connection')),
    };
  });
  
  // rawコマンドのダミー
  dummyClient.$queryRaw = () => Promise.reject(new Error('No database connection'));
  dummyClient.$executeRaw = () => Promise.reject(new Error('No database connection'));
  
  return dummyClient as unknown as PrismaClient;
} 