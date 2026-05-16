import type { DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { useUIStore } from '@application/stores/ui';
import { track } from '@infrastructure/clients/logging/better-stack/tracking';
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { confirmPayment } from '@ui/adapters/payments/checkout';
import { ChevronLeft } from '@ui/modules/core/animate/icons/ChevronLeft';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { Button } from '@ui/modules/core/primitives/Button';
import { Skeleton } from 'boneyard-js/react';
import { AlertCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ExpressCheckoutFixture } from './ExpressCheckoutFixture';

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#10b981', '#059669', '#047857', '#065f46', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  };
  const fire = (particleRatio: number, opts: Record<string, unknown>) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

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
  const locale = useLocale();
  const t = useTranslations('checkout');
  const [isExpressReady, setIsExpressReady] = useState(false);
  const [hasExpressOptions, setHasExpressOptions] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { getCurrencyFromLocale, currencySymbol } = useUIStore(
    useShallow((state) => ({
      getCurrencyFromLocale: state.getCurrencyFromLocale,
      currencySymbol: state.currencySymbol,
    }))
  );
  const setPremiumStatus = usePremiumStore((state) => state.setPremiumStatus);

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  useEffect(() => {
    void import('canvas-confetti');
  }, []);

  const formattedAmount = useMemo(() => amount.toFixed(2), [amount]);
  const discountText = useMemo(() => {
    if (!discountInfo) return null;
    const saved = (discountInfo.originalAmount - discountInfo.finalAmount).toFixed(2);
    return t('promoSaved', { saved });
  }, [discountInfo, t]);

  const processPayment = useCallback(async () => {
    if (!stripe || !elements) return;

    setErrorMessage(null);

    const result = await confirmPayment({
      stripe,
      elements,
      email,
      returnUrl: `${globalThis.location.origin}/${locale}/payment/confirmation`,
    });

    if (!result.success) {
      const errorMsg = result.error ?? t('paymentFailed');
      setErrorMessage(errorMsg);
      track('payment_failed', { error: errorMsg });
    } else {
      if (result.sessionData) {
        setPremiumStatus({
          email: result.sessionData.email,
          premiumKey: result.sessionData.premiumKey,
        });
      }

      track('payment_completed', { amount });
      void fireConfetti();
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
  }, [stripe, elements, email, onSuccess, setPremiumStatus, t, locale, amount]);

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
        <AnimateIcon animateOnHover>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onCancel}
            disabled={isPending}
            className='gap-2'
            aria-label={t('goBackToDonation')}
          >
            <ChevronLeft className='size-4' aria-hidden='true' />
            {t('back')}
          </Button>
        </AnimateIcon>
        <div className='text-right'>
          <p className='text-sm text-muted-foreground'>{t('totalAmount')}</p>
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
        {hasExpressOptions !== false && (
          <div className='space-y-3'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-card px-2 text-muted-foreground'>{t('expressCheckout')}</span>
              </div>
            </div>
            <div className='relative min-h-12'>
              <Skeleton name='express-checkout' loading={!isExpressReady} fixture={<ExpressCheckoutFixture />}>
                <div />
              </Skeleton>
              <div className={!isExpressReady ? 'invisible absolute inset-0' : 'visible'}>
                <ExpressCheckoutElement
                  onConfirm={handleExpressCheckout}
                  onReady={(event) => {
                    setIsExpressReady(true);
                    setHasExpressOptions(!!event.availablePaymentMethods);
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div className='space-y-3'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>{t('orPayWithCard')}</span>
            </div>
          </div>
          <PaymentElement />
        </div>
        {errorMessage && (
          <div className='relative overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 p-4 backdrop-blur-sm'>
            <div className='absolute inset-0' />
            <div className='relative flex items-start gap-3'>
              <div className='shrink-0 size-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5'>
                <AlertCircle className='size-3 text-destructive' />
              </div>
              <div className='flex-1'>
                <h4 className='text-sm font-medium text-destructive mb-1'>{t('paymentError')}</h4>
                <p className='text-sm text-destructive/80'>{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        <Button
          type='submit'
          disabled={!stripe || isPending || !elements}
          className='w-full bg-green-600 hover:bg-green-700'
          aria-busy={isPending}
        >
          {isPending ? t('processing') : `${t('pay')} ${currencySymbol}${formattedAmount}`}
        </Button>
      </form>
    </div>
  );
}
