# Folder Structure Guide

This document outlines the standardized folder structure for the Postiz application. Following these conventions ensures consistency across the codebase and makes it easier for developers to navigate and understand the project.

## Frontend Structure (Next.js)

```
apps/frontend/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Authentication routes (grouped)
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── ...
│   │   ├── (dashboard)/     # Dashboard routes (grouped)
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── posts/       # Posts management
│   │   │   └── ...
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Auth API routes
│   │   │   └── ...
│   │   └── ...
│   ├── components/          # Reusable components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── layout/          # Layout components
│   │   ├── ui/              # UI components
│   │   │   ├── Button/      # Button component
│   │   │   ├── Form/        # Form components
│   │   │   ├── Loading/     # Loading components
│   │   │   └── ...
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Service layer
│   │   ├── api.service.ts   # API service
│   │   ├── auth.service.ts  # Auth service
│   │   └── ...
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── cypress/                 # End-to-end tests
│   ├── e2e/                 # E2E test specs
│   └── ...
└── __tests__/               # Unit and integration tests
```

## Backend Structure (NestJS)

```
apps/backend/
├── src/
│   ├── controllers/         # API controllers
│   │   ├── auth/            # Auth controllers
│   │   ├── users/           # User controllers
│   │   └── ...
│   ├── decorators/          # Custom decorators
│   ├── dto/                 # Data Transfer Objects
│   ├── entities/            # Database entities
│   ├── filters/             # Exception filters
│   ├── guards/              # Auth guards
│   ├── interceptors/        # Interceptors
│   ├── middleware/          # Middleware
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Auth module
│   │   ├── users/           # Users module
│   │   └── ...
│   ├── pipes/               # Validation pipes
│   ├── repositories/        # Data repositories
│   ├── services/            # Business logic
│   │   ├── auth.service.ts  # Auth service
│   │   ├── users.service.ts # Users service
│   │   └── ...
│   ├── app.module.ts        # Main application module
│   └── main.ts              # Application entry point
└── test/                    # Tests
    ├── e2e/                 # End-to-end tests
    └── unit/                # Unit tests
```

## Shared Libraries

```
libs/
├── common/                  # Shared utilities and types
│   ├── src/
│   │   ├── constants/       # Shared constants
│   │   ├── dto/             # Shared DTOs
│   │   ├── interfaces/      # Shared interfaces
│   │   └── utils/           # Shared utility functions
│   └── ...
├── ui/                      # Shared UI components
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # UI-related hooks
│   │   └── styles/          # Shared styles
│   └── ...
└── ...
```

## Naming Conventions

### Files

- Use kebab-case for file names: `user-profile.component.tsx`
- Use descriptive names that indicate the file's purpose
- Use consistent suffixes to indicate file type:
  - `.component.tsx` for React components
  - `.service.ts` for services
  - `.hook.ts` for custom hooks
  - `.dto.ts` for DTOs
  - `.entity.ts` for database entities
  - `.test.tsx` or `.spec.tsx` for tests

### Components

- Use PascalCase for component names: `UserProfile`
- Use descriptive names that indicate the component's purpose
- Group related components in folders

### Functions and Variables

- Use camelCase for function and variable names: `getUserProfile`
- Use descriptive names that indicate the function's purpose
- Prefix boolean variables with `is`, `has`, or `should`: `isLoading`, `hasError`

### Constants

- Use UPPER_SNAKE_CASE for constants: `API_BASE_URL`
- Group related constants in separate files

## Import Order

Follow this order for imports:

1. External libraries
2. Internal modules
3. Components
4. Hooks
5. Services
6. Utils
7. Types
8. Styles

Example:

```typescript
// External libraries
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Internal modules
import { AppLayout } from '@/components/layout';

// Components
import { UserProfile } from '@/components/users';
import { Button } from '@/components/ui';

// Hooks
import { useUser } from '@/hooks/useUser';

// Services
import { userService } from '@/services/user.service';

// Utils
import { formatDate } from '@/utils';

// Types
import { User } from '@/types';

// Styles
import styles from './page.module.css';
```

## Best Practices

- Keep files small and focused on a single responsibility
- Group related functionality in folders
- Use index files to export from folders
- Use absolute imports with aliases
- Document complex functions and components
- Write tests for all components and functions
- Follow the principles of clean architecture
- Separate business logic from UI components
- Use TypeScript for type safety

By following these conventions, we ensure a consistent and maintainable codebase that is easy to navigate and understand.
