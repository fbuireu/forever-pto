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

  private async getStripe(): Promise<Stripe> {
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
    if (error instanceof StripeNode.errors.StripeCardError) {
      return {
        success: false,
        error: 'Your card was declined. Please try a different payment method.',
      };
    }

    if (error instanceof StripeNode.errors.StripeInvalidRequestError) {
      return {
        success: false,
        error: 'Payment request is invalid. Please try again.',
      };
    }

    if (error instanceof StripeNode.errors.StripeAuthenticationError) {
      return {
        success: false,
        error: 'Payment service temporarily unavailable. Please try again later.',
      };
    }

    return {
      success: false,
      error: 'Payment could not be processed. Please try again.',
    };
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await this.getStripe();

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw new Error(error.message ?? 'Checkout redirection failed');
    }
  }

  isLoaded(): boolean {
    return this.stripe !== null;
  }
}

let stripeClientInstance: StripeClient | null = null;

export const getStripeClient = (): StripeClient => {
  if (!stripeClientInstance) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }

    stripeClientInstance = new StripeClient(publishableKey);
  }
  return stripeClientInstance;
};
