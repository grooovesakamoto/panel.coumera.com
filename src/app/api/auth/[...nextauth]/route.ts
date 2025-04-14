import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// デバッグ情報
console.log('NextAuth route loading...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set (hidden for security)' : 'Not set');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 