import type { ChargeSucceededEvent } from '../events/types';
import { PaymentRepository } from '../repository/types';

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
    const result = await params.paymentRepository.updateCharge(
      event.paymentIntentId,
      event.chargeId,
      event.charge.receipt_url,
      event.charge.payment_method_details?.type || null,
      event.charge.billing_details?.address?.country || null
    );

    if (!result.success) {
      console.error('Failed to update charge info:', result.error);
    } else {
      console.log('Charge info updated successfully:', event.chargeId);
    }
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
  }
};
