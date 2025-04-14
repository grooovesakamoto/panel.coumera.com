import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { User, Role } from '@prisma/client';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  clientId?: string | null;
};

export const useAuth = () => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      setUser(session.user as AuthUser);
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
  }, [session, status]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isClientAdmin: user?.role === 'CLIENT_ADMIN',
    isDeveloper: user?.role === 'DEVELOPER',
    isViewer: user?.role === 'VIEWER',
  };
}; 