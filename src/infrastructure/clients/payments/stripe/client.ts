import { loadStripe, type PaymentIntent, Stripe, type StripeError } from '@stripe/stripe-js';
import StripeNode from 'stripe';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export interface PaymentParams {
  clientSecret: string;
  returnUrl?: string;
  alwaysRedirect?: boolean;
}

export class StripeClient {
  private stripePromise: Promise<Stripe | null> | null = null;
  private stripe: Stripe | null = null;
  private readonly publishableKey: string;

  constructor(publishableKey: string) {
    this.publishableKey = publishableKey;
  }

  getStripePromise(): Promise<Stripe | null> {
    this.stripePromise ??= loadStripe(this.publishableKey);
    return this.stripePromise;
  }

  async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      this.stripePromise ??= loadStripe(this.publishableKey);
      this.stripe = await this.stripePromise;
    }

    if (!this.stripe) {
      throw new Error('Stripe failed to load. Please check your internet connection and try again.');
    }

    return this.stripe;
  }

  async confirmPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripe();

      const result = await stripe.confirmPayment({
        clientSecret: params.clientSecret,
        confirmParams: {
          return_url: params.returnUrl ?? window.location.href,
        },
        redirect: params.alwaysRedirect ? 'always' : undefined,
      });

      return this.handlePaymentResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async confirmCardPayment(clientSecret: string): Promise<PaymentResult> {
    try {
      const stripe = await this.getStripe();
      const result = await stripe.confirmCardPayment(clientSecret);
      return this.handlePaymentResult(result);
    } catch (error) {
      return this.handleError(error);
    }
  }

  isLoaded(): boolean {
    return this.stripe !== null;
  }

  private handlePaymentResult(result: { error: StripeError } | { paymentIntent: PaymentIntent }): PaymentResult {
    if (this.isErrorResult(result)) {
      return {
        success: false,
        error: result.error.message ?? 'Payment failed',
      };
    }

    const { paymentIntent } = result;

    if (paymentIntent?.status === 'succeeded') {
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: `Payment status: ${paymentIntent?.status ?? 'unknown'}`,
    };
  }

  private isErrorResult(
    result: { error: StripeError } | { paymentIntent: PaymentIntent }
  ): result is { error: StripeError } {
    return 'error' in result;
  }

  private handleError(error: unknown): PaymentResult {
    const stripeError = error as StripeError;

    if (stripeError?.type === 'card_error') {
      return {
        success: false,
        error: stripeError.message ?? 'Your card was declined. Please try a different payment method.',
      };
    }

    if (stripeError?.type === 'invalid_request_error') {
      return {
        success: false,
        error: 'Payment request is invalid. Please try again.',
      };
    }

    if (stripeError?.type === 'authentication_error') {
      return {
        success: false,
        error: 'Payment service temporarily unavailable. Please try again later.',
      };
    }

    return {
      success: false,
      error: stripeError?.message ?? 'Payment could not be processed. Please try again.',
    };
  }
}

let stripeClientInstance: StripeClient | null = null;

export const getStripeClientInstance = (): StripeClient => {
  if (!stripeClientInstance) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }

    stripeClientInstance = new StripeClient(publishableKey);
  }
  return stripeClientInstance;
};

export const resetStripeClient = (): void => {
  stripeClientInstance = null;
};

let stripeServerInstance: StripeNode | null = null;

export const getStripeServerInstance = (): StripeNode => {
  if (!stripeServerInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    stripeServerInstance = new StripeNode(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  return stripeServerInstance;
};

export const resetStripeServerClient = (): void => {
  stripeServerInstance = null;
};

export const constructWebhookEvent = (payload: string | Buffer, signature: string): StripeNode.Event => {
  const stripe = getStripeServerInstance();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

export const validateStripeConfig = (): { client: boolean; server: boolean; webhook: boolean } => {
  return {
    client: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    server: !!process.env.STRIPE_SECRET_KEY,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  };
};
