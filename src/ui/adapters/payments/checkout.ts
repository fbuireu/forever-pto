import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { createPayment } from '@application/use-cases/payment';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

interface InitializePaymentResult {
  clientSecret: string;
  discountInfo: DiscountInfo | null;
}

export const initializePayment = async (params: CreatePaymentInput): Promise<InitializePaymentResult> => {
  const result = await createPayment(params);

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    clientSecret: result.clientSecret,
    discountInfo: result.discountInfo || null,
  };
};

interface ConfirmPaymentParams {
  stripe: Stripe;
  elements: StripeElements;
  email: string;
  returnUrl: string;
}

interface ConfirmPaymentResult {
  success: boolean;
  error?: string;
  sessionData?: {
    premiumKey: string;
    email: string;
  };
}

export const confirmPayment = async (params: ConfirmPaymentParams): Promise<ConfirmPaymentResult> => {
  const { stripe, elements, email, returnUrl } = params;

  try {
    const { error: submitError } = await elements.submit();
    if (submitError) {
      return {
        success: false,
        error: submitError.message ?? 'Payment submission failed',
      };
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: email,
      },
      redirect: 'if_required',
    });

    if (error) {
      return {
        success: false,
        error: error.message ?? 'Payment confirmation failed',
      };
    }

    const sessionResponse = await fetch('/api/check-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        premiumKey: paymentIntent.id,
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      console.error('Session activation failed:', errorData);
      return {
        success: false,
        error: errorData.error || 'Failed to activate premium access',
      };
    }
    const sessionData = await sessionResponse.json();

    return {
      success: true,
      sessionData: {
        premiumKey: sessionData.premiumKey,
        email: sessionData.email,
      },
    };
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};
