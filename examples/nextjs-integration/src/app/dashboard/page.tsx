'use client';

import { useAuth } from '@/contexts/auth-context';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { data: session } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      fetchUserData();
    }
  }, [isAuthenticated, session]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2">Please log in to view this page.</p>
          <Link 
            href="/auth/login" 
            className="mt-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link 
          href="/" 
          className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Back to Home
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">User Profile</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            {user.tenant_id && (
              <p><span className="font-medium">Tenant:</span> {user.tenant_id}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">API Data</h2>
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <div className="rounded bg-red-100 p-3 text-red-700">
              <p>Error: {error}</p>
              <button 
                onClick={fetchUserData}
                className="mt-2 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          ) : userData ? (
            <pre className="overflow-auto rounded bg-gray-100 p-3 text-sm">
              {JSON.stringify(userData, null, 2)}
            </pre>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
