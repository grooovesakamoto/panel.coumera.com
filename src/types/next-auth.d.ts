import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      clientId: string | null;
      clientName: string | null;
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    clientId?: string | null;
    clientName?: string | null;
    isActive: boolean;
  }
} 