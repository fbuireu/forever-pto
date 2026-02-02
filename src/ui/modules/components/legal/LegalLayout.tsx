import { Card, CardContent, CardHeader, CardTitle } from '@const/components/ui/card';
import { getTranslations } from 'next-intl/server';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalLayout = async ({ title, lastUpdated, children }: LegalLayoutProps) => {
  const t = await getTranslations('legal');

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
