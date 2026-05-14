import type { CreatePaymentInput } from '@application/dto/payment/schema';
import type { DiscountInfo } from '@application/dto/payment/types';
import { createPaymentAction } from '@infrastructure/actions/payment';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { PaymentError } from '@infrastructure/errors';
import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { Effect } from 'effect';

interface InitializePaymentResult {
  clientSecret: string;
  discountInfo: DiscountInfo | null;
}

export const initializePayment = async (params: CreatePaymentInput): Promise<InitializePaymentResult> => {
  const result = await createPaymentAction(params);

  if (!result.success) {
    throw new PaymentError({ message: result.error ?? 'Payment initialization failed' });
  }

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

  const program = Effect.gen(function* () {
    const { error: submitError } = yield* Effect.tryPromise(() => elements.submit());
    if (submitError) return { success: false, error: submitError.message ?? '' } as ConfirmPaymentResult;

    const { error, paymentIntent } = yield* Effect.tryPromise(() =>
      stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl, receipt_email: email },
        redirect: 'if_required',
      })
    );

    if (error) return { success: false, error: error.message ?? '' } as ConfirmPaymentResult;

    const sessionResponse = yield* Effect.tryPromise(() =>
      fetch('/api/check-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, premiumKey: paymentIntent.id }),
      })
    );

    if (!sessionResponse.ok) {
      const errorData = yield* Effect.tryPromise(() => sessionResponse.json() as Promise<{ error?: string }>);
      logger.error('Session activation failed after payment', {
        statusCode: sessionResponse.status,
        reason: errorData.error,
        emailDomain: email?.split('@')[1],
        paymentIntentId: paymentIntent.id,
      });
      return { success: false, error: errorData.error ?? '' } as ConfirmPaymentResult;
    }

    const sessionData = yield* Effect.tryPromise(
      () => sessionResponse.json() as Promise<{ premiumKey: string; email: string }>
    );

    return {
      success: true,
      sessionData: { premiumKey: sessionData.premiumKey, email: sessionData.email },
    } as ConfirmPaymentResult;
  }).pipe(
    Effect.catchAll((error) => {
      logger.logError('Payment confirmation error in checkout adapter', error, {
        emailDomain: email?.split('@')[1],
        returnUrl,
      });
      return Effect.succeed({
        success: false,
        error: error instanceof Error ? error.message : '',
      } as ConfirmPaymentResult);
    })
  );

  return Effect.runPromise(program);
};
