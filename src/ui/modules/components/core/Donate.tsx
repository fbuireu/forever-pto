'use client';

import { CreatePaymentInput, createPaymentSchema } from '@application/dto/payment/schema';
import { DiscountInfo } from '@application/dto/payment/types';
import { usePremiumStore } from '@application/stores/premium';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStripeClient } from '@infrastructure/clients/payments/stripe/client';
import { initializePayment } from '@infrastructure/services/payments/checkout';
import { formatDiscountMessage } from '@infrastructure/services/payments/utils/formatters';
import { calculateFinalAmount } from '@infrastructure/services/payments/utils/helpers';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

const stripePromise = getStripeClient().getStripePromise();

export const Donate = () => {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  const { premiumKey, userEmail, setEmail, getCurrencyFromLocale, currency, currencySymbol } =
    usePremiumStore(
      useShallow((state) => ({
        premiumKey: state.premiumKey,
        userEmail: state.userEmail,
        setEmail: state.setEmail,
        getCurrencyFromLocale: state.getCurrencyFromLocale,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
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
    async (data: CreatePaymentInput) => {
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
          discountInfo: result.discountInfo || null,
        });
      } catch (error) {
        toast.error('Payment initialization failed', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
      }
    },
    [setEmail]
  );

  const handlePaymentSuccess = useCallback(async () => {
    if (!paymentState) return;

    await usePremiumStore.getState().checkExistingSession();

    toast.success('Payment successful!', {
      description: 'Thank you for your support! You now have premium access.',
      duration: 8000,
    });

    form.reset();
    setPaymentState(null);
    setIsOpen(false);
  }, [paymentState, form]);

  const handlePaymentCancel = useCallback(() => {
    setPaymentState(null);
  }, []);

  const finalAmount = calculateFinalAmount({
    baseAmount: currentAmount,
    discountInfo: paymentState?.discountInfo ?? null,
  });

  const elementsOptions = useMemo<StripeElementsOptions | null>(() => {
    if (!paymentState?.clientSecret) return null;

    const isDark = resolvedTheme === 'dark';

    return {
      clientSecret: paymentState.clientSecret,
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
    };
  }, [paymentState?.clientSecret, resolvedTheme]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className='fixed bottom-4 right-4 z-50'>
          <div className='donate-rainbow relative z-0 overflow-hidden p-0.5 flex items-center justify-center rounded-md hover:scale-102 transition duration-200 active:scale-100'>
            <Button className='shadow-lg rounded-md w-full h-full'>Donate & Unblock</Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className='w-96' onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <h4 className='leading-none font-medium'>Support & Unblock</h4>
            <p className='text-muted-foreground text-sm'>Make a donation to support the content and unblock access.</p>
            {Boolean(premiumKey) && (
              <div className='flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'>
                <Star className='w-4 h-4 text-green-500' fill='currentColor' aria-hidden='true' animateOnView loop />
                <span className='text-green-700 dark:text-green-300 font-semibold text-sm'>
                  You are a premium user already. Thank you for your support!
                </span>
              </div>
            )}
          </div>

          {elementsOptions ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              {!paymentState ? (
                <DonationForm
                  form={form}
                  onSubmit={onSubmit}
                  currentAmount={currentAmount}
                  locale={locale}
                  currency={currency}
                  currencySymbol={currencySymbol}
                />
              ) : (
                <CheckoutForm
                  amount={finalAmount}
                  email={paymentState.data.email}
                  discountInfo={paymentState.discountInfo}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </Elements>
          ) : (
            <DonationForm
              form={form}
              onSubmit={onSubmit}
              currentAmount={currentAmount}
              locale={locale}
              currency={currency}
              currencySymbol={currencySymbol}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
