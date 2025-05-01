export const dynamic = 'force-dynamic';
import './global.scss';
import 'react-tooltip/dist/react-tooltip.css';
import '@copilotkit/react-ui/styles.css';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Providers } from '../components/providers';

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'] });

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="text-primary bg-primary">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
