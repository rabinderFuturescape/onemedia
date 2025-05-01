'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FormButton } from '@/components/ui/Form';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    // Log the error
    console.error('Authentication error:', error);
  }, [error]);

  // Get error message based on error code
  const getErrorMessage = () => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.';
      case 'OAuthSignin':
        return 'Error occurred while signing in with OAuth provider.';
      case 'OAuthCallback':
        return 'Error occurred while processing the OAuth callback.';
      case 'OAuthCreateAccount':
        return 'Error occurred while creating your account.';
      case 'EmailCreateAccount':
        return 'Error occurred while creating your account with email.';
      case 'Callback':
        return 'Error occurred during the authentication callback.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in using the original provider.';
      case 'EmailSignin':
        return 'Error sending the email. Please try again.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to access this resource.';
      case 'Verification':
        return 'The verification token has expired or is invalid.';
      case 'token_expired':
        return 'Your session has expired. Please sign in again.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-block p-4 bg-red-100 dark:bg-red-900 rounded-full mb-4">
          <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Authentication Error</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
          {getErrorMessage()}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <FormButton
            variant="primary"
            onClick={() => router.push('/auth/login')}
            startIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            }
          >
            Back to Login
          </FormButton>
          <Link href="/" passHref>
            <FormButton
              variant="outline"
              startIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            >
              Go Home
            </FormButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
