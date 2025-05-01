'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          setError('No token provided in the callback URL');
          setLoading(false);
          return;
        }

        // Store the token in localStorage for debugging
        localStorage.setItem('onesso_token', token);

        // Store the token in a cookie for the backend
        document.cookie = `auth=${token}; path=/; max-age=86400; SameSite=Lax`;

        // Redirect to main application dashboard
        // The middleware will redirect from / to either /launches or /analytics
        console.log('Authentication successful, redirecting to dashboard...');

        // Use window.location for a full page reload to ensure middleware runs
        window.location.href = '/';

        // Set loading to false
        setLoading(false);
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred during authentication');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Completing authentication...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
