'use client';

import { ReactNode, useState, useEffect } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if auth cookie exists
    const authCookie = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('auth='));

    setIsAuthenticated(!!authCookie);
    setIsLoading(false);

    // Log authentication status for debugging
    console.log('Auth cookie found:', !!authCookie);
  }, []);

  return (
    <div className="app-providers">
      {/* Add a simple loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}
      {children}
    </div>
  );
}
