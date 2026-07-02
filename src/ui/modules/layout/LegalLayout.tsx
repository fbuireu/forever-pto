import { Card, CardContent, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  locale: Locale;
  children: ReactNode;
}

export const LegalLayout = async ({ title, lastUpdated, locale, children }: LegalLayoutProps) => {
  const t = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl z-1'>
      <Card>
        <CardHeader>
          <CardTitle className='text-3xl font-bold'>{title}</CardTitle>
          <p className='text-sm text-muted-foreground'>{t('lastUpdated', { date: lastUpdated })}</p>
        </CardHeader>
        <CardContent className='prose prose-sm dark:prose-invert max-w-none'>{children}</CardContent>
      </Card>
    </div>
  );
};
