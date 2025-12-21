import { Link } from '@application/i18n/navigtion';
import { Button } from '@const/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@const/components/ui/card';
import { getStripeServerInstance } from '@infrastructure/clients/payments/stripe/client';
import { log } from '@logtail/next';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Locale } from 'next-intl';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

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
    log.warn('Failed to format currency symbol', {
      locale,
      currency,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return currency;
  }
};

function PaymentError() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background'>
      <Card className='w-full max-w-md border-destructive/50'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
            <XCircle className='h-6 w-6 text-destructive' />
          </div>
          <CardTitle className='text-destructive'>Payment Failed</CardTitle>
          <CardDescription>We couldn&apos;t process your payment. You have not been charged.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg bg-muted p-4 text-sm text-muted-foreground'>
            <p className='mb-2 font-medium text-foreground'>What happened?</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>Your payment may have been declined</li>
              <li>Authentication may have failed</li>
              <li>The session may have expired</li>
            </ul>
          </div>
          <div className='flex flex-col gap-2'>
            <Button asChild className='w-full'>
              <Link href='/'>Return to homepage</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PaymentSuccessPage({ searchParams, params }: Readonly<PaymentSuccessParams>) {
  const stripe = getStripeServerInstance();
  const logger = getBetterStackInstance();
  const [{ payment_intent: paymentIntentId }, { locale }] = await Promise.all([
    searchParams,
    params,
  ]);

  if (!paymentIntentId) {
    log.warn('Payment success page accessed without payment_intent, redirecting to home');
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
    log.warn('Payment intent not succeeded', {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
    return <PaymentError />;
  }

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
          <CardTitle className='text-green-600 dark:text-green-400'>Payment Successful!</CardTitle>
          <CardDescription>Thank you for your support</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-lg bg-muted p-4 space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Amount paid</span>
              <span className='font-medium'>
                {currencySymbol}
                {amount.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Status</span>
              <span className='font-medium text-green-600 dark:text-green-400'>Confirmed</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Payment ID</span>
              <span className='font-mono text-xs text-muted-foreground'>{paymentIntentId.slice(0, 20)}...</span>
            </div>
          </div>

          <div className='rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm'>
            <p className='text-green-700 dark:text-green-300'>
              Your premium access has been activated. You can now enjoy all premium features!
            </p>
          </div>

          <Button asChild className='w-full bg-green-600 hover:bg-green-700'>
            <Link href='/'>Continue to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
