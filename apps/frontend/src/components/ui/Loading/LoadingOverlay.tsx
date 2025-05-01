'use client';

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  blur?: boolean;
  spinnerSize?: 'small' | 'medium' | 'large';
  spinnerColor?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  text = 'Loading...',
  blur = true,
  spinnerSize = 'large',
  spinnerColor = 'primary',
  className = '',
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isLoading && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center z-50 ${
            blur ? 'backdrop-blur-sm bg-white/50 dark:bg-gray-900/50' : 'bg-white/80 dark:bg-gray-900/80'
          }`}
        >
          <LoadingSpinner size={spinnerSize} color={spinnerColor} />
          {text && (
            <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">{text}</p>
          )}
        </div>
      )}
    </div>
  );
}
