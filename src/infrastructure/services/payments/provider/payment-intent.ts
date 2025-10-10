import type { DiscountInfo } from '@application/dto/payment/types';
import type Stripe from 'stripe';

interface CreatePaymentIntentParams {
  amount: number;
  email: string;
  promoCode?: string;
  discountInfo: DiscountInfo | null;
}

export const createPaymentIntent = async (
  stripe: Stripe,
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> => {
  const { amount, email, promoCode, discountInfo } = params;

  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
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
};
