import { DiscountInfo } from '@application/dto/payment/types';
import type Stripe from 'stripe';

interface CalculateFinalAmount {
  baseAmount: number;
  discountInfo: DiscountInfo | null;
}

export const calculateFinalAmount = ({ baseAmount, discountInfo }: CalculateFinalAmount): number => {
  return discountInfo?.finalAmount ?? baseAmount;
};

export const extractCustomerId = (
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null => {
  if (typeof customer === 'string') return customer;
  return customer?.id || null;
};

export const extractChargeId = (charge: string | Stripe.Charge | null): string | null => {
  if (typeof charge === 'string') return charge;
  return charge?.id || null;
};

export const extractPaymentIntentId = (paymentIntent: string | Stripe.PaymentIntent | null): string | null => {
  if (typeof paymentIntent === 'string') return paymentIntent;
  return paymentIntent?.id || null;
};

export const stripeTimestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};


export const eurosToCents = (euros: number): number => {
  return Math.round(euros * 100);
};

export const centsToEuros = (cents: number): number => {
  return cents / 100;
};

export const calculateDiscountAmount = (discountInfo: DiscountInfo): number => {
  return discountInfo.originalAmount - discountInfo.finalAmount;
};


export const getCouponValidationError = (coupon: Stripe.Coupon): string | null => {
  if (!coupon.valid) {
    return 'This promo code is no longer valid';
  }

  if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
    return 'This promo code has reached its usage limit';
  }

  if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
    return 'This promo code has expired';
  }

  return null;
};

export const calculateDiscountedAmount = (coupon: Stripe.Coupon, amount: number): number => {
  if (coupon.percent_off) {
    return amount * (1 - coupon.percent_off / 100);
  }

  if (coupon.amount_off) {
    return amount - coupon.amount_off / 100;
  }

  return amount;
};

export const isCouponActive = (coupon: Stripe.Coupon): boolean => {
  return coupon.valid && getCouponValidationError(coupon) === null;
};