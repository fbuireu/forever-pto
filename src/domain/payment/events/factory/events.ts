import type Stripe from 'stripe';
import type { PaymentFailedEvent, PaymentSucceededEvent } from '../types';
import { resolveChargeId } from './utils';

export const createPaymentSucceededEvent = (paymentIntent: Stripe.PaymentIntent): PaymentSucceededEvent => ({
  type: 'payment_succeeded',
  paymentId: paymentIntent.id,
  email: paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? '',
  amount: paymentIntent.amount,
  status: paymentIntent.status,
  latestChargeId: resolveChargeId(paymentIntent.latest_charge),
  promoCode: paymentIntent.metadata.promoCode ?? null,
  userAgent: paymentIntent.metadata.userAgent ?? null,
  ipAddress: paymentIntent.metadata.ipAddress ?? null,
});

export const createPaymentFailedEvent = (paymentIntent: Stripe.PaymentIntent): PaymentFailedEvent => ({
  type: 'payment_failed',
  paymentId: paymentIntent.id,
  status: paymentIntent.status,
  errorMessage: paymentIntent.last_payment_error?.message ?? 'Unknown error',
});
