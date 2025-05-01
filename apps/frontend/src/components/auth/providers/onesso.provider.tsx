'use client';

import { Button } from '@gitroom/react/form/button';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function OnessoProvider() {
  const [loading, setLoading] = useState(false);

  const handleOnessoLogin = async () => {
    setLoading(true);
    try {
      await signIn('onesso', { callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing in with onesso:', error);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleOnessoLogin}
      loading={loading}
      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[4px]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Sign in with onesso
    </Button>
  );
}
