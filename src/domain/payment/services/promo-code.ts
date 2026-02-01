import type { DiscountInfo } from '@domain/payment/models/types';

const MIN_FINAL_AMOUNT = 0.5;

export interface PromoCodeValidation {
  valid: boolean;
  maxRedemptions?: number;
  timesRedeemed?: number;
  redeemBy?: number;
}

export interface PromoCodeDiscount {
  percentOff?: number;
  amountOff?: number;
  id: string;
  name: string | null;
}

export type PromoValidationResult = { success: true; data: DiscountInfo } | { success: false; error: string };

export const validatePromoCodeRules = (validation: PromoCodeValidation): string | null => {
  if (!validation.valid) return 'This promo code is no longer valid';
  if (validation.maxRedemptions && validation.timesRedeemed && validation.timesRedeemed >= validation.maxRedemptions) {
    return 'This promo code has reached its usage limit';
  }
  if (validation.redeemBy && validation.redeemBy < Math.floor(Date.now() / 1000)) {
    return 'This promo code has expired';
  }
  return null;
};

export const calculateDiscountedAmount = (discount: PromoCodeDiscount, amount: number): number => {
  if (discount.percentOff) return amount * (1 - discount.percentOff / 100);
  if (discount.amountOff) return amount - discount.amountOff / 100;
  return amount;
};

export const validateMinimumAmount = (finalAmount: number): string | null => {
  if (finalAmount < MIN_FINAL_AMOUNT) {
    return `Discount cannot reduce amount below ${MIN_FINAL_AMOUNT.toFixed(2)}`;
  }
  return null;
};

export const createDiscountInfo = (discount: PromoCodeDiscount, originalAmount: number): DiscountInfo => {
  const finalAmount = calculateDiscountedAmount(discount, originalAmount);

  return {
    type: discount.percentOff ? 'percent' : 'fixed',
    value: discount.percentOff ?? (discount.amountOff ? discount.amountOff / 100 : 0),
    originalAmount,
    finalAmount,
    couponId: discount.id,
    couponName: discount.name,
  };
};
