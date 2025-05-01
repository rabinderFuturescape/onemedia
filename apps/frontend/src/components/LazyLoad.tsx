'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './ui/Loading';

interface LazyLoadProps {
  fallback?: React.ReactNode;
}

/**
 * Higher-order component for lazy loading components
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadProps = {}
) {
  const LazyComponent = lazy(importFunc);
  
  const fallback = options.fallback || (
    <div className="flex justify-center items-center p-4 h-full min-h-[100px]">
      <LoadingSpinner size="medium" />
    </div>
  );
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
