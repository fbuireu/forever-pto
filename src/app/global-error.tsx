'use client';

import '@styles/index.css';

import enMessages from '@i18n/messages/en.json';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { ErrorContent } from '@ui/modules/pages/error/ErrorContent';
import { cn } from '@ui/utils/utils';
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'], display: 'swap' });
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], display: 'swap' });

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
          <ThemeProvider
            attribute='data-theme'
            defaultTheme='system'
            storageKey='theme'
            enableSystem
            disableTransitionOnChange
          >
            <LazyMotionProvider>
              <div className='min-h-screen flex flex-col text-foreground bg-background'>
                <ErrorContent error={error} reset={reset} />
              </div>
            </LazyMotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
