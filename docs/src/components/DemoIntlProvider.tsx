import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

export const DemoIntlProvider = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale='en' messages={{}}>
    {children}
  </NextIntlClientProvider>
);
