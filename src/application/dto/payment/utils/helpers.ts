import type Stripe from 'stripe';
import type { DiscountInfo } from '../types';

interface CalculateFinalAmountParams {
  baseAmount: number;
  discountInfo: DiscountInfo | null;
}

export const calculateFinalAmount = ({ baseAmount, discountInfo }: CalculateFinalAmountParams) =>
  discountInfo?.finalAmount ?? baseAmount;

export const extractCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) => {
  if (typeof customer === 'string') return customer;
  return customer?.id ?? null;
};

export const extractChargeId = (charge: string | Stripe.Charge | null) => {
  if (typeof charge === 'string') return charge;
  return charge?.id ?? null;
};
