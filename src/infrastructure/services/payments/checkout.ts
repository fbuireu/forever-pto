import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { createPayment } from '@infrastructure/actions/payment';
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

export const confirmPayment = async (params: ConfirmPaymentParams): Promise<string | null> => {
  const { stripe, elements, email, returnUrl } = params;

  try {
    const { error: submitError } = await elements.submit();
    if (submitError) {
      return submitError.message ?? 'Payment submission failed';
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
      return error.message ?? 'Payment confirmation failed';
    }

    await fetch('/api/check-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        premiumKey: paymentIntent.id,
      }),
    });
    return null;
  } catch (error) {
    console.error('Payment error:', error);
    return error instanceof Error ? error.message : 'An unexpected error occurred';
  }
};
