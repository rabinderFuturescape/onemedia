'use client';

import { useEffect, useState } from 'react';

export default function TestAuth() {
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get auth cookie
        const authCookie = document.cookie
          .split(';')
          .find((c) => c.trim().startsWith('auth='));

        // Test our custom endpoint
        const testResponse = await fetch('/api/auth/test', {
          credentials: 'include'
        });
        const testData = await testResponse.json();

        // Test session endpoint
        let sessionData = null;
        try {
          const sessionResponse = await fetch('/api/auth/session', {
            credentials: 'include'
          });

          if (sessionResponse.ok) {
            sessionData = await sessionResponse.json();
            console.log('Session data:', sessionData);
          } else {
            console.error('Session error:', sessionResponse.status, sessionResponse.statusText);
          }
        } catch (sessionError) {
          console.error('Session fetch error:', sessionError);
        }

        // Test user endpoint
        let userData = null;
        try {
          const userResponse = await fetch('/api/mock/user/self', {
            credentials: 'include'
          });

          if (userResponse.ok) {
            userData = await userResponse.json();
            console.log('User data:', userData);
          } else {
            console.error('User error:', userResponse.status, userResponse.statusText);
          }
        } catch (userError) {
          console.error('User fetch error:', userError);
        }

        setAuthData({
          authCookie: authCookie ? authCookie.split('=')[1] : null,
          testData,
          sessionData,
          userData,
          allCookies: document.cookie
        });
      } catch (err) {
        console.error('Auth test error:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Testing authentication...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Authentication Error</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
          <p className={`text-lg ${authData?.testData?.authenticated ? 'text-green-600' : 'text-red-600'}`}>
            {authData?.testData?.authenticated ? 'Authenticated ✅' : 'Not Authenticated ❌'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Auth Cookie</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{authData?.authCookie || 'No auth cookie found'}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">API Test Response</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(authData?.testData, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Session Data</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{authData?.sessionData ? JSON.stringify(authData.sessionData, null, 2) : 'No session data available'}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Data</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{authData?.userData ? JSON.stringify(authData.userData, null, 2) : 'No user data available'}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">All Cookies</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{authData?.allCookies}</pre>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
          <a
            href="/auth"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
