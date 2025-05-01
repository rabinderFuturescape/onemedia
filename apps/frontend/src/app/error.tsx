'use client';

import { useEffect } from 'react';
import { FormButton } from '@/components/ui/Form';
import { errorService, ErrorCategory } from '@/services/error.service';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to the error service
    errorService.handleApiError({
      message: error.message,
      stack: error.stack,
      category: ErrorCategory.UNKNOWN,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-block p-4 bg-red-100 dark:bg-red-900 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Something went wrong!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
          We're sorry, but we encountered an unexpected error.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-left overflow-auto max-h-60">
            <p className="text-red-600 dark:text-red-400 font-medium">{error.message}</p>
            {error.digest && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <FormButton
            variant="primary"
            onClick={reset}
            startIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Try Again
          </FormButton>
        </div>
      </div>
    </div>
  );
}
