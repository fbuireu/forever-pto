'use client';

import '@styles/index.css';

import enMessages from '@i18n/messages/en.json';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import { cn } from '@ui/utils/utils';
import { bricolage, instrumentSerif, jetbrainsMono, spaceGrotesk } from '@app/fonts';
import { NextIntlClientProvider } from 'next-intl';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import type { ErrorBoundaryProps } from '@ui/modules/pages/error/types';

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn(
          bricolage.variable,
          spaceGrotesk.variable,
          instrumentSerif.variable,
          jetbrainsMono.variable,
          'font-sans antialiased'
        )}
      >
        <NextIntlClientProvider locale='en' messages={enMessages}>
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
