import type Stripe from 'stripe';

export const extractCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null => {
  if (typeof customer === 'string') return customer;
  return customer?.id ?? null;
};

export const extractChargeId = (charge: string | Stripe.Charge | null): string | null => {
  if (typeof charge === 'string') return charge;
  return charge?.id ?? null;
};
