import type Stripe from 'stripe';
import type { PaymentSucceededEvent, PaymentFailedEvent, ChargeSucceededEvent } from '../types';

const extractCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null => {
  if (typeof customer === 'string') return customer;
  return customer?.id ?? null;
};

const extractChargeId = (charge: string | Stripe.Charge | null): string | null => {
  if (typeof charge === 'string') return charge;
  return charge?.id ?? null;
};

export const createPaymentSucceededEvent = (paymentIntent: Stripe.PaymentIntent): PaymentSucceededEvent => ({
  type: 'payment_succeeded',
  paymentIntent,
  paymentId: paymentIntent.id,
  email: paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? '',
  amount: paymentIntent.amount,
  status: paymentIntent.status,
  customerId: extractCustomerId(paymentIntent.customer),
  chargeId: extractChargeId(paymentIntent.latest_charge),
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
