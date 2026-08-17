import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

export const DemoIntlProvider = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale='en' messages={{}}>
    {children}
  </NextIntlClientProvider>
);
