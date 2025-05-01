'use client';

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';
import { api, RequestOptions } from '@/services/api.service';

/**
 * Custom hook for data fetching with SWR
 */
export function useApiQuery<T = any, E = any>(
  path: string | null,
  options?: RequestOptions,
  swrOptions?: SWRConfiguration<T, E>
): SWRResponse<T, E> {
  const fetcher = async (url: string) => {
    const response = await api.get<T>(url, options);
    return response.data;
  };

  return useSWR<T, E>(
    path,
    fetcher,
    {
      revalidateOnFocus: false,
      ...swrOptions,
    }
  );
}

/**
 * Custom hook for data mutation with SWR
 */
export function useApiMutation<T = any, E = any>(
  path: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: RequestOptions,
  swrOptions?: SWRMutationConfiguration<T, E, string, any>
) {
  const fetcher = async (url: string, { arg }: { arg: any }) => {
    const response = await api[method]<T>(url, arg, options);
    return response.data;
  };

  return useSWRMutation<T, E, string, any>(path, fetcher, swrOptions);
}

/**
 * Custom hook for paginated data fetching
 */
export function useApiPagination<T = any, E = any>(
  basePath: string,
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, any>,
  options?: RequestOptions,
  swrOptions?: SWRConfiguration<T, E>
) {
  const params = {
    page,
    limit,
    ...filters,
  };

  const { data, error, isLoading, isValidating, mutate } = useApiQuery<T, E>(
    basePath,
    { ...options, params },
    swrOptions
  );

  const goToPage = (newPage: number) => {
    return mutate(
      async () => {
        const response = await api.get<T>(basePath, {
          ...options,
          params: { ...params, page: newPage },
        });
        return response.data;
      },
      {
        optimisticData: data,
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      }
    );
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    goToPage,
    currentPage: page,
    pageSize: limit,
  };
}

/**
 * Custom hook for infinite scrolling
 */
export function useApiInfinite<T = any, E = any>(
  basePath: string,
  getKey: (pageIndex: number, previousPageData: T | null) => string | null,
  options?: RequestOptions,
  swrOptions?: SWRConfiguration<T, E>
) {
  const fetcher = async (url: string) => {
    const response = await api.get<T>(url, options);
    return response.data;
  };

  return useSWR<T, E>(
    getKey(0, null),
    fetcher,
    {
      revalidateOnFocus: false,
      ...swrOptions,
    }
  );
}
