'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDescription, setErrorDescription] = useState<string>('');
  const error = searchParams.get('error');

  useEffect(() => {
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, { title: string; description: string }> = {
      'default': {
        title: 'Authentication error',
        description: 'An error occurred during authentication. Please try again.'
      },
      'configuration': {
        title: 'Server configuration error',
        description: 'There is a problem with the server configuration. Please contact support.'
      },
      'accessdenied': {
        title: 'Access denied',
        description: 'You do not have permission to sign in.'
      },
      'verification': {
        title: 'Email verification required',
        description: 'Please verify your email address before signing in.'
      },
      'token_expired': {
        title: 'Session expired',
        description: 'Your session has expired. Please sign in again.'
      },
      'InvalidRefreshToken': {
        title: 'Invalid session',
        description: 'Your session is no longer valid. Please sign in again.'
      },
      'NoRefreshTokenError': {
        title: 'Missing authentication data',
        description: 'Authentication data is missing. Please sign in again.'
      },
      'RefreshAccessTokenError': {
        title: 'Authentication error',
        description: 'There was a problem refreshing your session. Please sign in again.'
      }
    };

    const errorInfo = errorMessages[error || ''] || errorMessages['default'];
    setErrorMessage(errorInfo.title);
    setErrorDescription(errorInfo.description);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">{errorMessage}</h1>
          <p className="text-gray-600 dark:text-gray-300">{errorDescription}</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link
            href="/auth/login"
            className="rounded bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try signing in again
          </Link>
          
          <Link
            href="/"
            className="rounded border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
}
