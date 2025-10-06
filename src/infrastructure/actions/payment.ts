'use server';

import { paymentDTO } from '@application/dto/payment/dto';
import type { PaymentDTO } from '@application/dto/payment/types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_AMOUNT = 1;
const MIN_FINAL_AMOUNT = 0.5;

type DiscountInfo = {
  type: 'percent' | 'fixed';
  value: number;
  originalAmount: number;
  finalAmount: number;
  couponId: string;
  couponName: string | null;
};

const validateAmount = (amount: unknown): amount is number => {
  return typeof amount === 'number' && amount > 0;
};

const validateEmail = (email: unknown): email is string => {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
};

const validatePromoCode = async (
  code: string,
  amount: number
): Promise<{ success: true; discountInfo: DiscountInfo } | { success: false; error: string }> => {
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase().trim(),
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return { success: false, error: 'Invalid or expired promo code' };
    }

    const promotion = promotionCodes.data[0];
    const coupon = promotion.coupon;

    if (!coupon.valid) {
      return { success: false, error: 'This promo code is no longer valid' };
    }

    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return { success: false, error: 'This promo code has reached its usage limit' };
    }

    if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
      return { success: false, error: 'This promo code has expired' };
    }

    let finalAmount = amount;

    if (coupon.percent_off) {
      finalAmount = amount * (1 - coupon.percent_off / 100);
    } else if (coupon.amount_off) {
      const discountEur = coupon.amount_off / 100;
      finalAmount = amount - discountEur;
    }

    if (finalAmount < MIN_FINAL_AMOUNT) {
      return {
        success: false,
        error: `Discount cannot reduce amount below ${MIN_FINAL_AMOUNT.toFixed(2)}`,
      };
    }

    return {
      success: true,
      discountInfo: {
        type: coupon.percent_off ? 'percent' : 'fixed',
        value: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
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

interface CreatePaymentIntentParams {
  amount: number;
  email: string;
  promoCode?: string;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentDTO> {
  try {
    const { amount, email, promoCode } = params;

    if (!validateAmount(amount)) {
      return paymentDTO.create({
        raw: {
          type: 'error',
          error: new Error(`Invalid amount. Minimum amount is ${MIN_AMOUNT}`),
        },
      });
    }

    if (!validateEmail(email)) {
      return paymentDTO.create({
        raw: {
          type: 'error',
          error: new Error('Valid email is required'),
        },
      });
    }

    let finalAmount = amount;
    let discountInfo: DiscountInfo | null = null;

    if (promoCode?.trim()) {
      const validation = await validatePromoCode(promoCode, amount);

      if (!validation.success) {
        return paymentDTO.create({
          raw: {
            type: 'error',
            error: new Error(validation.error),
          },
        });
      }

      discountInfo = validation.discountInfo;
      finalAmount = discountInfo.finalAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: 'eur',
      description: discountInfo ? `Donation from ${email} (${promoCode} applied)` : `Donation from ${email}`,
      receipt_email: email,
      metadata: {
        type: 'donation',
        email,
        promoCode: promoCode || '',
        ...(discountInfo && {
          couponId: discountInfo.couponId,
          couponName: discountInfo.couponName || '',
          originalAmount: discountInfo.originalAmount.toFixed(2),
          discountType: discountInfo.type,
          discountValue: discountInfo.value.toString(),
          discountAmount: (discountInfo.originalAmount - discountInfo.finalAmount).toFixed(2),
        }),
        timestamp: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentDTO.create({
      raw: {
        type: 'success',
        data: {
          paymentIntent,
          discountInfo,
        },
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error);

    const errorMessage =
      error instanceof Stripe.errors.StripeError ? error.message : 'An unexpected error occurred. Please try again.';

    return paymentDTO.create({
      raw: {
        type: 'error',
        error: new Error(errorMessage),
      },
    });
  }
}
