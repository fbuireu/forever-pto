'use client';

import '@styles/index.css';

import enMessages from '@i18n/messages/en.json';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import { cn } from '@ui/utils/utils';
import { bricolage, instrumentSerif, jetbrainsMono, spaceGrotesk } from '@app/fonts';
import { getLocaleFromPathname } from '@infrastructure/i18n/url';
import { NextIntlClientProvider } from 'next-intl';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import type { ErrorBoundaryProps } from '@ui/modules/pages/error/types';
import { usePathname } from 'next/navigation';

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
