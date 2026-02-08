import { Link } from '@application/i18n/navigtion';
import { Button } from '@const/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';

export { generateMetadata } from './metadata';

const stripe = getStripeServerInstance();
const logger = getBetterStackInstance();

interface PaymentSuccessParams {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
  params: Promise<{ locale: Locale }>;
}

const getCurrencySymbol = (locale: string, currency: string): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.formatToParts(0).find(({ type }) => type === 'currency')?.value ?? currency;
  } catch (error) {
    logger.warn('Failed to format currency symbol', {
      locale,
      currency,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return currency;
  }
};

async function PaymentError() {
  const t = await getTranslations('paymentConfirmation.failed');

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
      <Card className='w-full max-w-md border-destructive/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <XCircle className='h-6 w-6 text-destructive' />
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
  const [{ payment_intent: paymentIntentId }, { locale }] = await Promise.all([
    searchParams,
    params,
  ]);

  if (!paymentIntentId) {
    logger.warn('Payment success page accessed without payment_intent, redirecting to home');
    redirect('/');
  }

  let paymentIntent: Stripe.PaymentIntent;

  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logger.logError('Failed to retrieve payment intent', error, {
      paymentIntentId,
      page: 'PaymentConfirmation',
    });
    return <PaymentError />;
  }

  if (paymentIntent.status !== 'succeeded') {
    logger.warn('Payment intent not succeeded', {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
    return <PaymentError />;
  }

  const t = await getTranslations('paymentConfirmation.success');
  const amount = paymentIntent.amount / 100;
  const currency = paymentIntent.currency.toUpperCase();
  const currencySymbol = getCurrencySymbol(locale, currency);

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background m-auto'>
      <Card className='w-full max-w-md border-green-500/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10'>
            <CheckCircle2 className='h-6 w-6 text-green-500' />
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
                {amount.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('status')}</span>
              <span className='font-medium text-green-600 dark:text-green-400'>{t('confirmed')}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('paymentId')}</span>
              <span className='font-mono text-xs text-muted-foreground'>{paymentIntentId.slice(0, 20)}...</span>
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
