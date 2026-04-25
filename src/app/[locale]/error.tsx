'use client';

import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Button } from '@ui/modules/core/primitives/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

const logger = getBetterStackInstance();

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations('error');

  useEffect(() => {
    logger.logError('Unhandled error caught by error boundary', error, {
      component: 'ErrorPage',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background m-auto'>
      <Card className='w-full max-w-md border-destructive/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <AlertTriangle className='h-6 w-6 text-destructive' />
          </div>
          <CardTitle className='text-destructive'>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-2'>
          <Button onClick={reset} variant='outline' className='w-full'>
            {t('retry')}
          </Button>
          <Button asChild className='w-full'>
            <Link href='/'>{t('returnHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
