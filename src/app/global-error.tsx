'use client';

import '@styles/index.css';

import { bricolage, instrumentSerif, jetbrainsMono, spaceGrotesk } from '@app/fonts';
import enMessages from '@i18n/messages/en.json';
import { getLocaleFromPathname } from '@infrastructure/i18n/utils/url';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import type { ErrorBoundaryProps } from '@ui/modules/pages/error/types';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import { cn } from '@ui/utils/cn';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  const locale = getLocaleFromPathname(usePathname() ?? '');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          bricolage.variable,
          spaceGrotesk.variable,
          instrumentSerif.variable,
          jetbrainsMono.variable,
          'font-sans antialiased'
        )}
      >
        <NextIntlClientProvider locale={locale} messages={enMessages}>
          <AppThemeProvider>
            <LazyMotionProvider>
              <div className='min-h-screen flex flex-col text-foreground bg-background'>
                <ErrorContent error={error} reset={reset} />
              </div>
            </LazyMotionProvider>
          </AppThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
