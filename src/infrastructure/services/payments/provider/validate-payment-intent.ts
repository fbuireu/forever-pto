import type { PaymentValidationResult, PaymentValidator } from '@domain/payment/services/validators';
import type Stripe from 'stripe';

const validatePaymentIntent = async (stripe: Stripe, paymentIntentId: string): Promise<PaymentValidationResult> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return {
        valid: false,
        status: paymentIntent.status,
        paymentIntent,
        error: 'Payment not completed',
      };
    }

    const paymentEmail = paymentIntent.metadata.email ?? paymentIntent.receipt_email ?? undefined;

    return {
      valid: true,
      paymentEmail,
      status: paymentIntent.status,
      paymentIntent,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '',
    };
  }
};

export const createPaymentValidator = (stripe: Stripe): PaymentValidator => ({
  validatePaymentIntent: (paymentIntentId: string) => validatePaymentIntent(stripe, paymentIntentId),
});
