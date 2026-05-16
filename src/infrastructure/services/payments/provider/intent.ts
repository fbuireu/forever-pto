import type { DiscountInfo } from '@application/dto/payment/types';
import { StripeServerService } from '@infrastructure/clients/payments/stripe/serverService';
import type { PaymentError } from '@infrastructure/errors';
import { Effect } from 'effect';
import type StripeNode from 'stripe';

interface CreatePaymentIntentParams {
  amount: number;
  email: string;
  promoCode?: string;
  discountInfo: DiscountInfo | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const createPaymentIntent = (
  params: CreatePaymentIntentParams
): Effect.Effect<StripeNode.PaymentIntent, PaymentError, StripeServerService> =>
  Effect.gen(function* () {
    const stripe = yield* StripeServerService;
    const { amount, email, promoCode, discountInfo, userAgent, ipAddress } = params;

    return yield* stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      description: discountInfo ? `Donation from ${email} (${promoCode} applied)` : `Donation from ${email}`,
      receipt_email: email,
      metadata: {
        type: 'donation',
        email,
        promoCode: promoCode ?? '',
        userAgent: userAgent ?? '',
        ipAddress: ipAddress ?? '',
        ...(discountInfo && {
          couponId: discountInfo.couponId,
          couponName: discountInfo.couponName ?? '',
          originalAmount: discountInfo.originalAmount.toFixed(2),
          discountType: discountInfo.type,
          discountValue: discountInfo.value.toString(),
          discountAmount: (discountInfo.originalAmount - discountInfo.finalAmount).toFixed(2),
        }),
        timestamp: new Date().toISOString(),
      },
      automatic_payment_methods: { enabled: true },
    });
  });
