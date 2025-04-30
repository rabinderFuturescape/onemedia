'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasTenant: (tenantId: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  hasTenant: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = (redirectUrl?: string) => {
    signIn('onesso', { callbackUrl: redirectUrl || '/' });
  };

  const logout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const hasRole = (role: string) => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  const hasTenant = (tenantId: string) => {
    if (!user?.tenant_id) return false;
    return user.tenant_id === tenantId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
