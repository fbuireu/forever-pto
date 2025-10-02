'use client';

import { DiscountInfo } from '@application/dto/payment/types';
import { Button } from '@const/components/ui/button';
import { Skeleton } from '@const/components/ui/skeleton';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { FormEvent, useCallback, useMemo, useState } from 'react';

interface CheckoutFormProps {
  amount: number;
  email: string;
  discountInfo: DiscountInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ amount, email, discountInfo, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedAmount = useMemo(() => amount.toFixed(2), [amount]);

  const discountText = useMemo(() => {
    if (!discountInfo) return null;

    const value = discountInfo.type === 'percent' ? `${discountInfo.value}%` : `€${discountInfo.value.toFixed(2)}`;

    return `${value} discount applied`;
  }, [discountInfo]);

  const processPayment = useCallback(
    async (stripe: Stripe, elements: StripeElements): Promise<string | null> => {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        return submitError.message || 'An error occurred during submission';
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          receipt_email: email,
        },
      });

      return error ? error.message || 'An error occurred during payment' : null;
    },
    [email]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) return;

      setIsLoading(true);
      setErrorMessage(null);

      const error = await processPayment(stripe, elements);

      if (error) {
        setErrorMessage(error);
        setIsLoading(false);
      } else {
        onSuccess();
      }
    },
    [stripe, elements, processPayment, onSuccess]
  );

  const isDisabled = !stripe || isLoading || !isReady;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between pb-4 border-b'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onCancel}
          disabled={isLoading}
          className='gap-2'
          aria-label='Go back to donation form'
        >
          <ChevronLeft className='w-4 h-4' aria-hidden='true' />
          Back
        </Button>

        <div className='text-right'>
          <p className='text-sm text-muted-foreground'>Total amount</p>
          <p className='text-2xl font-bold' aria-live='polite'>
            €{formattedAmount}
          </p>
          {discountText && (
            <p className='text-xs text-green-600 dark:text-green-400' aria-live='polite'>
              {discountText}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {!isReady && (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        )}

        <div className={!isReady ? 'hidden' : undefined}>
          <PaymentElement onReady={() => setIsReady(true)} />
        </div>

        {errorMessage && (
          <div role='alert' className='rounded-md bg-destructive/10 border border-destructive/20 p-3'>
            <p className='text-sm text-destructive'>{errorMessage}</p>
          </div>
        )}

        <Button
          type='submit'
          disabled={isDisabled}
          className='w-full bg-green-600 hover:bg-green-700'
          aria-busy={isLoading}
        >
          {isLoading ? 'Processing...' : `Pay €${formattedAmount}`}
        </Button>
      </form>
    </div>
  );
}

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  email: string;
  discountInfo: DiscountInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
  stripe: Promise<Stripe | null>;
}

export default function PaymentForm({
  clientSecret,
  amount,
  email,
  discountInfo,
  stripe,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const { resolvedTheme } = useTheme();

  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: resolvedTheme === 'dark' ? 'night' : 'stripe',
      } as const,
    }),
    [clientSecret, resolvedTheme]
  );

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      <CheckoutForm
        amount={amount}
        email={email}
        discountInfo={discountInfo}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
