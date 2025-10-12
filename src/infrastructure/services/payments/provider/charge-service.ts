import type { ChargeService } from '@domain/payment/services/charge';
import type Stripe from 'stripe';

const retrieveCharge = async (
  stripe: Stripe,
  chargeId: string
): Promise<{
  success: boolean;
  data?: { id: string; receiptUrl: string | null; paymentMethodType: string | null };
  error?: string;
}> => {
  try {
    const charge = await stripe.charges.retrieve(chargeId);

    return {
      success: true,
      data: {
        id: charge.id,
        receiptUrl: charge.receipt_url,
        paymentMethodType: charge.payment_method_details?.type || null,
      },
    };
  } catch (error) {
    console.error('Error retrieving charge:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve charge',
    };
  }
};

export const createChargeService = (stripe: Stripe): ChargeService => ({
  retrieveCharge: (chargeId: string) => retrieveCharge(stripe, chargeId),
});
