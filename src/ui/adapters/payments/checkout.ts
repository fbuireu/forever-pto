import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

interface InitializePaymentResult {
  clientSecret: string;
  discountInfo: DiscountInfo | null;
}

export const initializePayment = async (params: CreatePaymentInput): Promise<InitializePaymentResult> => {
  console.log('[checkout] Calling /api/payment with params:', {
    amount: params.amount,
    email: params.email,
    hasPromoCode: !!params.promoCode
  });

  const response = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  console.log('[checkout] Response received:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: {
      contentType: response.headers.get('content-type'),
    }
  });

  const responseText = await response.text();
  console.log('[checkout] Response body (raw):', responseText.substring(0, 500));

  let result;
  try {
    result = JSON.parse(responseText);
    console.log('[checkout] Parsed JSON successfully:', { success: result.success });
  } catch (error) {
    console.error('[checkout] Failed to parse JSON:', error);
    console.error('[checkout] Response was:', responseText);
    throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}`);
  }

  if (!result.success) {
    console.error('[checkout] API returned error:', result.error);
    throw new Error(result.error);
  }

  console.log('[checkout] Payment initialized successfully');
  return {
    clientSecret: result.clientSecret,
    discountInfo: result.discountInfo ?? null,
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

const logger = getBetterStackInstance();

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
      logger.error('Session activation failed after payment', {
        statusCode: sessionResponse.status,
        error: errorData.error,
        email,
        paymentIntentId: paymentIntent.id,
      });
      return {
        success: false,
        error: errorData.error ?? 'Failed to activate premium access',
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
    logger.logError('Payment confirmation error in checkout adapter', error, {
      email,
      returnUrl,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};
