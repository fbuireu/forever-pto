import { DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { Button } from '@const/components/ui/button';
import { confirmPayment } from '@infrastructure/services/payments/checkout';
import { formatDiscountText } from '@infrastructure/services/payments/utils/helpers';
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ChevronLeft } from 'src/components/animate-ui/icons/chevron-left';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { useShallow } from 'zustand/react/shallow';
import { ExpressCheckoutSkeleton } from '../skeletons/ExpressCheckoutSkeleton';

interface CheckoutFormProps {
  amount: number;
  email: string;
  discountInfo: DiscountInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ConfettiCannon = dynamic(() => import('./ConfettiCannon').then((module) => ({ default: module.ConfettiCannon })));

export function CheckoutForm({ amount, email, discountInfo, onSuccess, onCancel }: Readonly<CheckoutFormProps>) {
  const stripe = useStripe();
  const elements = useElements();
  const locale = useLocale();
  const [isExpressReady, setIsExpressReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const { getCurrencyFromLocale, currencySymbol } = usePremiumStore(
    useShallow((state) => ({
      getCurrencyFromLocale: state.getCurrencyFromLocale,
      currencySymbol: state.currencySymbol,
    }))
  );

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  const formattedAmount = useMemo(() => amount.toFixed(2), [amount]);
  const discountText = useMemo(() => formatDiscountText(discountInfo), [discountInfo]);

  const processPayment = useCallback(async () => {
    if (!stripe || !elements) return;

    setErrorMessage(null);

    const error = await confirmPayment({
      stripe,
      elements,
      email,
      returnUrl: `${window.location.origin}/payment/confirmation`,
    });

    if (error) {
      setErrorMessage(error);
    } else {
      setShowConfetti(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
  }, [stripe, elements, email, onSuccess]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      startTransition(async () => {
        await processPayment();
      });
    },
    [processPayment]
  );

  const handleExpressCheckout = useCallback(async () => {
    startTransition(async () => {
      await processPayment();
    });
  }, [processPayment]);

  return (
    <div className='space-y-4'>
      {showConfetti && <ConfettiCannon onComplete={() => setShowConfetti(false)} />}
      <div className='flex items-center justify-between'>
        <AnimateIcon animateOnHover>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onCancel}
            disabled={isPending}
            className='gap-2'
            aria-label='Go back to donation form'
          >
            <ChevronLeft className='w-4 h-4' aria-hidden='true' />
            Back
          </Button>
        </AnimateIcon>
        <div className='text-right'>
          <p className='text-sm text-muted-foreground'>Total amount</p>
          <p className='text-2xl font-bold' aria-live='polite'>
            {currencySymbol}
            {formattedAmount}
          </p>
          {discountText && (
            <p className='text-xs text-green-600 dark:text-green-400' aria-live='polite'>
              {discountText}
            </p>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='space-y-3'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-popover px-2 text-muted-foreground'>Express checkout</span>
            </div>
          </div>
          <div className='relative min-h-[48px]'>
            {!isExpressReady && <ExpressCheckoutSkeleton />}
            <div className={!isExpressReady ? 'invisible absolute inset-0' : 'visible'}>
              <ExpressCheckoutElement onConfirm={handleExpressCheckout} onReady={() => setIsExpressReady(true)} />
            </div>
          </div>
        </div>
        <div className='space-y-3'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-popover px-2 text-muted-foreground'>Or pay with card</span>
            </div>
          </div>

          <PaymentElement />
        </div>
        {errorMessage && <p className='text-sm text-destructive'>{errorMessage}</p>}
        <Button
          type='submit'
          disabled={!stripe || isPending || !elements}
          className='w-full bg-green-600 hover:bg-green-700'
          aria-busy={isPending}
        >
          {isPending ? 'Processing...' : `Pay ${currencySymbol}${formattedAmount}`}
        </Button>
      </form>
    </div>
  );
}
