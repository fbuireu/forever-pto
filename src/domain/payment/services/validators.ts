import type Stripe from 'stripe';

export interface PaymentValidationResult {
  valid: boolean;
  paymentEmail?: string;
  status?: string;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
}

export interface PaymentValidator {
  validatePaymentIntent(paymentIntentId: string): Promise<PaymentValidationResult>;
}
