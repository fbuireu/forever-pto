import Stripe from 'stripe';

export type PaymentDTO =
  | {
      success: true;
      clientSecret: string;
    }
  | {
      success: false;
      error: string;
      stripeError?: Stripe.StripeRawError;
      code?: string;
      type?: string;
    };

export type RawPayment = { type: 'success'; data: Stripe.PaymentIntent } | { type: 'error'; error: unknown };
