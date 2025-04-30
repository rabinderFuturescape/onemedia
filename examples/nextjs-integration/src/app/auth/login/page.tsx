'use client';

import { useAuth } from '@/contexts/auth-context';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (!isAuthenticated) {
      login(callbackUrl);
    }
  }, [isAuthenticated, login, callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to login...</h1>
        <p className="mt-2">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  );
}
