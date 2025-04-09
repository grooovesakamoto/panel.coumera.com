import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

console.log('Starting seed script...');

// データベース接続情報の確認
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connected to database, starting seed operations...');
    
    // 管理者ユーザーの作成
    const adminEmail = 'admin@coumera.com';
    
    // 既存のユーザーを確認
    console.log(`Checking if admin user ${adminEmail} exists...`);
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingUser) {
      console.log('Admin user not found, creating new admin user...');
      
      // パスワードのハッシュ化
      const password = 'admin123';
      console.log(`Hashing password for ${adminEmail}...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 管理者ユーザーの作成
      console.log('Creating admin user...');
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
      
      console.log(`Admin user created: ${admin.email} with ID: ${admin.id}`);
    } else {
      console.log(`Admin user already exists: ${existingUser.email} with ID: ${existingUser.id}`);
      
      // 既存ユーザーのパスワードを更新
      console.log('Updating admin password...');
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      });
      
      console.log('Admin password updated.');
    }
    
    console.log('Seed operations completed successfully.');
  } catch (error) {
    console.error('Error during seed operations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected.');
  }
}

main()
  .then(() => {
    console.log('Seed script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  }); 