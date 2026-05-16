import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { loadStripe, type PaymentIntent, type Stripe, type StripeError } from '@stripe/stripe-js';
import { Effect } from 'effect';

interface PaymentParams {
  clientSecret: string;
  returnUrl?: string;
  alwaysRedirect?: boolean;
}

class StripeClient {
  private stripePromise: Promise<Stripe | null> | null = null;
  private stripe: Stripe | null = null;
  private readonly publishableKey: string;
  private logger = getBetterStackInstance();

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
  }

  getStripePromise() {
    this.stripePromise ??= loadStripe(this.publishableKey);
    return this.stripePromise;
  }

  async getStripe() {
    if (!this.stripe) {
      this.stripePromise ??= loadStripe(this.publishableKey);
      this.stripe = await this.stripePromise;
    }

    if (!this.stripe) {
      throw new Error('Stripe failed to load. Please check your internet connection and try again.');
    }

    return this.stripe;
  }

  async confirmPayment(params: PaymentParams) {
    return Effect.runPromise(
      Effect.tryPromise(() => this.getStripe()).pipe(
        Effect.andThen((stripe) =>
          Effect.tryPromise({
            try: () =>
              stripe.confirmPayment({
                clientSecret: params.clientSecret,
                confirmParams: { return_url: params.returnUrl ?? globalThis.location.href },
                redirect: params.alwaysRedirect ? 'always' : undefined,
              }),
            catch: (e) => e,
          })
        ),
        Effect.andThen((result) => Effect.sync(() => this.handlePaymentResult(result))),
        Effect.catchAll((error) => {
          this.logger.logError('Stripe confirmPayment failed', error, {
            hasClientSecret: !!params.clientSecret,
            hasReturnUrl: !!params.returnUrl,
            alwaysRedirect: params.alwaysRedirect,
            location: globalThis.location.href,
          });
          return Effect.succeed(this.handleError(error));
        })
      )
    );
  }

  async confirmCardPayment(clientSecret: string) {
    return Effect.runPromise(
      Effect.tryPromise(() => this.getStripe()).pipe(
        Effect.andThen((stripe) =>
          Effect.tryPromise({ try: () => stripe.confirmCardPayment(clientSecret), catch: (e) => e })
        ),
        Effect.andThen((result) => Effect.sync(() => this.handlePaymentResult(result))),
        Effect.catchAll((error) => {
          this.logger.logError('Stripe confirmCardPayment failed', error, { hasClientSecret: !!clientSecret });
          return Effect.succeed(this.handleError(error));
        })
      )
    );
  }

  isLoaded() {
    return this.stripe !== null;
  }

  private handlePaymentResult(result: { error: StripeError } | { paymentIntent: PaymentIntent }) {
    if (this.isErrorResult(result)) {
      return {
        success: false as const,
        error: result.error.message ?? '',
      };
    }

    const { paymentIntent } = result;

    if (paymentIntent?.status === 'succeeded') {
      return {
        success: true as const,
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false as const,
      error: `Payment status: ${paymentIntent?.status ?? 'unknown'}`,
    };
  }

  private isErrorResult(
    result: { error: StripeError } | { paymentIntent: PaymentIntent }
  ): result is { error: StripeError } {
    return 'error' in result;
  }

  private handleError(error: unknown) {
    const stripeError = error as StripeError;

    if (stripeError?.type === 'card_error') {
      return {
        success: false as const,
        error: stripeError.message ?? 'Your card was declined. Please try a different payment method.',
      };
    }

    if (stripeError?.type === 'invalid_request_error') {
      return {
        success: false as const,
        error: 'Payment request is invalid. Please try again.',
      };
    }

    if (stripeError?.type === 'authentication_error') {
      return {
        success: false as const,
        error: 'Payment service temporarily unavailable. Please try again later.',
      };
    }

    return {
      success: false as const,
      error: stripeError?.message ?? 'Payment could not be processed. Please try again.',
    };
  }
}

let stripeClientInstance: StripeClient | null = null;

export const getStripeClientInstance = () => {
  if (!stripeClientInstance) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }

    stripeClientInstance = new StripeClient(publishableKey);
  }
  return stripeClientInstance;
};
