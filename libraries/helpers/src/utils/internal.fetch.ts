import { customFetch } from './custom.fetch.func';
import { cookies } from 'next/headers';

export const internalFetch = (url: string, options: RequestInit = {}) => {
  // Use the mock API URL in development
  const baseUrl = process.env.NODE_ENV === 'development'
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4200/api/mock')
    : process.env.BACKEND_INTERNAL_URL!;

  return customFetch(
    { baseUrl },
    cookies()?.get('auth')?.value!,
    cookies()?.get('showorg')?.value!
  )(url, options);
};
