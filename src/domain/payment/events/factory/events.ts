import type Stripe from 'stripe';
import type { PaymentSucceededEvent, PaymentFailedEvent, ChargeSucceededEvent } from '../types';

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

export const createChargeSucceededEvent = (charge: Stripe.Charge): ChargeSucceededEvent => ({
  type: 'charge_succeeded',
  charge,
  chargeId: charge.id,
  paymentIntentId:
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null,
});
