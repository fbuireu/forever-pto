import type {
  CreatePaymentIntentParams,
  PaymentIntentResult,
  PaymentIntentService,
} from '@application/interfaces/payment-services';
import type Stripe from 'stripe';

export const createPaymentIntent = async (
  stripe: Stripe,
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> => {
  const { amount, email, promoCode, discountInfo, userAgent, ipAddress } = params;

  return await stripe.paymentIntents.create({
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
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

export const createPaymentIntentService = (stripe: Stripe): PaymentIntentService => ({
  create: async (params: CreatePaymentIntentParams): Promise<PaymentIntentResult> => {
    const intent = await createPaymentIntent(stripe, params);
    return {
      id: intent.id,
      created: intent.created,
      customer: intent.customer,
      latest_charge: intent.latest_charge,
      currency: intent.currency,
      status: intent.status,
      payment_method_types: intent.payment_method_types,
      description: intent.description,
      client_secret: intent.client_secret,
    };
  },
});
