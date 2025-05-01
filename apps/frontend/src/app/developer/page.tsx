'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FormButton } from '@/components/ui/Form';
import { LoadingSpinner } from '@/components/ui/Loading';
import { PermissionGate } from '@/components/auth/PermissionGate';

/**
 * Developer Portal Page
 * Provides access to API documentation and developer resources
 */
export default function DeveloperPortal() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-3xl font-bold mb-4">Developer Portal</h1>
        <p className="mb-8 text-center max-w-md">
          Please sign in to access the developer portal and API documentation.
        </p>
        <Link href="/auth/login" passHref>
          <FormButton variant="primary">Sign In</FormButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Developer Portal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* API Documentation Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-2">API Documentation</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comprehensive documentation for the Postiz API with examples and schemas.
            </p>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <FormButton variant="primary">View Documentation</FormButton>
            </a>
          </div>
        </div>

        {/* API Keys Card */}
        <PermissionGate permissions="integrations:view">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">API Keys</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage your API keys for accessing the Postiz API.
              </p>
              <Link href="/settings/api-keys" passHref>
                <FormButton variant="primary">Manage API Keys</FormButton>
              </Link>
            </div>
          </div>
        </PermissionGate>

        {/* Webhooks Card */}
        <PermissionGate permissions="integrations:view">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Webhooks</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configure webhooks to receive real-time updates from Postiz.
              </p>
              <Link href="/settings/webhooks" passHref>
                <FormButton variant="primary">Manage Webhooks</FormButton>
              </Link>
            </div>
          </div>
        </PermissionGate>
      </div>

      <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Authentication</h3>
          <p className="mb-4">
            The Postiz API uses JWT tokens for authentication. You can obtain a token by:
          </p>
          <ol className="list-decimal list-inside mb-4 space-y-2">
            <li>Creating an API key in the API Keys section</li>
            <li>Using the key to request a JWT token from the <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">/api/auth/token</code> endpoint</li>
            <li>Including the token in the Authorization header of your requests</li>
          </ol>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <pre className="text-sm overflow-x-auto">
              {`curl -X POST https://api.postiz.app/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"apiKey": "your-api-key"}'`}
            </pre>
          </div>
          <p>
            The response will include a JWT token that you can use for subsequent requests.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Making API Requests</h3>
          <p className="mb-4">
            Once you have a JWT token, you can make requests to the API by including it in the Authorization header:
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <pre className="text-sm overflow-x-auto">
              {`curl -X GET https://api.postiz.app/posts \\
  -H "Authorization: Bearer your-jwt-token"`}
            </pre>
          </div>
          <p>
            Check the API documentation for details on available endpoints and request formats.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Rate Limits</h3>
          <p className="mb-4">
            API requests are subject to rate limits based on your subscription tier:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rate Limit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">FREE</td>
                  <td className="px-6 py-4 whitespace-nowrap">100 requests per minute</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">STANDARD</td>
                  <td className="px-6 py-4 whitespace-nowrap">300 requests per minute</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">PRO</td>
                  <td className="px-6 py-4 whitespace-nowrap">600 requests per minute</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">ULTIMATE</td>
                  <td className="px-6 py-4 whitespace-nowrap">1200 requests per minute</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">TEAM</td>
                  <td className="px-6 py-4 whitespace-nowrap">2000 requests per minute</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
