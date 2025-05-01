'use client';

import React from 'react';
import { useToast } from './ToastContext';
import { ToastItem } from './ToastItem';
import { createPortal } from 'react-dom';

export function ToastContainer() {
  const { toasts } = useToast();
  
  // Use createPortal to render toasts at the top level of the DOM
  if (typeof window === 'undefined') {
    return null;
  }
  
  return createPortal(
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  );
}
