'use client';

import { type CreatePaymentInput, createPaymentSchema } from '@application/dto/payment/schema';
import { type DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { zodResolver } from '@hookform/resolvers/zod';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { getStripeClientInstance } from '@infrastructure/clients/payments/stripe/client';
import { formatDiscountMessage } from '@infrastructure/services/payments/utils/formatters';
import { calculateFinalAmount } from '@infrastructure/services/payments/utils/helpers';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { initializePayment } from '@ui/adapters/payments/checkout';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { Star } from 'src/components/animate-ui/icons/star';
import { Popover, PopoverContent, PopoverTrigger } from 'src/components/animate-ui/radix/popover';
import { useShallow } from 'zustand/react/shallow';
import { CheckoutForm } from './CheckoutForm';
import { DonationForm } from './DonationForm';

interface PaymentState {
  clientSecret: string;
  data: CreatePaymentInput;
  discountInfo: DiscountInfo | null;
}

const stripePromise = getStripeClientInstance().getStripePromise();
const logger = getBetterStackInstance();

export const Donate = () => {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
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

  const form = useForm<CreatePaymentInput>({
    resolver: zodResolver(createPaymentSchema),
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
          toast.error('Payment initialization failed', {
            description: error instanceof Error ? error.message : 'Please try again.',
          });
        }
      });
    },
    [setEmail, locale, currency]
  );

  const handlePaymentSuccess = useCallback(() => {
    toast.success('Payment successful!', {
      description: 'Thank you for your support! You now have premium access.',
      duration: 8000,
    });

    form.reset();
    setPaymentState(null);
    setDonatePopoverOpen(false);
  }, [form, setDonatePopoverOpen]);

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

  const elementsOptions = useMemo<StripeElementsOptions | null>(() => {
    if (!paymentState?.clientSecret) return null;

    const isDark = resolvedTheme === 'dark';

    const colors = {
      background: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
      foreground: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)',
      primary: isDark ? 'hsl(210 40% 98%)' : 'hsl(222.2 47.4% 11.2%)',
      primaryForeground: isDark ? 'hsl(222.2 47.4% 11.2%)' : 'hsl(210 40% 98%)',
      border: isDark ? 'hsl(240 3.7% 15.9%)' : 'hsl(214.3 31.8% 91.4%)',
      borderHover: isDark ? 'hsl(240 3.7% 20%)' : 'hsl(214.3 31.8% 85%)',
      accent: isDark ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 4.8% 95.9%)',
      accentHover: isDark ? 'hsl(240 3.7% 18%)' : 'hsl(240 4.8% 95.9%)',
      destructive: isDark ? 'hsl(0 62.8% 30.6%)' : 'hsl(0 84.2% 60.2%)',
      mutedForeground: isDark ? 'hsl(215 20.2% 65.1%)' : 'hsl(215.4 16.3% 46.9%)',
    };

    return {
      clientSecret: paymentState.clientSecret,
      loader: 'always',
      appearance: {
        theme: isDark ? 'night' : 'stripe',
        variables: {
          colorBackground: colors.background,
          colorText: colors.foreground,
          colorPrimary: colors.primary,
          colorDanger: colors.destructive,
          colorTextSecondary: colors.mutedForeground,
          colorTextPlaceholder: colors.mutedForeground,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSizeBase: '14px',
          fontWeightNormal: '400',
          fontWeightMedium: '500',
          fontWeightBold: '600',
          spacingUnit: '4px',
          borderRadius: '10px',
        },
        rules: {
          '.Input': {
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            padding: '10px 12px',
            fontSize: '14px',
            color: colors.foreground,
            boxShadow: isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            borderRadius: '10px',
          },
          '.Input:hover': {
            borderColor: colors.borderHover,
          },
          '.Input:focus': {
            borderColor: isDark ? colors.border : colors.primary,
            boxShadow: isDark ? `0 0 0 3px ${colors.border}` : `0 0 0 2px ${colors.primary.replace(')', ' / 0.2)')}`,
            outline: 'none',
          },
          '.Input--invalid': {
            borderColor: colors.destructive,
          },
          '.Input--invalid:focus': {
            borderColor: colors.destructive,
            boxShadow: isDark
              ? `0 0 0 3px ${colors.destructive.replace(')', ' / 0.3)')}`
              : `0 0 0 2px ${colors.destructive.replace(')', ' / 0.2)')}`,
          },
          '.Input::placeholder': {
            color: colors.mutedForeground,
          },
          '.Label': {
            fontSize: '14px',
            fontWeight: '500',
            color: colors.foreground,
            marginBottom: '6px',
          },
          '.Error': {
            fontSize: '13px',
            color: colors.destructive,
            marginTop: '6px',
            fontWeight: '400',
          },
          '.Tab': {
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            boxShadow: isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            color: colors.foreground,
            borderRadius: '10px',
            padding: '10px 16px',
            transition: 'all 0.15s ease',
          },
          '.Tab:hover': {
            backgroundColor: colors.accent,
            borderColor: colors.borderHover,
          },
          '.Tab--selected': {
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
            borderColor: colors.primary,
            boxShadow: 'none',
          },
          '.Tab--selected:hover': {
            backgroundColor: isDark ? 'hsl(210 40% 95%)' : 'hsl(222.2 47.4% 9%)',
          },
          '.TabIcon': {
            fill: 'currentColor',
          },
          '.Block': {
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            boxShadow: isDark ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
          '.PickerItem': {
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            padding: '12px',
            transition: 'all 0.15s ease',
          },
          '.PickerItem:hover': {
            backgroundColor: colors.accent,
            borderColor: colors.borderHover,
          },
          '.PickerItem--selected': {
            borderColor: colors.primary,
            backgroundColor: colors.accent,
            boxShadow: `0 0 0 1px ${colors.primary}`,
          },
          '.PickerItem--selected:hover': {
            backgroundColor: colors.accentHover,
          },
        },
      },
    };
  }, [paymentState?.clientSecret, resolvedTheme]);

  return (
    <Popover open={isOpen} onOpenChange={setDonatePopoverOpen}>
      <PopoverTrigger asChild>
        <div className='fixed bottom-4 right-4 z-50'>
          <div className='donate-rainbow relative z-0 overflow-hidden p-0.5 flex items-center justify-center rounded-md hover:scale-102 transition duration-200 active:scale-100'>
            <Button className='shadow-lg rounded-md w-full h-full'>Donate & Unblock</Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className='w-96'
        onOpenAutoFocus={() => {
          clearDonatePopoverOpening(isOpening);
        }}
        onInteractOutside={(e) => {
          if (isOpening) {
            e.preventDefault();
          }
        }}
      >
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Support & Unblock</h4>
            <p className='text-muted-foreground text-sm'>Make a donation to support the content and unblock access.</p>
            {premiumKey && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' aria-hidden='true' animateOnView loop />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  You are a premium user already. Thank you for your support!
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
              <Elements stripe={stripePromise} options={elementsOptions}>
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
