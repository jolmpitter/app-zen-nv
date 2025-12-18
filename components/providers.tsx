'use client';

import { SessionProvider } from 'next-auth/react';
import { EnterpriseThemeProvider } from './providers/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EnterpriseThemeProvider>
        {children}
      </EnterpriseThemeProvider>
    </SessionProvider>
  );
}
