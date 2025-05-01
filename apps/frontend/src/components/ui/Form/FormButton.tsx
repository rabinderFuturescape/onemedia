'use client';

import React, { forwardRef } from 'react';
import { LoadingSpinner } from '../Loading';

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
}

export const FormButton = forwardRef<HTMLButtonElement, FormButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      startIcon,
      endIcon,
      loading = false,
      loadingText,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    // Variant classes
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
      info: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    };

    // Size classes
    const sizeClasses = {
      small: 'px-2.5 py-1.5 text-xs',
      medium: 'px-4 py-2 text-sm',
      large: 'px-6 py-3 text-base',
    };

    // Spinner color based on variant
    const spinnerColor = variant === 'outline' ? 'primary' : 'white';

    // Spinner size based on button size
    const spinnerSize = size === 'large' ? 'medium' : 'small';

    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-md font-medium
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-colors duration-200 ease-in-out
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <>
            <LoadingSpinner size={spinnerSize} color={spinnerColor} className="mr-2" />
            {loadingText || children}
          </>
        ) : (
          <>
            {startIcon && <span className="mr-2">{startIcon}</span>}
            {children}
            {endIcon && <span className="ml-2">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
