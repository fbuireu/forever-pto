'use client';

import { DiscountInfo } from '@application/dto/payment/types';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { CheckoutForm } from './CheckoutForm';

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
}: Readonly<PaymentFormProps>) {
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
