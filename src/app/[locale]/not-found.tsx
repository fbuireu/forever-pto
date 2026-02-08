import { Link } from '@application/i18n/navigtion';
import { Button } from '@const/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background m-auto'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
            <FileQuestion className='h-6 w-6 text-muted-foreground' />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className='w-full'>
            <Link href='/'>{t('returnHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
