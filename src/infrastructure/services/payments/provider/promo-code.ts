import type { PromoCodeService } from '@application/interfaces/payment-services';
import {
  createDiscountInfo,
  type PromoCodeDiscount,
  type PromoCodeValidation,
  type PromoValidationResult,
  validateMinimumAmount,
  validatePromoCodeRules,
} from '@domain/payment/services/promo-code';
import type { Logger } from '@domain/shared/types';
import type Stripe from 'stripe';

export const validatePromoCode = async (
  stripe: Stripe,
  code: string,
  amount: number,
  logger: Logger
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

    const validation: PromoCodeValidation = {
      valid: coupon.valid,
      maxRedemptions: coupon.max_redemptions ?? undefined,
      timesRedeemed: coupon.times_redeemed,
      redeemBy: coupon.redeem_by ?? undefined,
    };

    const validationError = validatePromoCodeRules(validation);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const discount: PromoCodeDiscount = {
      percentOff: coupon.percent_off ?? undefined,
      amountOff: coupon.amount_off ?? undefined,
      id: coupon.id,
      name: coupon.name,
    };

    const discountInfo = createDiscountInfo(discount, amount);

    const minimumAmountError = validateMinimumAmount(discountInfo.finalAmount);
    if (minimumAmountError) {
      return { success: false, error: minimumAmountError };
    }

    return {
      success: true,
      data: discountInfo,
    };
  } catch (error) {
    logger.logError('Promo code validation error in promo-code service', error, {
      promoCode: code?.toUpperCase().trim().slice(0, 5) + '...',
      amount,
    });
    return { success: false, error: 'Error validating promo code. Please try again.' };
  }
};

export const createPromoCodeService = (stripe: Stripe, logger: Logger): PromoCodeService => ({
  validate: (code: string, amount: number) => validatePromoCode(stripe, code, amount, logger),
});
