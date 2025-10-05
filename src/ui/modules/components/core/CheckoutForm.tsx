import { DiscountInfo } from '@application/dto/payment/types';
import { Button } from '@const/components/ui/button';
import { confirmPayment } from '@infrastructure/services/payments/checkout';
import { formatDiscountText } from '@infrastructure/services/payments/utils/helpers';
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { ChevronLeft } from 'lucide-react';
import { FormEvent, useCallback, useMemo, useState, useTransition } from 'react';
import { ExpressCheckoutSkeleton } from '../skeletons/ExpressCheckoutSkeleton';

interface CheckoutFormProps {
  amount: number;
  email: string;
  discountInfo: DiscountInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutForm({ amount, email, discountInfo, onSuccess, onCancel }: Readonly<CheckoutFormProps>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isExpressReady, setIsExpressReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      onSuccess();
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
      <div className='flex items-center justify-between'>
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
              <ExpressCheckoutElement
                onConfirm={handleExpressCheckout}
                onReady={() =>  setIsExpressReady(true)}
              />
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
          {isPending ? 'Processing...' : `Pay €${formattedAmount}`}
        </Button>
      </form>
    </div>
  );
}
