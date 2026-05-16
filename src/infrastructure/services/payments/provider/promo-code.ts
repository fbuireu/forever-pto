import type { DiscountInfo } from '@application/dto/payment/types';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/server-service';
import { PromoCodeError } from '@infrastructure/errors';
import { Effect } from 'effect';
import type Stripe from 'stripe';

const MIN_FINAL_AMOUNT = 0.5;

const getCouponValidationError = (coupon: Stripe.Coupon) => {
  if (!coupon.valid) return 'This promo code is no longer valid';
  if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions)
    return 'This promo code has reached its usage limit';
  if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) return 'This promo code has expired';
  return null;
};

const calculateFinalAmount = (coupon: Stripe.Coupon, amount: number) => {
  if (coupon.percent_off) return amount * (1 - coupon.percent_off / 100);
  if (coupon.amount_off) return amount - coupon.amount_off / 100;
  return amount;
};

export const validatePromoCode = (
  code: string,
  amount: number
): Effect.Effect<DiscountInfo, PromoCodeError, StripeServerService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeServerService;

    const promotionCodes = yield* stripe.promotionCodes
      .list({ code: code.toUpperCase().trim(), active: true, limit: 1 })
      .pipe(Effect.mapError((e) => new PromoCodeError({ message: e.message })));

    if (promotionCodes.data.length === 0) {
      return yield* Effect.fail(new PromoCodeError({ message: 'Invalid or expired promo code' }));
    }

    const [promotionCode] = promotionCodes.data;
    const couponData = yield* stripe.promotionCodes
      .retrieve(promotionCode.id, { expand: ['coupon'] })
      .pipe(Effect.mapError((e) => new PromoCodeError({ message: e.message })));

    const coupon = (couponData as unknown as { coupon: Stripe.Coupon }).coupon;
    if (!coupon) return yield* Effect.fail(new PromoCodeError({ message: 'Failed to load coupon details' }));

    const validationError = getCouponValidationError(coupon);
    if (validationError) return yield* Effect.fail(new PromoCodeError({ message: validationError }));

    const finalAmount = calculateFinalAmount(coupon, amount);
    if (finalAmount < MIN_FINAL_AMOUNT) {
      return yield* Effect.fail(
        new PromoCodeError({ message: `Discount cannot reduce amount below ${MIN_FINAL_AMOUNT.toFixed(2)}` })
      );
    }

    return {
      type: coupon.percent_off ? 'percent' : 'fixed',
      value: coupon.percent_off ?? (coupon.amount_off ? coupon.amount_off / 100 : 0),
      originalAmount: amount,
      finalAmount,
      couponId: coupon.id,
      couponName: coupon.name,
    } satisfies DiscountInfo;
  });
