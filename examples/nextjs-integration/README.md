# onesso NextAuth.js Integration Example

This is a sample Next.js application demonstrating integration with the onesso authentication service using NextAuth.js.

## Features

- Authentication with onesso (Keycloak)
- Protected routes
- Role-based access control
- API requests with authentication
- Token refresh

## Getting Started

### Prerequisites

- Node.js 18 or later
- onesso service running (see main repository)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Update the environment variables in the `.env.local` file
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXTAUTH_URL`: The URL of your Next.js application (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET`: A secret key for NextAuth.js (at least 32 characters)
- `ONESSO_URL`: The URL of the onesso service (e.g., `http://localhost:3002`)
- `ONESSO_CLIENT_ID`: The client ID for the onesso service (e.g., `onesso-public`)
- `ONESSO_CLIENT_SECRET`: The client secret for the onesso service (if required)

## Project Structure

- `src/lib/auth.ts`: NextAuth.js configuration
- `src/app/api/auth/[...nextauth]/route.ts`: NextAuth.js API route
- `src/contexts/auth-context.tsx`: Authentication context provider
- `src/middleware.ts`: Middleware for protecting routes
- `src/app/auth/login/page.tsx`: Login page
- `src/app/page.tsx`: Home page
- `src/app/dashboard/page.tsx`: Dashboard page (protected)
- `src/app/api/user/profile/route.ts`: Example API route with authentication

## Learn More

- [onesso Documentation](../../docs/onesso-implementation-plan.md)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Next.js Documentation](https://nextjs.org/docs)
