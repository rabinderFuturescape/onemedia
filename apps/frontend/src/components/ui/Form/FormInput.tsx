'use client';

import React, { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      label,
      helperText,
      startIcon,
      endIcon,
      fullWidth = false,
      className = '',
      error,
      ...rest
    },
    ref
  ) => {
    const formContext = useFormContext();
    const isFormControlled = !!formContext && name ? true : false;

    // Base classes
    const inputWrapperClasses = `relative rounded-md shadow-sm ${
      fullWidth ? 'w-full' : ''
    }`;
    
    const inputClasses = `block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
      startIcon ? 'pl-10' : ''
    } ${endIcon ? 'pr-10' : ''} ${
      error ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''
    } ${fullWidth ? 'w-full' : ''} ${className}`;

    // Render with form context if available
    if (isFormControlled) {
      return (
        <Controller
          control={formContext.control}
          name={name}
          render={({ field, fieldState: { error } }) => (
            <div className="mb-4">
              {label && (
                <label
                  htmlFor={name}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {label}
                </label>
              )}
              <div className={inputWrapperClasses}>
                {startIcon && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {startIcon}
                  </div>
                )}
                <input
                  id={name}
                  className={inputClasses}
                  ref={ref}
                  {...field}
                  {...rest}
                />
                {endIcon && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {endIcon}
                  </div>
                )}
              </div>
              {(error?.message || helperText) && (
                <p
                  className={`mt-1 text-sm ${
                    error?.message ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {error?.message || helperText}
                </p>
              )}
            </div>
          )}
        />
      );
    }

    // Render without form context
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className={inputWrapperClasses}>
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {startIcon}
            </div>
          )}
          <input
            id={name}
            name={name}
            className={inputClasses}
            ref={ref}
            {...rest}
          />
          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {endIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={`mt-1 text-sm ${
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
