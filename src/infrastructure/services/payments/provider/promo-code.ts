import type { DiscountInfo } from '@application/dto/payment/types';
import type Stripe from 'stripe';

const MIN_FINAL_AMOUNT = 0.5;

type PromoValidationResult = { success: true; data: DiscountInfo } | { success: false; error: string };

const getCouponValidationError = (coupon: Stripe.Coupon): string | null => {
  if (!coupon.valid) return 'This promo code is no longer valid';
  if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
    return 'This promo code has reached its usage limit';
  }
  if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
    return 'This promo code has expired';
  }
  return null;
};

const calculateFinalAmount = (coupon: Stripe.Coupon, amount: number): number => {
  if (coupon.percent_off) return amount * (1 - coupon.percent_off / 100);
  if (coupon.amount_off) return amount - coupon.amount_off / 100;
  return amount;
};

export const validatePromoCode = async (
  stripe: Stripe,
  code: string,
  amount: number
): Promise<PromoValidationResult> => {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase().trim(),
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return { success: false, error: 'Invalid or expired promo code' };
    }

    const promotionCode = promotionCodes.data[0];
    const couponData = await stripe.promotionCodes.retrieve(promotionCode.id, {
      expand: ['coupon'],
    });

    const coupon = (couponData as unknown as { coupon: Stripe.Coupon }).coupon;

    if (!coupon) {
      return { success: false, error: 'Failed to load coupon details' };
    }

    const validationError = getCouponValidationError(coupon);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const finalAmount = calculateFinalAmount(coupon, amount);

    if (finalAmount < MIN_FINAL_AMOUNT) {
      return {
        success: false,
        error: `Discount cannot reduce amount below ${MIN_FINAL_AMOUNT.toFixed(2)}`,
      };
    }

    return {
      success: true,
      data: {
        type: coupon.percent_off ? 'percent' : 'fixed',
        value: coupon.percent_off ?? (coupon.amount_off ? coupon.amount_off / 100 : 0),
        originalAmount: amount,
        finalAmount,
        couponId: coupon.id,
        couponName: coupon.name,
      },
    };
  } catch (error) {
    console.error('Promo code validation error:', error);
    return { success: false, error: 'Error validating promo code. Please try again.' };
  }
};
