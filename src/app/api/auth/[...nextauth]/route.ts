import NextAuth, { type NextAuthOptions, type User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// デバッグ情報
console.log('NextAuth configuration loading...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set (hidden for security)' : 'Not set');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// ハードコードされた管理者ユーザー情報（テスト用）
const ADMIN_EMAIL = 'admin@coumera.com';
const ADMIN_PASSWORD = 'admin123';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        console.log('Auth attempt with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          // データベース接続なしでハードコードされた管理者ユーザーを確認
          if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
            console.log('Admin user authenticated successfully');
            return {
              id: '1',
              email: ADMIN_EMAIL,
              name: 'Admin User',
              role: 'ADMIN',
            };
          }
          
          console.log('User not found or invalid password');
          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 