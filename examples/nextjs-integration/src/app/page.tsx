'use client';

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading, isAuthenticated, logout, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">onesso Demo App</h1>
        
        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-100 p-4">
              <h2 className="mb-2 text-xl font-semibold">Welcome, {user.name}!</h2>
              <p className="text-gray-700">Email: {user.email}</p>
              {user.tenant_id && (
                <p className="text-gray-700">Tenant: {user.tenant_id}</p>
              )}
              {user.roles && (
                <div className="mt-2">
                  <p className="font-medium">Roles:</p>
                  <ul className="list-inside list-disc">
                    {user.roles.map((role: string) => (
                      <li key={role} className="text-gray-700">{role}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Link 
                href="/dashboard" 
                className="rounded bg-blue-500 px-4 py-2 text-center font-medium text-white hover:bg-blue-600"
              >
                Go to Dashboard
              </Link>
              
              {hasRole('admin') && (
                <Link 
                  href="/admin" 
                  className="rounded bg-purple-500 px-4 py-2 text-center font-medium text-white hover:bg-purple-600"
                >
                  Admin Panel
                </Link>
              )}
              
              <button
                onClick={() => logout()}
                className="rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-center text-gray-700">
              Please log in to access the application.
            </p>
            <Link
              href="/auth/login"
              className="rounded bg-blue-500 px-4 py-2 text-center font-medium text-white hover:bg-blue-600"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
