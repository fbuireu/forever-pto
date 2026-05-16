import type { DiscountInfo } from './types';
import type Stripe from 'stripe';

interface CalculateFinalAmountParams {
  baseAmount: number;
  discountInfo: DiscountInfo | null;
}

export const calculateFinalAmount = ({ baseAmount, discountInfo }: CalculateFinalAmountParams): number =>
  discountInfo?.finalAmount ?? baseAmount;

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
