'use client';

import React from 'react';
import { FormButton, FormInput, FormSelect } from '@/components/ui/Form';
import { LoadingSpinner, LoadingOverlay, Skeleton, SkeletonText } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';

/**
 * Design System Page
 * Showcases the component library and design system
 */
export default function DesignSystem() {
  const { addToast } = useToast();

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    addToast({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Toast`,
      message: `This is a ${type} toast message.`,
      duration: 5000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Design System</h1>
      <p className="mb-8">
        This page showcases the component library and design system for the Postiz application.
      </p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="text-gray-500">text-4xl font-bold</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <p className="text-gray-500">text-3xl font-bold</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <p className="text-gray-500">text-2xl font-bold</p>
          </div>
          <div>
            <h4 className="text-xl font-bold">Heading 4</h4>
            <p className="text-gray-500">text-xl font-bold</p>
          </div>
          <div>
            <p className="text-base">Body Text</p>
            <p className="text-gray-500">text-base</p>
          </div>
          <div>
            <p className="text-sm">Small Text</p>
            <p className="text-gray-500">text-sm</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-600 text-white rounded">
            <p className="font-bold">Primary</p>
            <p className="text-sm">bg-blue-600</p>
          </div>
          <div className="p-4 bg-gray-600 text-white rounded">
            <p className="font-bold">Secondary</p>
            <p className="text-sm">bg-gray-600</p>
          </div>
          <div className="p-4 bg-red-600 text-white rounded">
            <p className="font-bold">Danger</p>
            <p className="text-sm">bg-red-600</p>
          </div>
          <div className="p-4 bg-green-600 text-white rounded">
            <p className="font-bold">Success</p>
            <p className="text-sm">bg-green-600</p>
          </div>
          <div className="p-4 bg-yellow-600 text-white rounded">
            <p className="font-bold">Warning</p>
            <p className="text-sm">bg-yellow-600</p>
          </div>
          <div className="p-4 bg-indigo-600 text-white rounded">
            <p className="font-bold">Info</p>
            <p className="text-sm">bg-indigo-600</p>
          </div>
          <div className="p-4 bg-gray-100 text-gray-800 rounded">
            <p className="font-bold">Light</p>
            <p className="text-sm">bg-gray-100</p>
          </div>
          <div className="p-4 bg-gray-800 text-white rounded">
            <p className="font-bold">Dark</p>
            <p className="text-sm">bg-gray-800</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Button Variants</h3>
            <div className="flex flex-wrap gap-4">
              <FormButton variant="primary">Primary</FormButton>
              <FormButton variant="secondary">Secondary</FormButton>
              <FormButton variant="outline">Outline</FormButton>
              <FormButton variant="danger">Danger</FormButton>
              <FormButton variant="success">Success</FormButton>
              <FormButton variant="warning">Warning</FormButton>
              <FormButton variant="info">Info</FormButton>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Button Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <FormButton variant="primary" size="small">Small</FormButton>
              <FormButton variant="primary" size="medium">Medium</FormButton>
              <FormButton variant="primary" size="large">Large</FormButton>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Button States</h3>
            <div className="flex flex-wrap gap-4">
              <FormButton variant="primary">Normal</FormButton>
              <FormButton variant="primary" disabled>Disabled</FormButton>
              <FormButton variant="primary" loading>Loading</FormButton>
              <FormButton
                variant="primary"
                startIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                With Icon
              </FormButton>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Form Elements</h2>
        <div className="space-y-6 max-w-md">
          <div>
            <h3 className="text-xl font-bold mb-2">Text Input</h3>
            <FormInput
              name="name"
              label="Name"
              placeholder="Enter your name"
              helperText="This is a helper text"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Text Input with Error</h3>
            <FormInput
              name="email"
              label="Email"
              placeholder="Enter your email"
              error="Invalid email address"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Text Input with Icon</h3>
            <FormInput
              name="search"
              label="Search"
              placeholder="Search..."
              startIcon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Select</h3>
            <FormSelect
              name="role"
              label="Role"
              options={[
                { value: '', label: 'Select a role', disabled: true },
                { value: 'USER', label: 'User' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'SUPERADMIN', label: 'Super Admin' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Loading States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Spinner</h3>
            <div className="flex items-center gap-4">
              <LoadingSpinner size="small" />
              <LoadingSpinner size="medium" />
              <LoadingSpinner size="large" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Loading Overlay</h3>
            <div className="relative h-40 w-full max-w-md border border-gray-200 rounded-md">
              <LoadingOverlay isLoading={true}>
                <div className="p-4">
                  <p>This content is behind a loading overlay.</p>
                </div>
              </LoadingOverlay>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">Skeleton Loaders</h3>
            <div className="space-y-4 max-w-md">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-2/3" />
              <div className="flex gap-4 items-center">
                <Skeleton variant="circular" width={50} height={50} />
                <SkeletonText lines={2} className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Toast Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <FormButton variant="success" onClick={() => showToast('success')}>
            Show Success Toast
          </FormButton>
          <FormButton variant="danger" onClick={() => showToast('error')}>
            Show Error Toast
          </FormButton>
          <FormButton variant="warning" onClick={() => showToast('warning')}>
            Show Warning Toast
          </FormButton>
          <FormButton variant="info" onClick={() => showToast('info')}>
            Show Info Toast
          </FormButton>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Basic Card</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This is a basic card component with a title and content.
              </p>
              <FormButton variant="primary">Action</FormButton>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <img
              src="https://via.placeholder.com/400x200"
              alt="Placeholder"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Card with Image</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This card includes an image at the top.
              </p>
              <FormButton variant="primary">Action</FormButton>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Card with Footer</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This card includes a footer section.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last updated: 3 days ago</span>
                <FormButton variant="outline" size="small">View</FormButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
