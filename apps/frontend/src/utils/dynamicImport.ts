import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/Loading';

/**
 * Dynamically import a component with custom loading
 */
export function dynamicImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
  } = {}
) {
  const { loading, ssr = false } = options;
  
  return dynamic(importFunc, {
    loading: loading || (() => (
      <div className="flex justify-center items-center p-4 h-full min-h-[100px]">
        <LoadingSpinner size="medium" />
      </div>
    )),
    ssr,
  });
}
