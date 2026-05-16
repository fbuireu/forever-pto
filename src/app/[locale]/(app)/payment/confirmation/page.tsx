import { Link } from '@application/i18n/navigation';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { AppLayer } from '@infrastructure/layers';
import { getPaymentConfirmation } from '@infrastructure/services/payments/getPaymentConfirmation';
import { Button } from '@ui/modules/core/primitives/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/modules/core/primitives/Card';
import { getCurrencySymbol } from '@ui/utils/currencies';
import { Effect } from 'effect';
import { CheckCircle2, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export { generateMetadata } from './metadata';

export const dynamic = 'force-dynamic';

interface PaymentSuccessParams {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
  params: Promise<{ locale: Locale }>;
}

async function PaymentError() {
  const t = await getTranslations('paymentConfirmation.failed');

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
      <Card className='w-full max-w-md border-destructive/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10'>
            <XCircle className='size-6 text-destructive' />
          </div>
          <CardTitle className='text-destructive'>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg bg-muted p-4 text-sm text-muted-foreground'>
            <p className='mb-2 font-medium text-foreground'>{t('whatHappened')}</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>{t('declined')}</li>
              <li>{t('authFailed')}</li>
              <li>{t('sessionExpired')}</li>
            </ul>
          </div>
          <div className='flex flex-col gap-2'>
            <Button asChild className='w-full'>
              <Link href='/'>{t('returnHome')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PaymentSuccessPage({ searchParams, params }: Readonly<PaymentSuccessParams>) {
  const logger = getBetterStackInstance();
  const [{ payment_intent: paymentIntentId }, { locale }] = await Promise.all([searchParams, params]);

  if (!paymentIntentId) {
    logger.warn('Payment success page accessed without payment_intent, redirecting to home');
    redirect(`/${locale}`);
  }

  const confirmation = await Effect.runPromise(getPaymentConfirmation(paymentIntentId).pipe(Effect.provide(AppLayer)));

  if (!confirmation || confirmation.status !== 'succeeded') {
    if (confirmation) {
      logger.warn('Payment intent not succeeded', {
        paymentIntentId: confirmation.id,
        status: confirmation.status,
        amount: confirmation.amount,
        currency: confirmation.currency,
      });
    }
    return <PaymentError />;
  }

  const t = await getTranslations('paymentConfirmation.success');
  const currencySymbol = getCurrencySymbol({ locale, currency: confirmation.currency });

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background m-auto'>
      <Card className='w-full max-w-md border-green-500/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10'>
            <CheckCircle2 className='size-6 text-green-500' />
          </div>
          <CardTitle className='text-green-600 dark:text-green-400'>{t('title')}</CardTitle>
          <CardDescription>{t('thankYou')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg bg-muted p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('amountPaid')}</span>
              <span className='font-medium'>
                {currencySymbol}
                {confirmation.amount.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('status')}</span>
              <span className='font-medium text-green-600 dark:text-green-400'>{t('confirmed')}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('paymentId')}</span>
              <span className='font-mono text-xs text-muted-foreground'>{confirmation.id.slice(0, 20)}...</span>
            </div>
          </div>

          <div className='rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm'>
            <p className='text-green-700 dark:text-green-300'>{t('premiumActivated')}</p>
          </div>

          <Button asChild className='w-full bg-green-600 hover:bg-green-700'>
            <Link href='/'>{t('continueHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
