'use client';

import { type CreatePaymentInput, createPaymentSchemaWithMessages } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { zodResolver } from '@hookform/resolvers/zod';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getStripeClientInstance } from '@infrastructure/clients/payments/stripe/client';
import { formatDiscountMessage } from '@infrastructure/services/payments/utils/formatters';
import { calculateFinalAmount } from '@infrastructure/services/payments/utils/helpers';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { initializePayment } from '@ui/adapters/payments/checkout';
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/animate/base/popover';
import { Button } from '@ui/components/animate/components/buttons/button';
import { Star } from '@ui/components/animate/icons/star';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { CheckoutForm } from './CheckoutForm';
import { DonationForm } from './DonationForm';
import './donate.css';

interface PaymentState {
  clientSecret: string;
  data: CreatePaymentInput;
  discountInfo: DiscountInfo | null;
}

const logger = getBetterStackInstance();

export const Donate = () => {
  const locale = useLocale();
  const t = useTranslations('toasts');
  const tDonate = useTranslations('donate');
  const tValidation = useTranslations('validation.payment');
  const { resolvedTheme } = useTheme();
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    premiumKey,
    userEmail,
    setEmail,
    getCurrencyFromLocale,
    currency,
    currencySymbol,
    isOpen,
    isOpening,
    setDonatePopoverOpen,
    clearDonatePopoverOpening,
  } = usePremiumStore(
    useShallow((state) => ({
      premiumKey: state.premiumKey,
      userEmail: state.userEmail,
      setEmail: state.setEmail,
      getCurrencyFromLocale: state.getCurrencyFromLocale,
      currency: state.currency,
      currencySymbol: state.currencySymbol,
      isOpen: state.donatePopoverOpen,
      isOpening: state.donatePopoverIsOpening,
      setDonatePopoverOpen: state.setDonatePopoverOpen,
      clearDonatePopoverOpening: state.clearDonatePopoverOpening,
    }))
  );

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  useEffect(() => {
    if (isOpen) {
      stripePromiseRef.current ??= getStripeClientInstance().getStripePromise();
    }
  }, [isOpen]);

  useEffect(() => {
    const legend = document.getElementById('legend-sticky');
    if (!legend) {
      document.documentElement.setAttribute('data-legend-stuck', '');
      return () => document.documentElement.removeAttribute('data-legend-stuck');
    }

    const update = () => {
      const { bottom } = legend.getBoundingClientRect();
      document.documentElement.toggleAttribute('data-legend-stuck', Math.round(bottom) < window.innerHeight - 1);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', update);
      document.documentElement.removeAttribute('data-legend-stuck');
    };
  }, []);

  const paymentSchema = createPaymentSchemaWithMessages({
    amountMin: tValidation('amountMin'),
    amountMax: tValidation('amountMax'),
    invalidEmail: tValidation('invalidEmail'),
    emailRequired: tValidation('emailRequired'),
  });

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(paymentSchema),
    resetOptions: { keepDirtyValues: true },
    values: {
      amount: 5,
      promoCode: '',
      email: userEmail ?? '',
    },
  });

  const currentAmount = form.watch('amount');

  const onSubmit = useCallback(
    (data: CreatePaymentInput) => {
      startTransition(async () => {
        try {
          setEmail(data.email);
          const result = await initializePayment({
            amount: data.amount,
            email: data.email,
            promoCode: data.promoCode,
          });

          if (result.discountInfo) {
            const message = formatDiscountMessage(result.discountInfo);
            toast.success(message.title, {
              description: message.description,
            });
          }

          setPaymentState({
            clientSecret: result.clientSecret,
            data,
            discountInfo: result.discountInfo ?? null,
          });
        } catch (error) {
          logger.logError('Payment initialization failed in Donate component', error, {
            amount: data.amount,
            hasPromoCode: !!data.promoCode,
            promoCodeLength: data.promoCode?.length,
            currency,
            locale,
          });
          toast.error(t('paymentFailed'), {
            description: error instanceof Error ? error.message : t('paymentFailedDescription'),
          });
        }
      });
    },
    [setEmail, locale, currency, t]
  );

  const handlePaymentSuccess = useCallback(() => {
    toast.success(t('paymentSuccess'), {
      description: t('paymentSuccessDescription'),
      duration: 8000,
    });

    form.reset();
    setPaymentState(null);
    setDonatePopoverOpen(false);
  }, [form, setDonatePopoverOpen, t]);

  useEffect(() => {
    if (isOpen && isOpening) clearDonatePopoverOpening(isOpening);
  }, [isOpen, isOpening, clearDonatePopoverOpening]);

  const handlePaymentCancel = useCallback(() => {
    setPaymentState(null);
  }, []);

  const finalAmount = useMemo(
    () =>
      calculateFinalAmount({
        baseAmount: currentAmount,
        discountInfo: paymentState?.discountInfo ?? null,
      }),
    [currentAmount, paymentState?.discountInfo]
  );

  const elementsOptions = useMemo<StripeElementsOptions | undefined>(() => {
    if (!paymentState?.clientSecret) return undefined;

    const isDark = resolvedTheme === 'dark';

    const t = isDark
      ? {
          bg: '#1A1612', // --card
          bgInput: '#181410', // --input
          fg: '#FFF5E1', // --foreground
          frame: '#FFF5E1', // --frame
          accent: '#FFD93D', // --accent (same in both modes)
          accentText: '#0E0E0E',
          hover: '#2B241E', // --secondary
          destructive: '#FF5A5F',
          muted: '#C6B8A5', // --muted-foreground
        }
      : {
          bg: '#FFFDF8', // --card
          bgInput: '#FFFAF0', // --input
          fg: '#0E0E0E', // --foreground
          frame: '#0E0E0E', // --frame
          accent: '#FFD93D', // --accent
          accentText: '#0E0E0E',
          hover: '#FFF0C6', // --secondary
          destructive: '#FF5A5F',
          muted: '#6B5E4E', // --muted-foreground
        };

    return {
      clientSecret: paymentState.clientSecret,
      loader: 'always',
      appearance: {
        theme: undefined,
        labels: 'above',
        variables: {
          colorBackground: t.bg,
          colorText: t.fg,
          colorPrimary: t.frame,
          colorDanger: t.destructive,
          colorTextSecondary: t.muted,
          colorTextPlaceholder: t.muted,
          accessibleColorOnColorPrimary: t.fg,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSizeBase: '14px',
          fontWeightNormal: '400',
          fontWeightMedium: '500',
          fontWeightBold: '700',
          spacingUnit: '4px',
          borderRadius: '8px',
          // Brutal focus ring
          focusBoxShadow: `4px 4px 0 0 ${t.frame}`,
          focusOutline: 'none',
        },
        rules: {
          '.Input': {
            backgroundColor: t.bgInput,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: t.frame,
            padding: '10px 12px',
            fontSize: '14px',
            color: t.fg,
            boxShadow: 'none',
            borderRadius: '8px',
            transition: 'box-shadow 80ms linear',
          },
          '.Input:focus': {
            boxShadow: `4px 4px 0 0 ${t.frame} !important`,
            outline: 'none',
          },
          '.Input:hover': {
            boxShadow: `2px 2px 0 0 ${t.frame}`,
          },

          '.Input--invalid': {
            borderColor: t.destructive,
            boxShadow: 'none',
          },
          '.Input--invalid:focus': {
            boxShadow: `4px 4px 0 0 ${t.destructive}`,
          },
          '.Input::placeholder': {
            color: t.muted,
          },
          '.Label': {
            fontSize: '11px',
            fontWeight: '700',
            color: t.fg,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          },
          '.Error': {
            fontSize: '12px',
            color: t.destructive,
            fontWeight: '500',
          },
          '.Tab': {
            backgroundColor: t.bg,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: t.frame,
            boxShadow: 'none',
            color: t.fg,
            borderRadius: '8px',
            padding: '10px 16px',
            transition: 'box-shadow 80ms linear',
          },
          '.Tab:hover': {
            backgroundColor: t.hover,
            boxShadow: `3px 3px 0 0 ${t.frame}`,
          },
          '.Tab--selected': {
            backgroundColor: t.accent,
            color: t.accentText,
            borderColor: t.frame,
            boxShadow: `4px 4px 0 0 ${t.frame}`,
          },
          '.Tab--selected:hover': {
            boxShadow: `5px 5px 0 0 ${t.frame}`,
          },
          '.Block': {
            backgroundColor: t.bg,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: t.frame,
            borderRadius: '8px',
            boxShadow: 'none',
          },
          '.PickerItem': {
            backgroundColor: t.bg,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: t.frame,
            borderRadius: '8px',
            boxShadow: 'none',
            transition: 'box-shadow 80ms linear',
          },
          '.PickerItem:hover': {
            backgroundColor: t.hover,
            boxShadow: `3px 3px 0 0 ${t.frame}`,
          },
          '.PickerItem--selected': {
            backgroundColor: t.accent,
            borderColor: t.frame,
            color: t.accentText,
            boxShadow: `4px 4px 0 0 ${t.frame}`,
          },
          '.PickerItem--selected:hover': {
            boxShadow: `5px 5px 0 0 ${t.frame}`,
          },
          '.AccordionItem': {
            backgroundColor: t.bg,
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: t.frame,
            borderRadius: '8px',
            boxShadow: 'none',
          },
          '.AccordionItem:focus-within': {
            boxShadow: `4px 4px 0 0 ${t.frame}`,
          },
          '.CheckboxInput': {
            border: `2px solid ${t.frame}`,
            borderRadius: '4px',
            backgroundColor: t.bgInput,
          },
          '.CheckboxInput--checked': {
            backgroundColor: t.accent,
            borderColor: t.frame,
          },
        },
      },
    };
  }, [paymentState?.clientSecret, resolvedTheme]);

  return (
    <Popover open={isOpen} onOpenChange={setDonatePopoverOpen}>
      <div className='donate-trigger fixed xl:bottom-4 bottom-30 w-full right-0 md:w-auto md:right-4 z-50'>
        <div className='donate-rainbow relative z-0 overflow-hidden p-0.5 flex items-center justify-center rounded-md hover:scale-102 transition duration-200 active:scale-100'>
          <PopoverTrigger asChild>
            <Button className='rounded-[8px] w-full h-full py-3'>{tDonate('donateAndUnblock')}</Button>
          </PopoverTrigger>
        </div>
      </div>
      <PopoverContent className='w-96'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>{tDonate('supportAndUnblock')}</h4>
            <p className='text-muted-foreground text-sm'>{tDonate('makeDonation')}</p>
            {premiumKey && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' aria-hidden='true' animateOnView loop />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  {tDonate('alreadyPremium')}
                </span>
              </div>
            )}
          </div>

          {!paymentState ? (
            <DonationForm
              form={form}
              onSubmit={onSubmit}
              currentAmount={currentAmount}
              locale={locale}
              currency={currency}
              currencySymbol={currencySymbol}
              isPending={isPending}
            />
          ) : (
            elementsOptions && (
              <Elements stripe={stripePromiseRef.current} options={elementsOptions}>
                <CheckoutForm
                  amount={finalAmount}
                  email={paymentState.data.email}
                  discountInfo={paymentState.discountInfo}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
