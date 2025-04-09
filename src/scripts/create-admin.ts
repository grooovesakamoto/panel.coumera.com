import { hash } from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  try {
    const password = await hash('admin123', 12);
    const user = await prisma.user.upsert({
      where: {
        email: 'admin@coumera.com',
      },
      update: {
        password,
      },
      create: {
        email: 'admin@coumera.com',
        name: '管理者',
        password,
        role: 'ADMIN',
      },
    });
    console.log('Created admin user:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 