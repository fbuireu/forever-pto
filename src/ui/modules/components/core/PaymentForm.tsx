'use client';

import { DiscountInfo } from '@application/dto/payment/types';
import { Button } from '@const/components/ui/button';
import { Skeleton } from '@const/components/ui/skeleton';
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe, StripeElements, StripeElementsOptions } from '@stripe/stripe-js';
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
  const [isExpressReady, setIsExpressReady] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
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
        redirect: 'if_required',
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

  const handleExpressCheckout = useCallback(
    async (event: any) => {
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

  const isDisabled = !stripe || isLoading || !elements;

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
        <div className='relative min-h-[48px]'>
          {!isExpressReady && (
            <div className='gap-2 flex'>
              <Skeleton className='h-12 flex-1' />
              <Skeleton className='h-12 flex-1' />
              <Skeleton className='h-12 flex-1' />
            </div>
          )}

          <div className={!isExpressReady ? 'invisible' : 'visible'}>
            <ExpressCheckoutElement onConfirm={handleExpressCheckout} onReady={() => setIsExpressReady(true)} />
          </div>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='relative bg-popover px-2 before:absolute before:right-full before:top-1/2 before:mr-4 before:h-px before:w-[100px] before:content-[""] after:absolute after:left-full after:top-1/2 after:ml-4 after:h-px after:w-[100px] after:content-[""]'>
              Or pay with card
            </span>
          </div>
        </div>

        <PaymentElement />

        {errorMessage && <p className='text-sm text-destructive'>{errorMessage}</p>}

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
  const isDark = resolvedTheme === 'dark';

  const elementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      loader: 'always',
      appearance: {
        theme: isDark ? 'night' : 'flat',
        variables: {
          colorPrimary: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 47.4% 11.2%)',
          colorBackground: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
          colorText: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
          colorDanger: isDark ? 'hsl(0 62.8% 60.6%)' : 'hsl(0 84.2% 60.2%)',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
          fontSizeBase: '14px',
        },
        rules: {
          '.Input': {
            backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
            border: isDark ? '1px solid hsl(240 3.7% 15.9%)' : '1px solid hsl(240 5.9% 90%)',
            padding: '8px 12px',
            fontSize: '14px',
            color: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          },
          '.Input:hover': {
            borderColor: isDark ? 'hsl(240 3.7% 20%)' : 'hsl(240 5.9% 85%)',
          },
          '.Input:focus': {
            border: isDark ? '1px solid hsl(240 3.7% 15.9%)' : '1px solid hsl(240 5.9% 90%)',
            boxShadow: isDark ? '0 0 0 3px hsl(240 3.7% 15.9%)' : '0 0 0 1px hsl(240 5.9% 10%)',
            outline: 'none',
          },
          '.Input--invalid': {
            border: isDark ? '1px solid hsl(0 62.8% 60.6%)' : '1px solid hsl(0 84.2% 60.2%)',
          },
          '.Input--invalid:focus': {
            border: isDark ? '1px solid hsl(0 62.8% 60.6%)' : '1px solid hsl(0 84.2% 60.2%)',
          },
          '.Input::placeholder': {
            color: isDark ? 'hsl(240 5% 64.9%)' : 'hsl(240 3.8% 46.1%)',
          },
          '.Input:disabled': {
            backgroundColor: isDark ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 4.8% 95.9%)',
            color: isDark ? 'hsl(240 5% 64.9%)' : 'hsl(240 3.8% 46.1%)',
            cursor: 'not-allowed',
            opacity: '0.5',
          },
          '.Label': {
            fontSize: '14px',
            fontWeight: '500',
            color: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
            marginBottom: '8px',
          },
          '.Error': {
            fontSize: '12px',
            color: isDark ? 'hsl(0 62.8% 60.6%)' : 'hsl(0 84.2% 60.2%)',
            border: 'none',
            marginTop: '6px',
            fontWeight: '500',
          },
          '.Tab': {
            backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
            border: isDark ? '1px solid hsl(240 3.7% 15.9%)' : '1px solid hsl(240 5.9% 90%)',
            boxShadow: 'none',
            color: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
            borderRadius: '6px',
            padding: '10px 16px',
            transition: 'all 0.2s',
          },
          '.Tab:hover': {
            backgroundColor: isDark ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 4.8% 95.9%)',
            borderColor: isDark ? 'hsl(240 3.7% 20%)' : 'hsl(240 5.9% 85%)',
          },
          '.Tab--selected': {
            backgroundColor: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
            color: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 98%)',
            border: isDark ? '1px solid hsl(0 0% 98%)' : '1px solid hsl(240 10% 3.9%)',
          },
          '.Tab--selected:hover': {
            backgroundColor: isDark ? 'hsl(240 5% 84%)' : 'hsl(240 5.9% 10%)',
            borderColor: isDark ? 'hsl(240 5% 84%)' : 'hsl(240 5.9% 10%)',
          },
          '.TabIcon': {
            fill: 'currentColor',
          },
          '.Block': {
            backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
            border: isDark ? '1px solid hsl(240 3.7% 15.9%)' : '1px solid hsl(240 5.9% 90%)',
            borderRadius: '8px',
          },
        },
      },
    }),
    [clientSecret, isDark]
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
