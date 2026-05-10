import type Stripe from 'stripe';
import type { PaymentFailedEvent, PaymentSucceededEvent } from '../types';

export const createPaymentSucceededEvent = (paymentIntent: Stripe.PaymentIntent): PaymentSucceededEvent => ({
  type: 'payment_succeeded',
  paymentIntent,
  paymentId: paymentIntent.id,
  email: paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? '',
  amount: paymentIntent.amount,
  status: paymentIntent.status,
});

export const createPaymentFailedEvent = (paymentIntent: Stripe.PaymentIntent): PaymentFailedEvent => ({
  type: 'payment_failed',
  paymentIntent,
  paymentId: paymentIntent.id,
  errorMessage: paymentIntent.last_payment_error?.message ?? 'Unknown error',
});
