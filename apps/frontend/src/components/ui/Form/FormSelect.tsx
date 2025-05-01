'use client';

import React, { forwardRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface OptionGroup {
  label: string;
  options: Option[];
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value'> {
  name: string;
  label?: string;
  helperText?: string;
  options: Option[] | OptionGroup[];
  fullWidth?: boolean;
  error?: string;
  value?: string | number;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      name,
      label,
      helperText,
      options,
      fullWidth = false,
      className = '',
      error,
      value,
      ...rest
    },
    ref
  ) => {
    const formContext = useFormContext();
    const isFormControlled = !!formContext && name ? true : false;

    // Check if options are grouped
    const isGrouped = options.length > 0 && 'options' in options[0];

    // Base classes
    const selectClasses = `block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
      error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
    } ${fullWidth ? 'w-full' : ''} ${className}`;

    // Render options
    const renderOptions = () => {
      if (isGrouped) {
        return (options as OptionGroup[]).map((group, groupIndex) => (
          <optgroup key={`group-${groupIndex}`} label={group.label}>
            {group.options.map((option, optionIndex) => (
              <option
                key={`option-${groupIndex}-${optionIndex}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </optgroup>
        ));
      }

      return (options as Option[]).map((option, index) => (
        <option
          key={`option-${index}`}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ));
    };

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
              <select
                id={name}
                className={selectClasses}
                ref={ref}
                {...field}
                {...rest}
              >
                {renderOptions()}
              </select>
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
        <select
          id={name}
          name={name}
          className={selectClasses}
          ref={ref}
          value={value}
          {...rest}
        >
          {renderOptions()}
        </select>
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
