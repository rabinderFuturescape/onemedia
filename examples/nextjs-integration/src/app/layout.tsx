import { AuthProvider } from '@/contexts/auth-context';
import { SessionProvider } from 'next-auth/react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'onesso Demo App',
  description: 'Demo application for onesso authentication service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
