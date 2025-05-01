'use client';

import useSWR, { SWRConfiguration, SWRResponse, Fetcher } from 'swr';
import useSWRInfinite, { SWRInfiniteConfiguration, SWRInfiniteResponse } from 'swr/infinite';
import useSWRMutation, { SWRMutationConfiguration, SWRMutationResponse } from 'swr/mutation';
import { api } from '@/services/api.service';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

/**
 * Default fetcher function for SWR
 */
export const defaultFetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url, { cache: true });
  return response.data;
};

/**
 * Enhanced SWR hook with error handling and toast notifications
 */
export function useSWRCache<Data = any, Error = any>(
  key: string | null,
  fetcher: Fetcher<Data, string> = defaultFetcher,
  options: SWRConfiguration<Data, Error> = {}
): SWRResponse<Data, Error> & { isLoading: boolean } {
  const { addToast } = useToast();
  
  // Set default options
  const defaultOptions: SWRConfiguration<Data, Error> = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
    ...options,
  };
  
  // Use SWR hook
  const result = useSWR<Data, Error>(key, fetcher, defaultOptions);
  
  // Handle errors with toast notifications
  useEffect(() => {
    if (result.error && !options.onError) {
      addToast({
        type: 'error',
        title: 'Error',
        message: result.error instanceof Error 
          ? result.error.message 
          : 'An error occurred while fetching data',
      });
    }
  }, [result.error, addToast, options.onError]);
  
  // Add isLoading property
  const isLoading = !result.error && !result.data && key !== null;
  
  return {
    ...result,
    isLoading,
  };
}

/**
 * Enhanced SWR Infinite hook for pagination
 */
export function useSWRInfiniteCache<Data = any, Error = any>(
  getKey: (pageIndex: number, previousPageData: Data | null) => string | null,
  fetcher: Fetcher<Data, string> = defaultFetcher,
  options: SWRInfiniteConfiguration<Data, Error> = {}
): SWRInfiniteResponse<Data, Error> & { isLoading: boolean } {
  const { addToast } = useToast();
  
  // Set default options
  const defaultOptions: SWRInfiniteConfiguration<Data, Error> = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
    errorRetryCount: 3,
    ...options,
  };
  
  // Use SWR Infinite hook
  const result = useSWRInfinite<Data, Error>(getKey, fetcher, defaultOptions);
  
  // Handle errors with toast notifications
  useEffect(() => {
    if (result.error && !options.onError) {
      addToast({
        type: 'error',
        title: 'Error',
        message: result.error instanceof Error 
          ? result.error.message 
          : 'An error occurred while fetching data',
      });
    }
  }, [result.error, addToast, options.onError]);
  
  // Add isLoading property
  const isLoading = !result.error && !result.data;
  
  return {
    ...result,
    isLoading,
  };
}

/**
 * Enhanced SWR Mutation hook for data mutations
 */
export function useSWRMutationCache<Data = any, Error = any, Variables = any>(
  key: string,
  fetcher: (url: string, { arg }: { arg: Variables }) => Promise<Data>,
  options: SWRMutationConfiguration<Data, Error, Variables> = {}
): SWRMutationResponse<Data, Error, Variables> {
  const { addToast } = useToast();
  
  // Set default options
  const defaultOptions: SWRMutationConfiguration<Data, Error, Variables> = {
    revalidate: true,
    populateCache: true,
    ...options,
  };
  
  // Use SWR Mutation hook
  const result = useSWRMutation<Data, Error, Variables>(key, fetcher, defaultOptions);
  
  // Handle errors with toast notifications
  useEffect(() => {
    if (result.error && !options.onError) {
      addToast({
        type: 'error',
        title: 'Error',
        message: result.error instanceof Error 
          ? result.error.message 
          : 'An error occurred while updating data',
      });
    }
  }, [result.error, addToast, options.onError]);
  
  return result;
}
