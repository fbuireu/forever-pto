import type Stripe from 'stripe';

export const resolveChargeId = (charge: Stripe.PaymentIntent['latest_charge']) => {
  if (!charge) return null;
  return typeof charge === 'string' ? charge : charge.id;
};
