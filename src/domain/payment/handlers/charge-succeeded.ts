import type { ChargeSucceededEvent } from '../events/types';
import type { PaymentRepository } from '../repository/types';

interface HandleChargeSucceededParams {
  paymentRepository: PaymentRepository;
}

export const handleChargeSucceeded = async (
  event: ChargeSucceededEvent,
  params: HandleChargeSucceededParams
): Promise<void> => {
  if (!event.paymentIntentId) {
    console.error('No payment intent ID found in charge');
    return;
  }

  try {
    const billingDetails = event.charge.billing_details;
    const paymentMethodDetails = event.charge.payment_method_details;
    const netAmount = event.charge.amount - (event.charge.application_fee_amount ?? 0);

    const result = await params.paymentRepository.updateCharge(
      event.paymentIntentId,
      event.chargeId,
      event.charge.receipt_url,
      paymentMethodDetails?.type ?? null,
      billingDetails?.address?.country ?? null,
      billingDetails?.name ?? null,
      billingDetails?.address?.postal_code ?? null,
      billingDetails?.address?.city ?? null,
      billingDetails?.address?.state ?? null,
      paymentMethodDetails?.card?.brand ?? null,
      paymentMethodDetails?.card?.last4 ?? null,
      event.charge.application_fee_amount ?? null,
      netAmount
    );

    if (!result.success) {
      console.error('Failed to update charge info:', result.error);
    } else {
      console.warn('Charge info updated successfully:', event.chargeId);
    }
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
  }
};
