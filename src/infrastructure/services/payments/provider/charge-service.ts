import type { ChargeService } from '@domain/payment/services/charge';
import type Stripe from 'stripe';

const retrieveCharge = async (
  stripe: Stripe,
  chargeId: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    receiptUrl: string | null;
    paymentMethodType: string | null;
    country: string | null;
    customerName: string | null;
    postalCode: string | null;
    city: string | null;
    state: string | null;
    paymentBrand: string | null;
    paymentLast4: string | null;
    feeAmount: number | null;
    netAmount: number | null;
  };
  error?: string;
}> => {
  try {
    const charge = await stripe.charges.retrieve(chargeId);
    const billingDetails = charge.billing_details;
    const paymentMethodDetails = charge.payment_method_details;
    const netAmount = charge.amount - (charge.application_fee_amount ?? 0);

    return {
      success: true,
      data: {
        id: charge.id,
        receiptUrl: charge.receipt_url,
        paymentMethodType: paymentMethodDetails?.type ?? null,
        country: billingDetails?.address?.country ?? null,
        customerName: billingDetails?.name ?? null,
        postalCode: billingDetails?.address?.postal_code ?? null,
        city: billingDetails?.address?.city ?? null,
        state: billingDetails?.address?.state ?? null,
        paymentBrand: paymentMethodDetails?.card?.brand ?? null,
        paymentLast4: paymentMethodDetails?.card?.last4 ?? null,
        feeAmount: charge.application_fee_amount ?? null,
        netAmount: netAmount,
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
