'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) {
  // Base classes
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
  
  // Variant classes
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-md',
  };
  
  // Style for width and height
  const style: React.CSSProperties = {};
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  
  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineClassName?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function SkeletonText({
  lines = 3,
  className = '',
  lineClassName = '',
  animation = 'pulse',
}: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          animation={animation}
          className={`${index === lines - 1 ? 'w-4/5' : 'w-full'} ${lineClassName}`}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  hasImage?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  descriptionLines?: number;
  hasFooter?: boolean;
}

export function SkeletonCard({
  className = '',
  animation = 'pulse',
  hasImage = true,
  hasTitle = true,
  hasDescription = true,
  descriptionLines = 3,
  hasFooter = true,
}: SkeletonCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {hasImage && (
        <Skeleton
          variant="rectangular"
          animation={animation}
          className="w-full h-48"
        />
      )}
      <div className="p-4 space-y-4">
        {hasTitle && (
          <Skeleton
            variant="text"
            animation={animation}
            className="w-3/4 h-6"
          />
        )}
        {hasDescription && (
          <SkeletonText
            lines={descriptionLines}
            animation={animation}
          />
        )}
        {hasFooter && (
          <div className="flex justify-between items-center pt-2">
            <Skeleton
              variant="text"
              animation={animation}
              className="w-1/4 h-4"
            />
            <Skeleton
              variant="rounded"
              animation={animation}
              className="w-1/4 h-8"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  hasHeader?: boolean;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
  animation = 'pulse',
  hasHeader = true,
}: SkeletonTableProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {hasHeader && (
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={`header-${index}`} className="px-6 py-3">
                  <Skeleton
                    variant="text"
                    animation={animation}
                    className="h-5"
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={`cell-${rowIndex}-${colIndex}`} className="px-6 py-4">
                  <Skeleton
                    variant="text"
                    animation={animation}
                    className="h-4"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
