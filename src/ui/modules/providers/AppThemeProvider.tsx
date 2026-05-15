'use client';

import { ThemeProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function AppThemeProvider({ children }: Pick<ComponentProps<typeof ThemeProvider>, 'children'>) {
  return (
    <ThemeProvider attribute='data-theme' defaultTheme='light' storageKey='theme' enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
